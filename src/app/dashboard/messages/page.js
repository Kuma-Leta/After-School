"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useChat } from "@/hooks/useChat";
import ConversationList from "@/components/chat/ConversationList";
import ChatWindow from "@/components/chat/ChatWindow";
import NewChatModal from "@/components/chat/NewChatModal";
import { MessageSquare, Users, Clock, TrendingUp } from "lucide-react";

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const autoOpeningConversationRef = useRef(false);

  const {
    conversations,
    messages,
    loading,
    error,
    fetchMessages,
    sendMessage,
    createConversation,
    markMessagesAsRead,
    closeConversationThread,
  } = useChat();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (!user?.id) {
        setCurrentUserRole(null);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      setCurrentUserRole(profile?.role || null);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation, fetchMessages]);

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    markMessagesAsRead(conversation.id);
  };

  const handleSendMessage = async (content) => {
    if (!selectedConversation) return;
    await sendMessage(selectedConversation.id, content);
  };

  const handleCreateConversation = async (participantIds, isGroup, name) => {
    const conversation = await createConversation(
      participantIds,
      isGroup,
      name,
    );
    setSelectedConversation(conversation);
    setShowNewChatModal(false);
  };

  useEffect(() => {
    const candidateId = searchParams.get("candidateId");

    if (
      !candidateId ||
      !currentUser?.id ||
      autoOpeningConversationRef.current ||
      selectedConversation
    ) {
      return;
    }

    const existingConversation = conversations.find((conversation) => {
      const participantIds = (conversation.participants || []).map(
        (participant) =>
          participant.user_id || participant.profile_id || participant.id,
      );

      return participantIds.includes(candidateId);
    });

    if (existingConversation) {
      startTransition(() => {
        setSelectedConversation(existingConversation);
      });
      return;
    }

    let isCancelled = false;
    autoOpeningConversationRef.current = true;

    createConversation([candidateId], false)
      .then((conversation) => {
        if (!isCancelled && conversation) {
          setSelectedConversation(conversation);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!isCancelled) {
          autoOpeningConversationRef.current = false;
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [
    searchParams,
    currentUser,
    selectedConversation,
    conversations,
    createConversation,
  ]);

  // Calculate stats
  const totalConversations = conversations.length;
  const unreadMessages = conversations.reduce(
    (sum, conv) => sum + (conv.unread_count || 0),
    0,
  );
  const activeConversations = conversations.filter(
    (conv) => !!(conv.last_message_at || conv.created_at),
  ).length;
  const responseRate =
    conversations.length > 0
      ? Math.round(
          (conversations.filter((conv) => conv.unread_count === 0).length /
            conversations.length) *
            100,
        )
      : 100;

  if (loading && conversations.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
                ))}
              </div>
              <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                <div className="h-64 bg-gray-100 rounded mb-4"></div>
                <div className="h-12 bg-gray-100 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Messages
              </h1>
              <p className="text-gray-600 mt-1">
                Connect with schools, students, and parents
              </p>
            </div>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="px-4 py-2 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] transition-colors font-medium flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>New Message</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <span className="text-red-600 text-sm font-medium">
                Error: {error}
              </span>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Conversations</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalConversations}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unread Messages</p>
                <p className="text-2xl font-bold text-gray-900">
                  {unreadMessages}
                </p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <div className="relative">
                  <MessageSquare className="w-5 h-5 text-red-600" />
                  {unreadMessages > 0 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Today</p>
                <p className="text-2xl font-bold text-gray-900">
                  {activeConversations}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Response Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {responseRate}%
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-280px)]">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <ConversationList
              conversations={conversations}
              selectedConversationId={selectedConversation?.id}
              onSelectConversation={handleSelectConversation}
              onStartNewChat={() => setShowNewChatModal(true)}
              currentUserId={currentUser?.id || ""}
            />
          </div>

          {/* Chat Window */}
          <div className="lg:col-span-2">
            <ChatWindow
              conversation={selectedConversation}
              messages={messages[selectedConversation?.id] || []}
              onSendMessage={handleSendMessage}
              onCloseThread={closeConversationThread}
              currentUserId={currentUser?.id || ""}
              currentUserRole={currentUserRole}
            />
          </div>
        </div>

        {/* New Chat Modal */}
        <NewChatModal
          isOpen={showNewChatModal}
          onClose={() => setShowNewChatModal(false)}
          onCreateConversation={handleCreateConversation}
          currentUserId={currentUser?.id || ""}
        />
      </div>
    </div>
  );
}
