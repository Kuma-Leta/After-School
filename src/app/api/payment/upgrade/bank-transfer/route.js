import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UPGRADE_AMOUNT_ETB = "100";
const ELIGIBLE_ROLES = ["teacher", "student"];

export async function POST(request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found." },
        { status: 404 },
      );
    }

    const role = (profile.role || "").toLowerCase();
    if (!ELIGIBLE_ROLES.includes(role)) {
      return NextResponse.json(
        { error: "Only university students and teachers can upgrade." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const proofUrl = (body?.proofUrl || "").trim();
    const proofPath = (body?.proofPath || "").trim();

    if (!proofUrl) {
      return NextResponse.json(
        { error: "Proof screenshot is required for bank transfer." },
        { status: 400 },
      );
    }

    const { data: existingPending } = await supabase
      .from("payment_upgrade_requests")
      .select("id")
      .eq("user_id", user.id)
      .eq("method", "bank_transfer")
      .eq("status", "pending")
      .limit(1);

    if ((existingPending || []).length > 0) {
      return NextResponse.json(
        { error: "You already have a pending bank transfer request." },
        { status: 409 },
      );
    }

    const { data: inserted, error: insertError } = await supabase
      .from("payment_upgrade_requests")
      .insert({
        user_id: user.id,
        role_snapshot: role,
        method: "bank_transfer",
        amount: UPGRADE_AMOUNT_ETB,
        currency: "ETB",
        status: "pending",
        proof_url: proofUrl,
        proof_file_path: proofPath || null,
      })
      .select("id, status, created_at")
      .single();

    if (insertError) {
      throw insertError;
    }

    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({
        payment_status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileUpdateError) {
      console.error("Failed to mark profile payment status as pending", {
        message: profileUpdateError.message,
        code: profileUpdateError.code,
      });
    }

    return NextResponse.json({
      message: "Bank transfer proof submitted. Admin will verify shortly.",
      request: inserted,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Failed to submit bank transfer proof." },
      { status: 500 },
    );
  }
}
