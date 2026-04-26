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

export async function createOrganizationOrFamilyByAdmin(
  adminClient,
  adminUserId,
  payload,
) {
  const allowedRoles = ["school", "ngo", "family"];
  const role = (payload?.role || "").toLowerCase().trim();

  if (!allowedRoles.includes(role)) {
    throw new Error("Role must be school, ngo, or family.");
  }

  const email = String(payload?.email || "")
    .trim()
    .toLowerCase();
  const password = String(payload?.password || "").trim();
  const fullName = String(payload?.full_name || "").trim();
  const phone = String(payload?.phone || "").trim();
  const organizationName = String(payload?.organization_name || "").trim();
  const contactPerson = String(payload?.contact_person || fullName).trim();
  const address = String(payload?.address || "").trim();
  const website = String(payload?.website || "").trim();

  if (!email) throw new Error("Email is required.");
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }
  if (!fullName) throw new Error("Full name is required.");
  if (!organizationName) throw new Error("Organization or family name is required.");
  if (!contactPerson) throw new Error("Contact person is required.");
  if (!address) throw new Error("Address is required.");

  const legalName = String(payload?.legal_name || "").trim();
  const registrationNumber = String(payload?.registration_number || "").trim();
  const taxId = String(payload?.tax_id || "").trim();
  const officialEmail = String(payload?.official_email || "")
    .trim()
    .toLowerCase();
  const authorizedRepresentativeName = String(
    payload?.authorized_representative_name || contactPerson,
  ).trim();
  const authorizedRepresentativeRole = String(
    payload?.authorized_representative_role || "",
  ).trim();

  if (role === "school" || role === "ngo") {
    if (!legalName) throw new Error("Legal institution name is required.");
    if (!registrationNumber) {
      throw new Error("Registration or license number is required.");
    }
    if (!taxId) throw new Error("Tax ID / TIN is required.");
    if (!officialEmail) throw new Error("Official institution email is required.");
    if (!authorizedRepresentativeName) {
      throw new Error("Authorized representative name is required.");
    }
    if (!authorizedRepresentativeRole) {
      throw new Error("Authorized representative role is required.");
    }
  }

  const requestedVerificationStatus = String(
    payload?.verification_status || "",
  )
    .trim()
    .toLowerCase();
  const validVerificationStatuses = ["pending", "verified", "rejected"];

  const verificationStatus =
    role === "family"
      ? "verified"
      : validVerificationStatuses.includes(requestedVerificationStatus)
        ? requestedVerificationStatus
        : "verified";

  const nowIso = new Date().toISOString();

  const { data: createdAuthData, error: createAuthError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role,
        phone,
      },
      app_metadata: {
        provider: "email",
        role,
      },
    });

  if (createAuthError || !createdAuthData?.user?.id) {
    throw new Error(createAuthError?.message || "Failed to create auth user.");
  }

  const userId = createdAuthData.user.id;

  try {
    const { error: profileError } = await adminClient.from("profiles").upsert(
      {
        id: userId,
        full_name: fullName,
        email,
        phone: phone || null,
        role,
        updated_at: nowIso,
      },
      { onConflict: "id" },
    );

    if (profileError) {
      throw new Error(profileError.message || "Failed to create profile.");
    }

    const orgType = role === "family" ? "individual" : role;
    const organizationPayload = {
      id: userId,
      org_name: organizationName,
      org_type: orgType,
      contact_person: contactPerson,
      address,
      website: website || null,
      legal_name: role === "family" ? null : legalName,
      registration_number: role === "family" ? null : registrationNumber,
      tax_id: role === "family" ? null : taxId,
      official_email: role === "family" ? null : officialEmail,
      authorized_representative_name:
        role === "family" ? contactPerson : authorizedRepresentativeName,
      authorized_representative_role:
        role === "family" ? "Guardian" : authorizedRepresentativeRole,
      verification_status,
      verification_rejection_reason: null,
      documents_submitted_at:
        verificationStatus === "pending" ? nowIso : null,
      verified_at: verificationStatus === "verified" ? nowIso : null,
      verified_by: verificationStatus === "verified" ? adminUserId : null,
      updated_at: nowIso,
    };

    const { error: organizationError } = await adminClient
      .from("organizations")
      .upsert(organizationPayload, { onConflict: "id" });

    if (organizationError) {
      throw new Error(
        organizationError.message || "Failed to create organization profile.",
      );
    }

    return {
      id: userId,
      full_name: fullName,
      email,
      phone,
      role,
      organization_name: organizationName,
      org_type: orgType,
      verification_status: verificationStatus,
      status: "active",
      created_at: createdAuthData.user.created_at || nowIso,
    };
  } catch (error) {
    await adminClient.auth.admin.deleteUser(userId);
    throw error;
  }
}
