// app/dashboard/candidates/components/hooks/useApplicationStatus.js
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
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
      // Prepare update data
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      // Add timestamps for specific statuses
      if (newStatus === "reviewed") {
        updateData.reviewed_at = new Date().toISOString();
      } else if (newStatus === "hired") {
        updateData.hired_at = new Date().toISOString();
      }

      // Update in database
      const { data, error: updateError } = await supabase
        .from("applications")
        .update(updateData)
        .eq("id", applicationId)
        .select()
        .single();

      if (updateError) throw updateError;

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

      // If hired, mark job as filled
      if (newStatus === "hired" && jobId) {
        await markJobAsFilled(jobId);
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

  // Mark job as filled
  const markJobAsFilled = async (jobId) => {
    try {
      await supabase
        .from("jobs")
        .update({
          is_filled: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);
    } catch (err) {
      console.warn("Failed to mark job as filled:", err);
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
