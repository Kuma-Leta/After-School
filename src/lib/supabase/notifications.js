// lib/supabase/notifications.js - All notification-related functions
import { supabase } from "./client";

// Create a single notification
export async function createNotification({
  userId,
  title,
  message,
  type = "info",
  metadata = {},
  link = null,
  expiresAt = null,
}) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert([
        {
          user_id: userId,
          title,
          message,
          type,
          metadata,
          link,
          expires_at: expiresAt,
          read: false,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Trigger real-time event
    await supabase.channel(`notifications:${userId}`).send({
      type: "broadcast",
      event: "new_notification",
      payload: data,
    });

    return { success: true, data };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { success: false, error };
  }
}

// Create notifications for multiple users
export async function createBulkNotifications({
  userIds,
  title,
  message,
  type = "info",
  metadata = {},
  link = null,
  expiresAt = null,
}) {
  try {
    const notifications = userIds.map((userId) => ({
      user_id: userId,
      title,
      message,
      type,
      metadata,
      link,
      expires_at: expiresAt,
      read: false,
    }));

    const { data, error } = await supabase
      .from("notifications")
      .insert(notifications)
      .select();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error("Error creating bulk notifications:", error);
    return { success: false, error };
  }
}

// Get user notifications with pagination
export async function getUserNotifications(userId, limit = 50, page = 1) {
  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { success: false, error };
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId, userId) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { success: false, error };
  }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(userId) {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return { success: false, error };
  }
}

// Delete a notification
export async function deleteNotification(notificationId, userId) {
  try {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error deleting notification:", error);
    return { success: false, error };
  }
}

// Get unread count
export async function getUnreadCount(userId) {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) throw error;

    return { success: true, count: count || 0 };
  } catch (error) {
    console.error("Error getting unread count:", error);
    return { success: false, error };
  }
}

// Get user notification preferences
export async function getUserPreferences(userId) {
  try {
    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    // If no preferences exist, create default
    if (!data) {
      return await createDefaultPreferences(userId);
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error getting preferences:", error);
    return { success: false, error };
  }
}

// Update user preferences
export async function updatePreferences(userId, updates) {
  try {
    const { data, error } = await supabase
      .from("notification_preferences")
      .upsert({
        user_id: userId,
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error("Error updating preferences:", error);
    return { success: false, error };
  }
}

// Create default preferences
async function createDefaultPreferences(userId) {
  const { data, error } = await supabase
    .from("notification_preferences")
    .insert([
      {
        user_id: userId,
        email_enabled: true,
        push_enabled: true,
        in_app_enabled: true,
        preferences: {
          new_message: true,
          assignment_due: true,
          grade_posted: true,
          event_reminder: true,
          class_announcement: true,
          friend_request: true,
          club_invitation: true,
        },
      },
    ])
    .select()
    .single();

  if (error) throw error;

  return { success: true, data };
}

// Real-time subscription helper
export function subscribeToNotifications(userId, callback) {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (callback) callback(payload.new);
      },
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (callback) callback(payload.new);
      },
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (callback) callback(payload.old, true);
      },
    )
    .subscribe();

  return channel;
}

// Utility function to format notification data for display
export function formatNotificationTime(createdAt) {
  const now = new Date();
  const created = new Date(createdAt);
  const diffInMinutes = Math.floor((now - created) / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return created.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: diffInDays >= 365 ? "numeric" : undefined,
  });
}

// Get notification icon based on type
export function getNotificationIcon(type) {
  const icons = {
    message: "💬",
    event: "📅",
    assignment: "📝",
    announcement: "📢",
    friend_request: "👤",
    club_invitation: "🎉",
    grade: "📊",
    info: "ℹ️",
    success: "✅",
    warning: "⚠️",
    error: "❌",
  };
  return icons[type] || "🔔";
}

// Get notification color class based on type
export function getNotificationColorClass(type) {
  const colors = {
    message: "bg-blue-100 text-blue-800 border-blue-200",
    event: "bg-purple-100 text-purple-800 border-purple-200",
    assignment: "bg-yellow-100 text-yellow-800 border-yellow-200",
    announcement: "bg-green-100 text-green-800 border-green-200",
    friend_request: "bg-pink-100 text-pink-800 border-pink-200",
    club_invitation: "bg-indigo-100 text-indigo-800 border-indigo-200",
    grade: "bg-emerald-100 text-emerald-800 border-emerald-200",
    info: "bg-gray-100 text-gray-800 border-gray-200",
    success: "bg-green-100 text-green-800 border-green-200",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
    error: "bg-red-100 text-red-800 border-red-200",
  };
  return colors[type] || "bg-gray-100 text-gray-800 border-gray-200";
}

// Get notification type label
export function getNotificationTypeLabel(type) {
  const labels = {
    message: "Message",
    event: "Event",
    assignment: "Assignment",
    announcement: "Announcement",
    friend_request: "Friend Request",
    club_invitation: "Club Invitation",
    grade: "Grade",
    info: "Information",
    success: "Success",
    warning: "Warning",
    error: "Error",
  };
  return labels[type] || type;
}
