export async function getAdminOverview(adminClient) {
  const [
    profilesResponse,
    trialResponse,
    paidResponse,
    recentUsersResponse,
    premiumResponse,
  ] = await Promise.all([
    adminClient.from("profiles").select("id, role", { count: "exact" }),
    adminClient
      .from("profiles")
      .select("id", { count: "exact" })
      .eq("subscription_tier", "trial"),
    adminClient
      .from("profiles")
      .select("id", { count: "exact" })
      .eq("payment_status", "paid"),
    adminClient
      .from("profiles")
      .select("id", { count: "exact" })
      .gte(
        "created_at",
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      ),
    adminClient
      .from("profiles")
      .select("id", { count: "exact" })
      .eq("subscription_tier", "premium"),
  ]);

  const users = profilesResponse.data || [];
  const roleBreakdown = users.reduce((acc, user) => {
    const role = user.role || "unknown";
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  return {
    totals: {
      users: profilesResponse.count || 0,
      trialUsers: trialResponse.count || 0,
      paidUsers: paidResponse.count || 0,
      newUsersThisWeek: recentUsersResponse.count || 0,
      premiumUsers: premiumResponse.count || 0,
    },
    roleBreakdown,
  };
}
