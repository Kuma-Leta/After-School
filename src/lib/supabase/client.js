// lib/supabase/client.js - Keep it simple
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export async function checkUserSubscription(userId) {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier, trial_end_date, payment_status")
      .eq("id", userId)
      .single();

    if (!profile) return { requiresPayment: true };

    const trialEnd = new Date(profile.trial_end_date);
    const today = new Date();
    const isTrialActive =
      trialEnd > today && profile.subscription_tier === "trial";
    const requiresPayment = !isTrialActive && profile.payment_status !== "paid";

    return {
      requiresPayment,
      isTrialActive,
      subscriptionTier: profile.subscription_tier,
      trialEndDate: profile.trial_end_date,
    };
  } catch (error) {
    console.error("Error checking subscription:", error);
    return { requiresPayment: true };
  }
}
