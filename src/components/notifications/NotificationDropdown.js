// components/notifications/NotificationDropdown.js
"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bell,
  Check,
  Trash2,
  ExternalLink,
  MessageSquare,
  Calendar,
  FileText,
  Users,
  Award,
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import Link from "next/link";
import * as NotificationService from "@/lib/supabase/notifications";

const typeIcons = {
  message: MessageSquare,
  event: Calendar,
  assignment: FileText,
  announcement: MessageSquare,
  friend_request: Users,
  club_invitation: Users,
  grade: Award,
  info: Bell,
  success: Bell,
  warning: Bell,
  error: Bell,
};

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none transition-colors duration-200"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex items-center justify-center rounded-full h-5 w-5 bg-red-500 text-xs text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Notifications
              </h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Mark all read
                  </button>
                )}
                <Link
                  href="/notifications"
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  View all
                </Link>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No notifications yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  We&apos;ll notify you when something happens
                </p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => {
                const Icon = typeIcons[notification.type] || Bell;
                const colorClass =
                  NotificationService.getNotificationColorClass(
                    notification.type,
                  );

                return (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.read ? "bg-blue-50" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`flex-shrink-0 h-10 w-10 rounded-full ${colorClass.split(" ")[0]} ${colorClass.split(" ")[1]} flex items-center justify-center`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </p>
                          <span className="text-xs text-gray-500">
                            {NotificationService.formatNotificationTime(
                              notification.created_at,
                            )}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}
                          >
                            {NotificationService.getNotificationTypeLabel(
                              notification.type,
                            )}
                          </span>
                          {!notification.read && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Unread
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="text-xs text-gray-400 hover:text-red-600 flex items-center ml-auto"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {notifications.length > 10 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <Link
                href="/notifications"
                className="block text-center text-sm font-medium text-blue-600 hover:text-blue-800"
                onClick={() => setIsOpen(false)}
              >
                View all {notifications.length} notifications
              </Link>
            </div>
          )}

          <div className="p-3 border-t border-gray-200">
            <Link
              href="/notifications/settings"
              className="block text-center text-sm text-gray-600 hover:text-gray-900"
              onClick={() => setIsOpen(false)}
            >
              Notification settings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
