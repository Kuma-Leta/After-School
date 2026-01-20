// src/app/dashboard/messages/page.js
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";

export default function MessagesPage() {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [newMessage, setNewMessage] = useState("");

  // Mock conversations data
  const mockConversations = [
    {
      id: 1,
      name: "Sarah Johnson",
      avatar: "👩‍🏫",
      lastMessage: "Looking forward to our meeting tomorrow!",
      time: "10:30 AM",
      unread: 2,
      online: true,
      role: "Teacher",
    },
    {
      id: 2,
      name: "St. Mary's School",
      avatar: "🏫",
      lastMessage: "Your application has been shortlisted",
      time: "Yesterday",
      unread: 0,
      online: false,
      role: "School",
    },
    {
      id: 3,
      name: "Michael Chen",
      avatar: "👨‍💼",
      lastMessage: "Can you send me your availability for next week?",
      time: "2 days ago",
      unread: 1,
      online: true,
      role: "Parent",
    },
    {
      id: 4,
      name: "Ethio Education NGO",
      avatar: "🤝",
      lastMessage: "Thank you for your interest in our program",
      time: "3 days ago",
      unread: 0,
      online: false,
      role: "NGO",
    },
    {
      id: 5,
      name: "Alex Turner",
      avatar: "👨‍🎓",
      lastMessage: "I need help with math homework",
      time: "1 week ago",
      unread: 0,
      online: true,
      role: "Student",
    },
  ];

  // Mock messages for selected conversation
  const mockChatMessages = [
    {
      id: 1,
      sender: "them",
      text: "Hi! Are you available for tutoring this weekend?",
      time: "10:00 AM",
    },
    {
      id: 2,
      sender: "you",
      text: "Yes, I'm available on Saturday afternoon.",
      time: "10:05 AM",
    },
    {
      id: 3,
      sender: "them",
      text: "Perfect! What time works for you?",
      time: "10:07 AM",
    },
    { id: 4, sender: "you", text: "How about 2 PM?", time: "10:10 AM" },
    {
      id: 5,
      sender: "them",
      text: "2 PM works great. Looking forward to it!",
      time: "10:15 AM",
    },
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
      setMessages(mockConversations);
      setSelectedMessage(mockConversations[0]);
    }, 1000);
  }, []);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    // In a real app, you would send this to your backend
    console.log("Sending message:", newMessage);

    // Clear input
    setNewMessage("");

    // Show success message
    alert(
      "Message sent! (This is a placeholder - implement real messaging later)",
    );
  };

  if (loading) {
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
              <h1 className="text-2xl md:text-3xl font-bold text-[#1F1F1F]">
                Messages
              </h1>
              <p className="text-gray-600 mt-1">
                Connect with schools, students, and parents
              </p>
            </div>
            <button className="px-4 py-2 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] transition-colors font-medium">
              + New Message
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Conversations</p>
                <p className="text-2xl font-bold text-[#1F1F1F]">24</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-lg">💬</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unread Messages</p>
                <p className="text-2xl font-bold text-[#1F1F1F]">3</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-red-600 text-lg">🔔</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Now</p>
                <p className="text-2xl font-bold text-[#1F1F1F]">7</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-lg">🟢</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Response Rate</p>
                <p className="text-2xl font-bold text-[#1F1F1F]">94%</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-lg">📈</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
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
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {messages.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedMessage(conversation)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${selectedMessage?.id === conversation.id ? "bg-blue-50" : ""}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                        {conversation.avatar}
                      </div>
                      {conversation.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-[#1F1F1F] truncate">
                          {conversation.name}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {conversation.time}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessage}
                        </p>
                        {conversation.unread > 0 && (
                          <span className="bg-[#FF1E00] text-white text-xs px-2 py-0.5 rounded-full">
                            {conversation.unread}
                          </span>
                        )}
                      </div>
                      <div className="mt-1">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">
                          {conversation.role}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Window */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow overflow-hidden flex flex-col">
            {selectedMessage ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">
                        {selectedMessage.avatar}
                      </div>
                      <div>
                        <h3 className="font-medium text-[#1F1F1F]">
                          {selectedMessage.name}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-xs ${selectedMessage.online ? "text-green-600" : "text-gray-500"}`}
                          >
                            {selectedMessage.online ? "Online" : "Offline"}
                          </span>
                          <span className="text-xs text-gray-500 capitalize">
                            • {selectedMessage.role}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-600 hover:text-[#1F1F1F]">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      </button>
                      <button className="p-2 text-gray-600 hover:text-[#1F1F1F]">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                  <div className="space-y-4">
                    {mockChatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === "you" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-2 ${msg.sender === "you" ? "bg-[#FF1E00] text-white rounded-tr-none" : "bg-white text-gray-800 rounded-tl-none shadow-sm"}`}
                        >
                          <p>{msg.text}</p>
                          <p
                            className={`text-xs mt-1 ${msg.sender === "you" ? "text-red-100" : "text-gray-500"}`}
                          >
                            {msg.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-600 hover:text-[#1F1F1F]">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        />
                      </svg>
                    </button>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                      placeholder="Type your message here..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="px-4 py-2 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] transition-colors font-medium"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">💬</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No conversation selected
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Select a conversation from the list to start messaging
                  </p>
                  <button className="px-4 py-2 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] transition-colors font-medium">
                    Start New Conversation
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Placeholder Note */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <span className="text-yellow-800 text-sm font-medium">
                Placeholder Component
              </span>
              <p className="text-yellow-700 text-sm mt-1">
                This is a placeholder messages component. To implement real-time
                messaging, you&apos;ll need to: 1. Set up a WebSocket server or
                use a service like Supabase Realtime 2. Create a messages table
                in your database 3. Implement message sending/receiving logic 4.
                Add message persistence and read receipts
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
