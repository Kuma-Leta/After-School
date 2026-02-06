// hooks/useNotifications.js
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import * as NotificationService from "@/lib/supabase/notifications";

export function useNotifications(limit = 20) {
  const [userId, setUserId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get user from Supabase auth
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
        setNotifications([]);
        setUnreadCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const result = await NotificationService.getUserNotifications(
        userId,
        limit,
        1,
      );
      if (!result.success) throw result.error;

      setNotifications(result.data || []);

      // Calculate unread count
      const unread = (result.data || []).filter((n) => !n.read).length;
      setUnreadCount(unread);
    } catch (err) {
      setError(err);
      console.error("Error fetching notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, limit]);

  const markAsRead = async (id) => {
    if (!userId) return;

    try {
      const result = await NotificationService.markNotificationAsRead(
        id,
        userId,
      );
      if (!result.success) throw result.error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;

    try {
      const result =
        await NotificationService.markAllNotificationsAsRead(userId);
      if (!result.success) throw result.error;

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  const deleteNotification = async (id) => {
    if (!userId) return;

    try {
      const result = await NotificationService.deleteNotification(id, userId);
      if (!result.success) throw result.error;

      const wasUnread = notifications.find((n) => n.id === id)?.read === false;
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const getUnreadCount = async () => {
    if (!userId) return;

    try {
      const result = await NotificationService.getUnreadCount(userId);
      if (!result.success) throw result.error;
      setUnreadCount(result.count);
    } catch (err) {
      console.error("Error getting unread count:", err);
    }
  };

  useEffect(() => {
    if (!userId) return;

    fetchNotifications();
    getUnreadCount();

    // Subscribe to real-time notifications
    const channel = NotificationService.subscribeToNotifications(
      userId,
      (notification, isDelete) => {
        if (isDelete) {
          // Handle delete
          setNotifications((prev) =>
            prev.filter((n) => n.id !== notification.id),
          );
          if (!notification.read) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        } else if (notification) {
          // Handle insert or update
          setNotifications((prev) => {
            const exists = prev.some((n) => n.id === notification.id);
            if (!exists) {
              return [notification, ...prev].slice(0, limit);
            }
            return prev.map((n) =>
              n.id === notification.id ? notification : n,
            );
          });

          // Update unread count
          if (notification.read === false) {
            setUnreadCount((prev) => prev + 1);
          } else if (notification.read === true) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      },
    );

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId, fetchNotifications, limit]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications: fetchNotifications,
    getUnreadCount,
    userId,
  };
}
