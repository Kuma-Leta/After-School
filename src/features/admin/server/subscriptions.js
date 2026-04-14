export async function listSubscriptionsForAdmin(adminClient, params) {
  const page = Math.max(Number(params.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(params.pageSize || 20), 1), 100);
  const search = (params.search || "").trim();
  const tier = (params.tier || "all").trim().toLowerCase();
  const paymentStatus = (params.paymentStatus || "all").trim().toLowerCase();

  let query = adminClient
    .from("profiles")
    .select(
      "id, full_name, email, role, subscription_tier, payment_status, trial_start_date, trial_end_date, subscription_end_date, updated_at",
      { count: "exact" },
    )
    .order("updated_at", { ascending: false });

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  if (tier && tier !== "all") {
    query = query.eq("subscription_tier", tier);
  }

  if (paymentStatus && paymentStatus !== "all") {
    query = query.eq("payment_status", paymentStatus);
  }

  query = query.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(error.message || "Failed to fetch subscriptions.");
  }

  return {
    items: data || [],
    pagination: {
      page,
      pageSize,
      total: count || 0,
      totalPages: Math.max(Math.ceil((count || 0) / pageSize), 1),
    },
  };
}

export async function updateSubscriptionByAdmin(adminClient, userId, payload) {
  const updatePayload = {};

  if (payload.subscription_tier) {
    updatePayload.subscription_tier = payload.subscription_tier;
  }

  if (payload.payment_status) {
    updatePayload.payment_status = payload.payment_status;
  }

  if (payload.trial_end_date !== undefined) {
    updatePayload.trial_end_date = payload.trial_end_date || null;
  }

  if (payload.subscription_end_date !== undefined) {
    updatePayload.subscription_end_date = payload.subscription_end_date || null;
  }

  if (Object.keys(updatePayload).length === 0) {
    throw new Error("No valid subscription fields provided.");
  }

  const { error } = await adminClient
    .from("profiles")
    .update({ ...updatePayload, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message || "Failed to update subscription.");
  }

  const { data: updatedProfile, error: fetchError } = await adminClient
    .from("profiles")
    .select(
      "id, full_name, email, role, subscription_tier, payment_status, trial_start_date, trial_end_date, subscription_end_date, updated_at",
    )
    .eq("id", userId)
    .single();

  if (fetchError) {
    throw new Error(
      fetchError.message || "Failed to fetch updated subscription.",
    );
  }

  return updatedProfile;
}
