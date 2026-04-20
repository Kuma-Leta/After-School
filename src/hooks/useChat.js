import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { getEmployerContactEntitlement } from "@/lib/services/contact-entitlement";

export const useChat = () => {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    [],
  );

  // Create a new conversation
  // In useChat.js - improved createConversation
  const canContactParticipant = useCallback(async (candidateId) => {
    return getEmployerContactEntitlement({
      candidateId,
      requireApplication: true,
    });
  }, []);

  const createConversation = useCallback(
    async (participantIds, isGroup = false, name, avatarUrl) => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session?.user) throw new Error("No active session");

        const userId = session.user.id;

        // Centralized contact entitlement check for each target participant.
        for (const participantId of participantIds || []) {
          if (!participantId || participantId === userId) continue;

          const entitlement = await canContactParticipant(participantId);
          if (!entitlement.allowed) {
            throw new Error(
              entitlement.message ||
                "You are not allowed to contact this candidate.",
            );
          }
        }

        // 1. Create conversation via RPC (returns basic fields)
        const { data: conversation, error } = await supabase.rpc(
          "create_conversation_with_participants",
          {
            p_is_group: isGroup,
            p_name: name || null,
            p_avatar_url: avatarUrl || null,
            p_participant_ids: [userId, ...participantIds],
            p_creator_id: userId,
          },
        );

        if (error) throw error;

        // 2. Fetch the full conversation with participants and profiles
        const { data: fullConversation, error: fetchError } = await supabase
          .from("conversations")
          .select(
            `
        *,
        participants:conversation_participants(
          *,
          profile:profiles(*)
        )
      `,
          )
          .eq("id", conversation.id)
          .single();

        if (fetchError) throw fetchError;

        // 3. Refresh the conversations list
        await fetchConversations();

        // 4. Return the FULL conversation object
        return fullConversation;
      } catch (err) {
        console.error("Create conversation error:", err.message || err);
        setError(err.message || "Failed to create conversation");
        throw err;
      }
    },
    [canContactParticipant, fetchConversations],
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
  };
};
