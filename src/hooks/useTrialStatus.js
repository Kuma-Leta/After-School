// app/hooks/useTrialStatus.js - FIXED
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

export function useTrialStatus() {
  const [trialStatus, setTrialStatus] = useState({
    isTrialActive: true,
    trialDaysLeft: 14, // Changed from daysLeft to trialDaysLeft
    requiresPayment: false,
    loading: true,
  });

  useEffect(() => {
    checkTrialStatus();
  }, []);

  const checkTrialStatus = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setTrialStatus({
          isTrialActive: false,
          trialDaysLeft: 0,
          requiresPayment: true,
          loading: false,
        });
        return;
      }

      // Get user profile with trial info
      const { data: profile, error } = await supabase
        .from("profiles")
        .select(
          "trial_start_date, trial_end_date, subscription_tier, payment_status",
        )
        .eq("id", user.id)
        .single();

      if (error) throw error;

      // If no trial start date, set it for new users
      if (!profile.trial_start_date) {
        const trialStart = new Date().toISOString();
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 14); // 14-day trial

        await supabase
          .from("profiles")
          .update({
            trial_start_date: trialStart,
            trial_end_date: trialEnd.toISOString(),
            subscription_tier: "trial",
          })
          .eq("id", user.id);

        setTrialStatus({
          isTrialActive: true,
          trialDaysLeft: 14, // Full trial period for new users
          requiresPayment: false,
          loading: false,
        });
        return;
      }

      // Calculate trial days left correctly
      const trialEndDate = new Date(profile.trial_end_date);
      const today = new Date();

      // CORRECT calculation: trial end date minus today
      const trialDaysLeft = Math.ceil(
        (trialEndDate - today) / (1000 * 60 * 60 * 24),
      );

      // Check if trial is active and payment status
      const isTrialActive =
        trialDaysLeft > 0 && profile.subscription_tier === "trial";
      const requiresPayment =
        !isTrialActive && profile.payment_status !== "paid";

      setTrialStatus({
        isTrialActive,
        trialDaysLeft: Math.max(0, trialDaysLeft), // Ensure non-negative
        requiresPayment,
        loading: false,
      });
    } catch (error) {
      console.error("Error checking trial status:", error);
      setTrialStatus({
        isTrialActive: false,
        trialDaysLeft: 0,
        requiresPayment: true,
        loading: false,
      });
    }
  };

  const updateSubscription = async (paymentData) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("User not found");

      const subscriptionEnd = new Date();
      subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1); // 1 year subscription

      await supabase
        .from("profiles")
        .update({
          subscription_tier: "premium",
          payment_status: "paid",
          subscription_end_date: subscriptionEnd.toISOString(),
          payment_data: paymentData,
        })
        .eq("id", user.id);

      // Refresh trial status
      await checkTrialStatus();

      return true;
    } catch (error) {
      console.error("Error updating subscription:", error);
      return false;
    }
  };

  return {
    trialStatus,
    updateSubscription,
    refreshTrialStatus: checkTrialStatus,
  };
}
