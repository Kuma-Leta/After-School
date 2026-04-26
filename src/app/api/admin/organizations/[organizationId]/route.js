import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/features/admin/server/auth";

export async function PATCH(request, context) {
  try {
    const access = await requireAdminRequest();

    if (!access.ok) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status },
      );
    }

    const { organizationId } = await context.params;
    const payload = await request.json();
    const action = (payload?.action || "").toLowerCase();
    const rejectionReason = (payload?.rejectionReason || "").trim();

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Use approve or reject." },
        { status: 400 },
      );
    }

    if (action === "reject" && !rejectionReason) {
      return NextResponse.json(
        { error: "Rejection reason is required when rejecting." },
        { status: 400 },
      );
    }

    const { data: existingOrg, error: existingOrgError } =
      await access.adminClient
        .from("organizations")
        .select("id, org_type, verification_status")
        .eq("id", organizationId)
        .single();

    if (existingOrgError || !existingOrg) {
      return NextResponse.json(
        { error: "Organization not found." },
        { status: 404 },
      );
    }

    const nextStatus = action === "approve" ? "verified" : "rejected";

    const { data: updatedOrg, error: updateError } = await access.adminClient
      .from("organizations")
      .update({
        verification_status: nextStatus,
        verification_rejection_reason:
          action === "reject" ? rejectionReason : null,
        verified_by: access.user.id,
        verified_at: action === "approve" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", organizationId)
      .select(
        "id, org_name, org_type, verification_status, verification_rejection_reason, documents_submitted_at, verified_at, verified_by, updated_at",
      )
      .single();

    if (updateError || !updatedOrg) {
      throw new Error(
        updateError?.message || "Failed to update organization verification.",
      );
    }

    await access.adminClient
      .from("organization_verification_documents")
      .update({
        reviewed_by: access.user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", organizationId)
      .is("reviewed_at", null);

    return NextResponse.json({ item: updatedOrg });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to update organization verification." },
      { status: 500 },
    );
  }
}
