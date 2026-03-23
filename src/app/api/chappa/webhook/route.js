// app/api/chapa/webhook/route.js
import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabase/client";
import { verifyPayment } from "@/lib/chapa/client";
import { updateSubscriptionAfterPayment } from "@/lib/subscription/subscription";

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-chapa-signature");

    // Verify webhook signature using your secret key
    const hash = crypto
      .createHmac("sha256", process.env.CHAPA_SECRET_KEY)
      .update(body)
      .digest("hex");

    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(body);
    const { tx_ref, status } = payload;

    if (status === "success") {
      // Verify the payment with Chapa API
      const verification = await verifyPayment(tx_ref);
      if (verification.data.status === "success") {
        // Find user associated with this tx_ref
        const { data: payment } = await supabase
          .from("payments")
          .select("user_id")
          .eq("tx_ref", tx_ref)
          .single();

        if (payment) {
          const periodEnd = new Date();
          periodEnd.setMonth(periodEnd.getMonth() + 1); // one month subscription

          await updateSubscriptionAfterPayment(
            payment.user_id,
            tx_ref,
            periodEnd,
          );

          // Update payment status
          await supabase
            .from("payments")
            .update({ status: "completed" })
            .eq("tx_ref", tx_ref);
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
