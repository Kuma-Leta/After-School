import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/features/admin/server/auth";

function calculateSubscriptionEndDate() {
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);
  return endDate.toISOString();
}

export async function PATCH(request, context) {
  try {
    const access = await requireAdminRequest();

    if (!access.ok) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status },
      );
    }

    const { requestId } = await context.params;
    const payload = await request.json();
    const action = (payload?.action || "").toLowerCase();
    const adminNote = (payload?.adminNote || "").trim();

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Use approve or reject." },
        { status: 400 },
      );
    }

    const { data: targetRequest, error: targetError } = await access.adminClient
      .from("payment_upgrade_requests")
      .select("id, user_id, method, status")
      .eq("id", requestId)
      .single();

    if (targetError || !targetRequest) {
      return NextResponse.json(
        { error: "Payment request not found." },
        { status: 404 },
      );
    }

    const nextStatus = action === "approve" ? "paid" : "rejected";

    const { data: updatedRequest, error: updateError } =
      await access.adminClient
        .from("payment_upgrade_requests")
        .update({
          status: nextStatus,
          admin_note: adminNote || null,
          verified_by: access.user.id,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .select(
          "id, user_id, method, status, amount, currency, tx_ref, proof_url, created_at, verified_at, admin_note",
        )
        .single();

    if (updateError || !updatedRequest) {
      throw new Error(
        updateError?.message || "Failed to update payment request.",
      );
    }

    const profilePatch =
      action === "approve"
        ? {
            subscription_tier: "premium",
            payment_status: "paid",
            subscription_end_date: calculateSubscriptionEndDate(),
            updated_at: new Date().toISOString(),
          }
        : {
            payment_status: "unpaid",
            updated_at: new Date().toISOString(),
          };

    const { data: updatedProfile, error: profileError } =
      await access.adminClient
        .from("profiles")
        .update(profilePatch)
        .eq("id", targetRequest.user_id)
        .select(
          "id, full_name, email, role, subscription_tier, payment_status, trial_start_date, trial_end_date, subscription_end_date, updated_at",
        )
        .single();

    if (profileError || !updatedProfile) {
      throw new Error(
        profileError?.message || "Failed to update profile subscription.",
      );
    }

    return NextResponse.json({
      request: updatedRequest,
      profile: updatedProfile,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to verify payment request." },
      { status: 500 },
    );
  }
}
