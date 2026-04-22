import { createServiceRoleClient } from "@/features/admin/server/auth";
import {
  DEFAULT_POLICY_CONTROLS,
  getPolicyControls,
} from "@/features/admin/server/policy-controls";

const CACHE_TTL_MS = 30 * 1000;

let policyControlsCache = {
  value: DEFAULT_POLICY_CONTROLS,
  expiresAt: 0,
};

export async function loadEffectivePolicyControls({
  bypassCache = false,
} = {}) {
  const now = Date.now();

  if (!bypassCache && policyControlsCache.expiresAt > now) {
    return policyControlsCache.value;
  }

  try {
    const adminClient = createServiceRoleClient();
    const controls = await getPolicyControls(adminClient);

    policyControlsCache = {
      value: {
        allowCrossCityBrowsing: controls.allowCrossCityBrowsing,
        allowCandidateInitiatedEmployerMessages:
          controls.allowCandidateInitiatedEmployerMessages,
        subscriptionRequiredForEmployerContact:
          controls.subscriptionRequiredForEmployerContact,
      },
      expiresAt: now + CACHE_TTL_MS,
    };

    return policyControlsCache.value;
  } catch {
    return DEFAULT_POLICY_CONTROLS;
  }
}
