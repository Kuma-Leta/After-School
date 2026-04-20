import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/features/admin/server/auth";
import { evaluateEmployerContactEntitlement } from "@/lib/policies/contact-entitlement";

export async function GET(request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get("candidateId");
    const requireApplication =
      searchParams.get("requireApplication") !== "false";

    if (!candidateId) {
      return NextResponse.json(
        { error: "candidateId query parameter is required." },
        { status: 400 },
      );
    }

    const adminClient = createServiceRoleClient();
    const policyResult = await evaluateEmployerContactEntitlement({
      supabase,
      adminClient,
      employerId: user.id,
      candidateId,
      requireApplication,
    });

    return NextResponse.json({
      ...policyResult,
      employerId: user.id,
      candidateId,
      requireApplication,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error.message ||
          "Failed to evaluate employer-to-candidate contact entitlement.",
      },
      { status: 500 },
    );
  }
}
