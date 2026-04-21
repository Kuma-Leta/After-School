import React from "react";
import { UserCircle, Users, School, Building } from "lucide-react";

const ConversationList = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onStartNewChat,
  currentUserId,
}) => {
  const getConversationName = (conversation) => {
    if (conversation.is_group && conversation.name) {
      return conversation.name;
    }

    const otherParticipants = conversation.participants
      .filter((p) => p.user_id !== currentUserId)
      .map((p) => p.profile?.full_name || "Unknown User");

    return otherParticipants.join(", ") || "Empty Conversation";
  };

  const getConversationAvatar = (conversation) => {
    if (conversation.is_group) {
      if (conversation.avatar_url) {
        return (
          <img
            src={conversation.avatar_url}
            alt={conversation.name || "Group"}
            className="w-12 h-12 rounded-full object-cover"
          />
        );
      }
      return <Users className="w-12 h-12 text-gray-400" />;
    }

    const otherParticipant = conversation.participants.find(
      (p) => p.user_id !== currentUserId,
    );

    if (otherParticipant?.profile?.avatar_url) {
      return (
        <img
          src={otherParticipant.profile.avatar_url}
          alt={otherParticipant.profile.full_name || "User"}
          className="w-12 h-12 rounded-full object-cover"
        />
      );
    }

    const role = otherParticipant?.profile?.role;
    switch (role) {
      case "teacher":
        return <School className="w-12 h-12 text-blue-500" />;
      case "school":
        return <Building className="w-12 h-12 text-green-500" />;
      default:
        return <UserCircle className="w-12 h-12 text-gray-400" />;
    }
  };

  const getLastMessageTime = (conversation) => {
    if (!conversation.last_message_at) return "";

    const date = new Date(conversation.last_message_at);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Messages</h2>
          <button
            onClick={onStartNewChat}
            className="px-4 py-2 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] transition-colors font-medium flex items-center gap-2"
          >
            <span>New Chat</span>
          </button>
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full px-4 py-2 pl-10 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
          />
          <svg
            className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No conversations yet
            </h3>
            <p className="text-gray-600 mb-4">
              Start a conversation with schools, teachers, or parents
            </p>
            <button
              onClick={onStartNewChat}
              className="px-4 py-2 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] transition-colors font-medium"
            >
              Start Your First Conversation
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedConversationId === conversation.id ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden bg-gray-100">
                      {getConversationAvatar(conversation)}
                    </div>
                    {conversation.participants.some(
                      (p) =>
                        p.profile?.role === "student" &&
                        p.user_id !== currentUserId,
                    ) && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 truncate">
                        {getConversationName(conversation)}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {getLastMessageTime(conversation)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.last_message?.content ||
                          "No messages yet"}
                      </p>
                      {conversation.unread_count &&
                      conversation.unread_count > 0 ? (
                        <span className="bg-[#FF1E00] text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                          {conversation.unread_count}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      {conversation.is_group ? (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
                          Group
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                          {conversation.participants.find(
                            (p) => p.user_id !== currentUserId,
                          )?.profile?.role || "User"}
                        </span>
                      )}
                      {!!conversation.is_governed_thread && (
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            conversation.thread_state === "closed"
                              ? "bg-gray-100 text-gray-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {conversation.thread_state === "closed"
                            ? "Closed"
                            : "Governed"}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {conversation.participants.length} participant
                        {conversation.participants.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
