// lib/subscription/subscription.js
import { supabase } from "@/lib/supabase/client";

export async function getUserSubscription(userId) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows
    throw error;
  }
  return data;
}

export async function createTrialSubscription(userId) {
  const trialStart = new Date();
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 30); // 30-day trial

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      user_id: userId,
      status: "trialing",
      trial_start: trialStart.toISOString(),
      trial_end: trialEnd.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSubscriptionAfterPayment(
  userId,
  tx_ref,
  periodEnd,
) {
  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "active",
      chapa_tx_ref: tx_ref,
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) throw error;
}

export function isSubscriptionActive(subscription) {
  if (!subscription) return false;
  const now = new Date();
  if (subscription.status === "trialing") {
    return new Date(subscription.trial_end) > now;
  }
  if (subscription.status === "active") {
    return new Date(subscription.current_period_end) > now;
  }
  return false;
}
