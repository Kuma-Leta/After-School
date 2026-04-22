const POLICY_CONTROL_TABLE = "admin_policy_controls";
const POLICY_CONTROL_ROW_ID = 1;

export const DEFAULT_POLICY_CONTROLS = {
  allowCrossCityBrowsing: false,
  allowCandidateInitiatedEmployerMessages: false,
  subscriptionRequiredForEmployerContact: true,
};

function toBoolean(value, fallback) {
  if (typeof value === "boolean") return value;
  return fallback;
}

function normalizePolicyControls(record) {
  return {
    allowCrossCityBrowsing: toBoolean(
      record?.allow_cross_city_browsing,
      DEFAULT_POLICY_CONTROLS.allowCrossCityBrowsing,
    ),
    allowCandidateInitiatedEmployerMessages: toBoolean(
      record?.allow_candidate_initiated_employer_messages,
      DEFAULT_POLICY_CONTROLS.allowCandidateInitiatedEmployerMessages,
    ),
    subscriptionRequiredForEmployerContact: toBoolean(
      record?.subscription_required_for_employer_contact,
      DEFAULT_POLICY_CONTROLS.subscriptionRequiredForEmployerContact,
    ),
    updatedAt: record?.updated_at || null,
    updatedBy: record?.updated_by || null,
  };
}

function toDbPatch(input = {}) {
  const patch = {};

  if (typeof input.allowCrossCityBrowsing === "boolean") {
    patch.allow_cross_city_browsing = input.allowCrossCityBrowsing;
  }

  if (typeof input.allowCandidateInitiatedEmployerMessages === "boolean") {
    patch.allow_candidate_initiated_employer_messages =
      input.allowCandidateInitiatedEmployerMessages;
  }

  if (typeof input.subscriptionRequiredForEmployerContact === "boolean") {
    patch.subscription_required_for_employer_contact =
      input.subscriptionRequiredForEmployerContact;
  }

  return patch;
}

async function ensurePolicyControlsRow(adminClient) {
  const { data: existing, error: readError } = await adminClient
    .from(POLICY_CONTROL_TABLE)
    .select("id")
    .eq("id", POLICY_CONTROL_ROW_ID)
    .maybeSingle();

  if (readError) {
    throw new Error(
      readError.message || "Failed to read admin policy control settings.",
    );
  }

  if (existing?.id) {
    return;
  }

  const { error: insertError } = await adminClient
    .from(POLICY_CONTROL_TABLE)
    .insert({
      id: POLICY_CONTROL_ROW_ID,
      allow_cross_city_browsing: DEFAULT_POLICY_CONTROLS.allowCrossCityBrowsing,
      allow_candidate_initiated_employer_messages:
        DEFAULT_POLICY_CONTROLS.allowCandidateInitiatedEmployerMessages,
      subscription_required_for_employer_contact:
        DEFAULT_POLICY_CONTROLS.subscriptionRequiredForEmployerContact,
    });

  if (insertError) {
    throw new Error(
      insertError.message ||
        "Failed to initialize admin policy control settings.",
    );
  }
}

export async function getPolicyControls(adminClient) {
  await ensurePolicyControlsRow(adminClient);

  const { data, error } = await adminClient
    .from(POLICY_CONTROL_TABLE)
    .select(
      "allow_cross_city_browsing, allow_candidate_initiated_employer_messages, subscription_required_for_employer_contact, updated_at, updated_by",
    )
    .eq("id", POLICY_CONTROL_ROW_ID)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to load admin policy controls.");
  }

  return normalizePolicyControls(data);
}

export async function updatePolicyControls(adminClient, updates, updatedBy) {
  const patch = toDbPatch(updates);
  const patchKeys = Object.keys(patch);

  if (patchKeys.length === 0) {
    return getPolicyControls(adminClient);
  }

  const payload = {
    id: POLICY_CONTROL_ROW_ID,
    ...patch,
    updated_by: updatedBy || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await adminClient
    .from(POLICY_CONTROL_TABLE)
    .upsert(payload, { onConflict: "id" })
    .select(
      "allow_cross_city_browsing, allow_candidate_initiated_employer_messages, subscription_required_for_employer_contact, updated_at, updated_by",
    )
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to update admin policy controls.");
  }

  return normalizePolicyControls(data);
}
