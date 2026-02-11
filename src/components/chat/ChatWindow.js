import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  Smile,
  MoreVertical,
} from "lucide-react";

const ChatWindow = ({
  conversation,
  messages,
  onSendMessage,
  currentUserId,
}) => {
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending || !conversation) return;

    setIsSending(true);
    try {
      await onSendMessage(newMessage);
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getOtherParticipants = () => {
    if (!conversation) return [];
    return conversation.participants.filter((p) => p.user_id !== currentUserId);
  };

  const getConversationName = () => {
    if (!conversation) return ""; // In ChatWindow.jsx

    const getOtherParticipants = () => {
      if (!conversation || !Array.isArray(conversation.participants)) {
        return [];
      }
      return conversation.participants.filter(
        (p) => p.user_id !== currentUserId,
      );
    };

    const getConversationName = () => {
      if (!conversation) return "";
      if (conversation.is_group && conversation.name) {
        return conversation.name;
      }
      const others = getOtherParticipants();
      return others
        .map((p) => p.profile?.full_name || "Unknown User")
        .join(", ");
    };

    if (conversation.is_group && conversation.name) {
      return conversation.name;
    }

    const others = getOtherParticipants();
    return others.map((p) => p.profile?.full_name || "Unknown User").join(", ");
  };

  if (!conversation) {
    return (
      <div className="flex flex-col h-full bg-white rounded-xl shadow items-center justify-center p-8">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Send className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No conversation selected
        </h3>
        <p className="text-gray-600 text-center mb-4">
          Select a conversation from the list to start messaging
        </p>
      </div>
    );
  }

  const otherParticipants = getOtherParticipants();

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow">
      {/* Chat Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                {conversation.is_group ? (
                  <div className="w-10 h-10 bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-medium">
                      {conversation.name?.charAt(0) || "G"}
                    </span>
                  </div>
                ) : otherParticipants[0]?.profile?.avatar_url ? (
                  <img
                    src={otherParticipants[0].profile.avatar_url}
                    alt={otherParticipants[0].profile.full_name || "User"}
                    className="w-10 h-10 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-600 font-medium">
                      {otherParticipants[0]?.profile?.full_name?.charAt(0) ||
                        "U"}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                {getConversationName()}
              </h3>
              <div className="flex items-center gap-2">
                {otherParticipants.length > 0 && (
                  <span className="text-xs text-gray-500">
                    {otherParticipants
                      .map((p) => p.profile?.role || "user")
                      .join(", ")}
                  </span>
                )}
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-green-600">
                  {otherParticipants.length === 1
                    ? "Online"
                    : `${otherParticipants.length} members`}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No messages yet. Start the conversation!
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === currentUserId ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-[70%]">
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      message.sender_id === currentUserId
                        ? "bg-[#FF1E00] text-white rounded-tr-none"
                        : "bg-white text-gray-800 rounded-tl-none shadow-sm"
                    }`}
                  >
                    {message.parent_message && (
                      <div
                        className={`mb-2 p-2 rounded-lg text-sm ${message.sender_id === currentUserId ? "bg-red-400/20" : "bg-gray-100"}`}
                      >
                        <div className="font-medium">
                          {message.parent_message.sender_id === currentUserId
                            ? "You"
                            : message.parent_message.sender?.full_name}
                        </div>
                        <div className="truncate">
                          {message.parent_message.content}
                        </div>
                      </div>
                    )}

                    <div className="break-words">{message.content}</div>

                    {message.media_url && (
                      <div className="mt-2">
                        <img
                          src={message.media_url}
                          alt="Attachment"
                          className="rounded-lg max-w-full h-auto"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-end mt-1">
                      <span
                        className={`text-xs ${message.sender_id === currentUserId ? "text-red-100" : "text-gray-500"}`}
                      >
                        {formatTime(message.created_at)}
                      </span>
                      {message.sender_id === currentUserId && (
                        <span className="ml-2 text-xs text-red-100">
                          {message.read_by && message.read_by.length > 1
                            ? "Read"
                            : "Sent"}
                        </span>
                      )}
                    </div>
                  </div>

                  {message.reactions && message.reactions.length > 0 && (
                    <div className="mt-1 flex gap-1">
                      {message.reactions.map((reaction) => (
                        <span
                          key={reaction.id}
                          className="text-xs bg-white border rounded-full px-2 py-1"
                        >
                          {reaction.emoji}{" "}
                          {reaction.profile?.full_name?.split(" ")[0]}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Paperclip className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <ImageIcon className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Smile className="w-5 h-5 text-gray-600" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message here..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            disabled={isSending}
          />
          <button
            onClick={handleSend}
            disabled={isSending || !newMessage.trim()}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
              isSending || !newMessage.trim()
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-[#FF1E00] text-white hover:bg-[#E01B00] transition-colors"
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
