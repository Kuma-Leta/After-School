import { NextResponse } from "next/server";
import crypto from "crypto";
import { verifyPayment } from "@/lib/chapa/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase service-role configuration.");
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

function calculateSubscriptionEndDate() {
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1);
  return endDate.toISOString();
}

export async function POST(request) {
  try {
    const adminClient = createServiceRoleClient();
    const body = await request.text();
    const signature = request.headers.get("x-chapa-signature");

    // Verify webhook signature using your secret key
    const hash = crypto
      .createHmac("sha256", process.env.CHAPA_SECRET_KEY)
      .update(body)
      .digest("hex");

    if (signature && hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(body);
    const { tx_ref, status } = payload;

    if (!tx_ref) {
      return NextResponse.json({ error: "Missing tx_ref" }, { status: 400 });
    }

    if (status === "success") {
      const verification = await verifyPayment(tx_ref);
      if (verification?.data?.status === "success") {
        const { data: upgradeRequest, error: requestError } = await adminClient
          .from("payment_upgrade_requests")
          .select("id, user_id")
          .eq("tx_ref", tx_ref)
          .single();

        if (requestError || !upgradeRequest) {
          throw new Error(
            requestError?.message || "Upgrade request not found.",
          );
        }

        const nowIso = new Date().toISOString();

        const { error: requestUpdateError } = await adminClient
          .from("payment_upgrade_requests")
          .update({
            status: "paid",
            verified_at: nowIso,
            updated_at: nowIso,
            metadata: { verification },
          })
          .eq("id", upgradeRequest.id);

        if (requestUpdateError) {
          throw new Error(
            requestUpdateError.message || "Failed to update request.",
          );
        }

        const { error: profileError } = await adminClient
          .from("profiles")
          .update({
            subscription_tier: "premium",
            payment_status: "paid",
            subscription_end_date: calculateSubscriptionEndDate(),
            updated_at: nowIso,
          })
          .eq("id", upgradeRequest.user_id);

        if (profileError) {
          throw new Error(
            profileError.message || "Failed to update user profile.",
          );
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
