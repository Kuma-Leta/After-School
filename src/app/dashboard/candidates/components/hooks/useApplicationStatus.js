// app/dashboard/candidates/components/hooks/useApplicationStatus.js
import { useState } from "react";
import { createNotification } from "@/lib/supabase/notifications";

export function useApplicationStatus() {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  // Update application status
  const updateStatus = async ({
    applicationId,
    newStatus,
    applicantId,
    jobTitle,
    organizationName,
    jobId,
    organizationId,
  }) => {
    setUpdating(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/applications/${applicationId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          payload?.error || "Failed to update application status.",
        );
      }

      const data = payload?.application;

      // Send notification if applicant ID is provided
      if (applicantId) {
        await sendStatusNotification({
          applicantId,
          applicationId,
          jobTitle,
          organizationName,
          oldStatus: data.originalStatus,
          newStatus,
          jobId,
          organizationId,
        });
      }

      return { success: true, data };
    } catch (err) {
      setError(err.message);
      console.error("Error updating application status:", err);
      return { success: false, error: err };
    } finally {
      setUpdating(false);
    }
  };

  // Send status notification
  const sendStatusNotification = async ({
    applicantId,
    applicationId,
    jobTitle,
    organizationName,
    oldStatus,
    newStatus,
    jobId,
    organizationId,
  }) => {
    try {
      const statusMessages = {
        pending: "Your application has been submitted successfully.",
        reviewed: `Your application for "${jobTitle}" has been reviewed.`,
        shortlisted: `Congratulations! You've been shortlisted for "${jobTitle}".`,
        interviewing: `You've been invited for an interview for "${jobTitle}".`,
        hired: `Congratulations! You've been hired for "${jobTitle}" at ${organizationName}.`,
        rejected: `Your application for "${jobTitle}" was not successful at this time.`,
      };

      const message =
        statusMessages[newStatus] ||
        `Your application status for "${jobTitle}" has been updated to ${newStatus}.`;

      await createNotification({
        userId: applicantId,
        title: "Application Status Update",
        message,
        type: getNotificationType(newStatus),
        metadata: {
          applicationId,
          jobId,
          jobTitle,
          organizationId,
          organizationName,
          oldStatus,
          newStatus,
        },
        link: `/applications/${applicationId}`,
      });
    } catch (err) {
      console.warn("Failed to send notification:", err);
      // Don't fail the whole operation if notification fails
    }
  };

  // Get notification type based on status
  const getNotificationType = (status) => {
    const types = {
      hired: "success",
      shortlisted: "success",
      interviewing: "info",
      reviewed: "info",
      rejected: "warning",
      pending: "info",
    };
    return types[status] || "info";
  };

  return {
    updateStatus,
    updating,
    error,
    resetError: () => setError(null),
  };
}
