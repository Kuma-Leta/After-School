function toUserStatus(authUser) {
  if (!authUser) return "unknown";
  if (authUser.banned_until) return "suspended";
  return "active";
}

export async function listUsersForAdmin(adminClient, params) {
  const page = Math.max(Number(params.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(params.pageSize || 20), 1), 100);
  const search = (params.search || "").trim();
  const role = (params.role || "all").trim().toLowerCase();

  let profilesQuery = adminClient
    .from("profiles")
    .select(
      "id, full_name, email, role, created_at, updated_at, subscription_tier, payment_status",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (search) {
    profilesQuery = profilesQuery.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%`,
    );
  }

  if (role && role !== "all") {
    profilesQuery = profilesQuery.eq("role", role);
  }

  profilesQuery = profilesQuery.range(
    (page - 1) * pageSize,
    page * pageSize - 1,
  );

  const [
    { data: profiles, count, error },
    { data: authUsersData, error: authError },
  ] = await Promise.all([
    profilesQuery,
    adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  if (error) {
    throw new Error(error.message || "Failed to fetch users.");
  }

  if (authError) {
    throw new Error(authError.message || "Failed to fetch auth users.");
  }

  const authById = new Map(
    (authUsersData?.users || []).map((user) => [user.id, user]),
  );

  const items = (profiles || []).map((profile) => {
    const authUser = authById.get(profile.id);

    return {
      id: profile.id,
      full_name: profile.full_name || "",
      email: profile.email || authUser?.email || "",
      role: profile.role || "unknown",
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      subscription_tier: profile.subscription_tier || "free",
      payment_status: profile.payment_status || "unpaid",
      status: toUserStatus(authUser),
      banned_until: authUser?.banned_until || null,
      last_sign_in_at: authUser?.last_sign_in_at || null,
    };
  });

  return {
    items,
    pagination: {
      page,
      pageSize,
      total: count || 0,
      totalPages: Math.max(Math.ceil((count || 0) / pageSize), 1),
    },
  };
}

export async function updateUserByAdmin(adminClient, userId, payload) {
  const updates = {};

  if (payload.role) {
    updates.role = payload.role;
  }

  if (Object.keys(updates).length > 0) {
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (profileError) {
      throw new Error(profileError.message || "Failed to update user profile.");
    }
  }

  if (typeof payload.suspended === "boolean") {
    const { error: authUpdateError } =
      await adminClient.auth.admin.updateUserById(userId, {
        ban_duration: payload.suspended ? "876000h" : "none",
      });

    if (authUpdateError) {
      throw new Error(
        authUpdateError.message || "Failed to update user status.",
      );
    }
  }

  const [
    { data: profile, error: profileFetchError },
    { data: authUser, error: authFetchError },
  ] = await Promise.all([
    adminClient
      .from("profiles")
      .select(
        "id, full_name, email, role, created_at, updated_at, subscription_tier, payment_status",
      )
      .eq("id", userId)
      .single(),
    adminClient.auth.admin.getUserById(userId),
  ]);

  if (profileFetchError) {
    throw new Error(
      profileFetchError.message || "Failed to fetch updated user.",
    );
  }

  if (authFetchError) {
    throw new Error(authFetchError.message || "Failed to fetch auth status.");
  }

  return {
    ...profile,
    status: toUserStatus(authUser?.user),
    banned_until: authUser?.user?.banned_until || null,
    last_sign_in_at: authUser?.user?.last_sign_in_at || null,
  };
}
