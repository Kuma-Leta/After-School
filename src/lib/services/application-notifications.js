// lib/services/application-notifications.js
import * as NotificationService from "@/lib/supabase/notifications";

export class ApplicationNotifications {
  // Send notification when application status changes
  static async sendApplicationStatusUpdate({
    applicantId,
    applicationId,
    jobTitle,
    organizationName,
    oldStatus,
    newStatus,
    jobId,
    organizationId,
  }) {
    const statusMessages = {
      pending: {
        title: "Application Submitted",
        message: `Your application for "${jobTitle}" has been submitted successfully and is under review.`,
      },
      reviewed: {
        title: "Application Reviewed",
        message: `Your application for "${jobTitle}" has been reviewed by ${organizationName}.`,
      },
      shortlisted: {
        title: "You've Been Shortlisted! 🎉",
        message: `Congratulations! Your application for "${jobTitle}" has been shortlisted by ${organizationName}.`,
      },
      interviewing: {
        title: "Interview Invitation",
        message: `${organizationName} has invited you for an interview for "${jobTitle}". Check your email for details.`,
      },
      hired: {
        title: "Congratulations! You're Hired! 🎉",
        message: `Great news! You've been hired for "${jobTitle}" at ${organizationName}. Welcome to the team!`,
      },
      rejected: {
        title: "Application Update",
        message: `Thank you for applying for "${jobTitle}" at ${organizationName}. We've chosen to move forward with other candidates at this time.`,
      },
    };

    const notificationData = statusMessages[newStatus] || {
      title: "Application Status Updated",
      message: `Your application status for "${jobTitle}" has been updated from ${oldStatus} to ${newStatus}.`,
    };

    // Get notification preferences for applicant
    const shouldSend = await this.shouldSendStatusNotification(
      applicantId,
      newStatus,
    );
    if (!shouldSend) {
      return {
        success: true,
        skipped: true,
        reason: "User disabled notifications",
      };
    }

    const result = await NotificationService.createNotification({
      userId: applicantId,
      title: notificationData.title,
      message: notificationData.message,
      type: this.getNotificationType(newStatus),
      metadata: {
        applicationId,
        jobId,
        jobTitle,
        organizationId,
        organizationName,
        oldStatus,
        newStatus,
        updatedAt: new Date().toISOString(),
      },
      link: `/dashboard/applications/${applicationId}`,
    });

    return result;
  }

  // Get notification type based on status
  static getNotificationType(status) {
    const typeMap = {
      pending: "info",
      reviewed: "info",
      shortlisted: "success",
      interviewing: "event",
      hired: "success",
      rejected: "warning",
    };
    return typeMap[status] || "info";
  }

  // Check if user wants to receive this type of notification
  static async shouldSendStatusNotification(userId, status) {
    try {
      const result = await NotificationService.getUserPreferences(userId);
      if (!result.success) return true; // Default to true if error

      const preferences = result.data?.preferences || {};

      // Map status to preference key
      const preferenceMap = {
        shortlisted: "application_shortlisted",
        interviewing: "application_interview",
        hired: "application_hired",
        rejected: "application_rejected",
      };

      const preferenceKey = preferenceMap[status];

      // If no specific preference, default to true for status updates
      if (!preferenceKey) return true;

      return preferences[preferenceKey] !== false;
    } catch (error) {
      console.error("Error checking notification preferences:", error);
      return true; // Default to true on error
    }
  }

  // Send notification to organization when new application is submitted
  static async sendNewApplicationNotification({
    organizationId,
    applicantName,
    jobTitle,
    applicationId,
    jobId,
  }) {
    return await NotificationService.createNotification({
      userId: organizationId,
      title: "New Application Received",
      message: `${applicantName} has applied for "${jobTitle}".`,
      type: "info",
      metadata: {
        applicationId,
        jobId,
        jobTitle,
        applicantName,
        receivedAt: new Date().toISOString(),
      },
      link: `/dashboard/candidates/${applicationId}`,
    });
  }

  // Send bulk notifications to applicants when job is filled/closed
  static async sendJobFilledNotifications({
    applicantIds,
    jobTitle,
    organizationName,
    jobId,
  }) {
    return await NotificationService.createBulkNotifications({
      userIds: applicantIds,
      title: "Position Filled",
      message: `The position "${jobTitle}" at ${organizationName} has been filled. Thank you for your interest.`,
      type: "info",
      metadata: {
        jobId,
        jobTitle,
        organizationName,
        filledAt: new Date().toISOString(),
      },
      link: `/jobs/${jobId}`,
    });
  }
}
