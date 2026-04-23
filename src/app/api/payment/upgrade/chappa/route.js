import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { initializePayment } from "@/lib/chapa/client";

const UPGRADE_AMOUNT_ETB = "100";
const ELIGIBLE_ROLES = ["teacher", "student"];

export async function POST() {
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
      .select("id, role, full_name, email")
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

    const txRef = `upgrade_${Date.now()}_${user.id.slice(0, 8)}`;
    const fullName =
      profile.full_name || user.user_metadata?.full_name || "User";
    const [firstName, ...rest] = fullName.split(" ");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const returnUrl = appUrl
      ? `${appUrl}/payment-success?tx_ref=${encodeURIComponent(txRef)}`
      : `/payment-success?tx_ref=${encodeURIComponent(txRef)}`;

    const chapa = await initializePayment({
      amount: UPGRADE_AMOUNT_ETB,
      currency: "ETB",
      email: profile.email || user.email || "",
      first_name: firstName || "User",
      last_name: rest.join(" "),
      tx_ref: txRef,
      return_url: returnUrl,
    });

    const checkoutUrl = chapa?.data?.checkout_url;

    if (!checkoutUrl) {
      throw new Error("Failed to get checkout URL from Chapa.");
    }

    const { error: insertError } = await supabase
      .from("payment_upgrade_requests")
      .insert({
        user_id: user.id,
        role_snapshot: role,
        method: "chappa",
        amount: UPGRADE_AMOUNT_ETB,
        currency: "ETB",
        status: "pending",
        tx_ref: txRef,
        checkout_url: checkoutUrl,
      });

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
      checkoutUrl,
      txRef,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Failed to initialize Chapa payment." },
      { status: 500 },
    );
  }
}
