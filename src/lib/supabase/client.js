// lib/supabase/client.js - Keep it simple
import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export async function checkUserSubscription(userId) {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "subscription_tier, trial_end_date, subscription_end_date, payment_status",
      )
      .eq("id", userId)
      .single();

    if (!profile) return { requiresPayment: true };

    const trialEnd = new Date(profile.trial_end_date);
    const today = new Date();
    const isTrialActive =
      trialEnd > today && profile.subscription_tier === "trial";
    const paymentStatus = (profile.payment_status || "").toLowerCase();
    const subscriptionEnd = profile.subscription_end_date
      ? new Date(profile.subscription_end_date)
      : null;
    const isPaidActive =
      paymentStatus === "paid" &&
      subscriptionEnd &&
      subscriptionEnd.getTime() > Date.now();
    const requiresPayment = !isTrialActive && !isPaidActive;

    return {
      requiresPayment,
      isTrialActive,
      isPaidActive,
      subscriptionTier: profile.subscription_tier,
      trialEndDate: profile.trial_end_date,
      subscriptionEndDate: profile.subscription_end_date,
      payment_status: profile.payment_status,
    };
  } catch (error) {
    console.error("Error checking subscription:", error);
    return { requiresPayment: true };
  }
}
