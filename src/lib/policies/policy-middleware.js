import { NextResponse } from "next/server";
import { resolveRequestActor } from "@/lib/policies/access-control";

export function denyWithPolicy(policyResult, fallbackStatus = 403) {
  return NextResponse.json(
    {
      error: policyResult?.message || policyResult?.error || "Forbidden",
      reason: policyResult?.reason || "policy_denied",
      policy: policyResult,
    },
    { status: policyResult?.status || fallbackStatus },
  );
}

export async function requireActorContext(supabase) {
  const actorResult = await resolveRequestActor(supabase);
  if (!actorResult.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: actorResult.error,
          reason: actorResult.reason,
        },
        { status: actorResult.status || 401 },
      ),
    };
  }

  return {
    ok: true,
    actor: actorResult.user,
    profile: actorResult.profile,
  };
}
