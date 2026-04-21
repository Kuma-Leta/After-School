import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  canCloseThread,
  evaluateSendPermission,
  THREAD_STATES,
} from "@/lib/chat/thread-governance";

export const useChat = () => {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const appendThreadAudit = useCallback(
    async ({ conversationId, actorId, action, previousState, newState }) => {
      if (!conversationId || !actorId || !action) return;

      try {
        await supabase.from("conversation_thread_audit").insert({
          conversation_id: conversationId,
          actor_id: actorId,
          action,
          previous_state: previousState || null,
          new_state: newState || null,
          metadata: {
            timestamp: new Date().toISOString(),
          },
        });
      } catch (auditError) {
        console.error("Failed to write thread audit event:", auditError);
      }
    },
    [],
  );

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("conversations")
        .select(
          `
          *,
          participants:conversation_participants(
            *,
            profile:profiles(*)
          ),
          last_message:messages(
            *,
            sender:profiles(*)
          )
        `,
        )
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Calculate unread counts
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;

      if (!userId) {
        setConversations(data || []);
        return;
      }

      const conversationsWithUnread = await Promise.all(
        (data || []).map(async (conv) => {
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .not("read_by", "cs", `{${userId}}`);

          return {
            ...conv,
            unread_count: count || 0,
            last_message: conv.last_message?.[0],
          };
        }),
      );

      setConversations(conversationsWithUnread);
    } catch (err) {
      setError(err.message || "Failed to fetch conversations");
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (conversationId) => {
    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;

      if (!userId) return;

      // Get unread messages
      const { data: unreadMessages } = await supabase
        .from("messages")
        .select("id, read_by")
        .eq("conversation_id", conversationId)
        .not("read_by", "cs", `{${userId}}`);

      if (!unreadMessages?.length) return;

      // Update each message
      for (const message of unreadMessages) {
        await supabase
          .from("messages")
          .update({
            read_by: [...(message.read_by || []), userId],
          })
          .eq("id", message.id);
      }

      // Update conversations list
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, unread_count: 0 } : conv,
        ),
      );
    } catch (err) {
      console.error("Failed to mark messages as read:", err);
    }
  }, []);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(
    async (conversationId) => {
      try {
        const { data, error } = await supabase
          .from("messages")
          .select(
            `
          *,
          sender:profiles(*),
          reactions:message_reactions(
            *,
            profile:profiles(*)
          ),
          parent_message:messages(
            *,
            sender:profiles(*)
          )
        `,
          )
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (error) throw error;

        setMessages((prev) => ({
          ...prev,
          [conversationId]: data || [],
        }));

        // Mark messages as read
        await markMessagesAsRead(conversationId);
      } catch (err) {
        setError(err.message || "Failed to fetch messages");
      }
    },
    [markMessagesAsRead],
  );

  // Send a message
  const sendMessage = useCallback(
    async (conversationId, content, messageType = "text", mediaUrl) => {
      try {
        const user = await supabase.auth.getUser();
        const userId = user.data.user?.id;

        if (!userId) throw new Error("User not authenticated");

        const [
          { data: senderProfile, error: senderProfileError },
          { data: conversation, error: conversationError },
        ] = await Promise.all([
          supabase.from("profiles").select("role").eq("id", userId).single(),
          supabase
            .from("conversations")
            .select(
              `
                *,
                participants:conversation_participants(
                  *,
                  profile:profiles(id, role, full_name)
                )
                `,
            )
            .eq("id", conversationId)
            .single(),
        ]);

        if (senderProfileError) throw senderProfileError;
        if (conversationError) throw conversationError;

        const permission = evaluateSendPermission({
          conversation,
          senderId: userId,
          senderRole: senderProfile?.role,
        });

        if (!permission.allowed) {
          throw new Error(
            permission.message || "You are not allowed to send to this thread.",
          );
        }

        if (permission.nextState) {
          await supabase
            .from("conversations")
            .update({
              thread_state: permission.nextState,
              updated_at: new Date().toISOString(),
            })
            .eq("id", conversationId);

          await appendThreadAudit({
            conversationId,
            actorId: userId,
            action: permission.auditAction || "state_transition",
            previousState:
              conversation?.thread_state || THREAD_STATES.EMPLOYER_INITIATED,
            newState: permission.nextState,
          });
        }

        const { data, error } = await supabase
          .from("messages")
          .insert({
            conversation_id: conversationId,
            sender_id: userId,
            content,
            message_type: messageType,
            media_url: mediaUrl,
          })
          .select(
            `
          *,
          sender:profiles(*)
        `,
          )
          .single();

        if (error) throw error;

        // Update conversation's last_message_at
        await supabase
          .from("conversations")
          .update({
            last_message_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", conversationId);

        // Update local state
        setMessages((prev) => ({
          ...prev,
          [conversationId]: [...(prev[conversationId] || []), data],
        }));

        return data;
      } catch (err) {
        setError(err.message || "Failed to send message");
        throw err;
      }
    },
    [appendThreadAudit],
  );

  // Create a new conversation
  // In useChat.js - improved createConversation
  const createConversation = useCallback(
    async (participantIds, isGroup = false, name, avatarUrl) => {
      try {
        const response = await fetch("/api/chat/conversations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            participantIds,
            isGroup,
            name,
            avatarUrl,
          }),
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload?.error || "Failed to create conversation");
        }

        // Refresh the conversations list
        await fetchConversations();

        return payload?.conversation;
      } catch (err) {
        console.error("Create conversation error:", err.message || err);
        setError(err.message || "Failed to create conversation");
        throw err;
      }
    },
    [fetchConversations],
  );

  const closeConversationThread = useCallback(
    async (conversationId) => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user?.id) {
          throw new Error("User not authenticated");
        }

        const [
          { data: actorProfile, error: actorProfileError },
          { data: conversation, error: conversationError },
        ] = await Promise.all([
          supabase.from("profiles").select("role").eq("id", user.id).single(),
          supabase
            .from("conversations")
            .select(
              `
                *,
                participants:conversation_participants(
                  *,
                  profile:profiles(id, role, full_name)
                )
                `,
            )
            .eq("id", conversationId)
            .single(),
        ]);

        if (actorProfileError) throw actorProfileError;
        if (conversationError) throw conversationError;

        const closePermission = canCloseThread({
          conversation,
          actorRole: actorProfile?.role,
        });

        if (!closePermission.allowed) {
          throw new Error(
            closePermission.message || "You cannot close this thread.",
          );
        }

        const previousState =
          conversation?.thread_state || THREAD_STATES.EMPLOYER_INITIATED;

        const { error: closeError } = await supabase
          .from("conversations")
          .update({
            thread_state: THREAD_STATES.CLOSED,
            closed_by: user.id,
            closed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", conversationId);

        if (closeError) throw closeError;

        await appendThreadAudit({
          conversationId,
          actorId: user.id,
          action: "thread_closed",
          previousState,
          newState: THREAD_STATES.CLOSED,
        });

        setConversations((prev) =>
          prev.map((conversationItem) =>
            conversationItem.id === conversationId
              ? {
                  ...conversationItem,
                  thread_state: THREAD_STATES.CLOSED,
                  closed_by: user.id,
                  closed_at: new Date().toISOString(),
                }
              : conversationItem,
          ),
        );
      } catch (closeThreadError) {
        setError(closeThreadError.message || "Failed to close thread");
        throw closeThreadError;
      }
    },
    [appendThreadAudit],
  );

  // Set up real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel("chat-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const newMessage = payload.new;

          // If the message is for a conversation we're viewing, add it
          if (messages[newMessage.conversation_id]) {
            const { data: fullMessage } = await supabase
              .from("messages")
              .select(
                `
                *,
                sender:profiles(*)
              `,
              )
              .eq("id", newMessage.id)
              .single();

            if (fullMessage) {
              setMessages((prev) => ({
                ...prev,
                [newMessage.conversation_id]: [
                  ...(prev[newMessage.conversation_id] || []),
                  fullMessage,
                ],
              }));
            }
          }

          // Update conversation list
          await fetchConversations();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [messages, fetchConversations]);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    messages,
    loading,
    error,
    fetchConversations,
    fetchMessages,
    sendMessage,
    createConversation,
    markMessagesAsRead,
    closeConversationThread,
  };
};
