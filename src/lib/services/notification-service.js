// lib/services/notification-service.js - Common notification patterns for AfterSchool
import * as NotificationService from "@/lib/supabase/notifications";

export class AfterSchoolNotifications {
  // Send new message notification
  static async sendNewMessage({
    recipientId,
    senderName,
    messageId,
    messagePreview,
  }) {
    return await NotificationService.createNotification({
      userId: recipientId,
      title: "New Message",
      message: `${senderName}: ${messagePreview}`,
      type: "message",
      metadata: {
        senderName,
        messageId,
        messagePreview,
      },
      link: `/messages/${messageId}`,
    });
  }

  // Send assignment due reminder
  static async sendAssignmentDue({
    studentId,
    assignmentTitle,
    assignmentId,
    dueDate,
    courseName,
  }) {
    const dueTomorrow = new Date(dueDate) - Date.now() <= 24 * 60 * 60 * 1000;

    return await NotificationService.createNotification({
      userId: studentId,
      title: dueTomorrow ? "Assignment Due Tomorrow" : "Upcoming Assignment",
      message: `"${assignmentTitle}" ${dueTomorrow ? "is due tomorrow" : `is due on ${new Date(dueDate).toLocaleDateString()}`}`,
      type: "assignment",
      metadata: {
        assignmentId,
        assignmentTitle,
        dueDate,
        courseName,
      },
      link: `/assignments/${assignmentId}`,
      expiresAt: new Date(dueDate),
    });
  }

  // Send grade posted notification
  static async sendGradePosted({
    studentId,
    assignmentTitle,
    grade,
    assignmentId,
    courseName,
  }) {
    return await NotificationService.createNotification({
      userId: studentId,
      title: "Grade Posted",
      message: `You received ${grade} on "${assignmentTitle}"`,
      type: "grade",
      metadata: {
        assignmentId,
        assignmentTitle,
        grade,
        courseName,
      },
      link: `/assignments/${assignmentId}`,
    });
  }

  // Send event reminder
  static async sendEventReminder({
    userId,
    eventTitle,
    eventId,
    eventTime,
    location,
  }) {
    const timeUntilEvent = new Date(eventTime) - Date.now();
    const hoursUntil = Math.floor(timeUntilEvent / (1000 * 60 * 60));

    return await NotificationService.createNotification({
      userId,
      title: hoursUntil <= 1 ? "Event Starting Soon" : "Event Reminder",
      message: `"${eventTitle}" ${hoursUntil <= 1 ? "starts in less than an hour" : `is tomorrow at ${new Date(eventTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}`,
      type: "event",
      metadata: {
        eventId,
        eventTitle,
        eventTime,
        location,
      },
      link: `/events/${eventId}`,
      expiresAt: new Date(eventTime),
    });
  }

  // Send class announcement
  static async sendClassAnnouncement({
    studentIds,
    teacherName,
    className,
    announcementId,
    classId,
    announcementTitle,
  }) {
    return await NotificationService.createBulkNotifications({
      userIds: studentIds,
      title: "New Class Announcement",
      message: `${teacherName} posted "${announcementTitle}" in ${className}`,
      type: "announcement",
      metadata: {
        teacherName,
        classId,
        className,
        announcementId,
        announcementTitle,
      },
      link: `/classes/${classId}/announcements/${announcementId}`,
    });
  }

  // Send friend request
  static async sendFriendRequest({ recipientId, senderName, senderId }) {
    return await NotificationService.createNotification({
      userId: recipientId,
      title: "Friend Request",
      message: `${senderName} sent you a friend request`,
      type: "friend_request",
      metadata: {
        senderId,
        senderName,
      },
      link: `/friends/requests`,
    });
  }

  // Send club invitation
  static async sendClubInvitation({
    recipientId,
    clubName,
    clubId,
    inviterName,
  }) {
    return await NotificationService.createNotification({
      userId: recipientId,
      title: "Club Invitation",
      message: `${inviterName} invited you to join ${clubName}`,
      type: "club_invitation",
      metadata: {
        clubId,
        clubName,
        inviterName,
      },
      link: `/clubs/${clubId}`,
    });
  }

  // Send system notification (admin use)
  static async sendSystemNotification({
    userId,
    title,
    message,
    priority = "info",
  }) {
    return await NotificationService.createNotification({
      userId,
      title: `System: ${title}`,
      message,
      type: priority,
      metadata: {
        system: true,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Check if user wants to receive this type of notification
  static async shouldSendNotification(userId, notificationType) {
    try {
      const result = await NotificationService.getUserPreferences(userId);
      if (!result.success) return true; // Default to true if error

      const preferences = result.data.preferences || {};
      return preferences[notificationType] !== false;
    } catch (error) {
      console.error("Error checking notification preferences:", error);
      return true; // Default to true on error
    }
  }
}
