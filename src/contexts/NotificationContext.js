// contexts/NotificationContext.js (Alternative - No auth-helpers dependency)
"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import * as NotificationService from "@/lib/supabase/notifications";

const NotificationContext = createContext({});

export function NotificationProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  // Get user from Supabase auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        setUserId(null);
        setUnreadCount(0);
        setHasNewNotification(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      setHasNewNotification(false);
      setIsLoading(false);
      return;
    }

    // Get initial unread count
    const fetchUnreadCount = async () => {
      try {
        setIsLoading(true);
        const result = await NotificationService.getUnreadCount(userId);
        if (result.success) {
          setUnreadCount(result.count);
        }
      } catch (error) {
        console.error("Error fetching unread count:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnreadCount();

    // Subscribe to real-time notifications
    const channel = NotificationService.subscribeToNotifications(
      userId,
      (notification) => {
        if (notification && !notification.read) {
          setUnreadCount((prev) => prev + 1);
          setHasNewNotification(true);

          // Reset new notification flag after 5 seconds
          setTimeout(() => setHasNewNotification(false), 5000);
        }
      },
    );

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId]);

  const value = {
    unreadCount,
    hasNewNotification,
    isLoading,
    userId,
    clearNewNotification: () => setHasNewNotification(false),
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotificationContext must be used within NotificationProvider",
    );
  }
  return context;
}
