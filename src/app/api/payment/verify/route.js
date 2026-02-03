// app/api/chapa/callback/route.js
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tx_ref = searchParams.get("tx_ref");

    if (!tx_ref) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/payment-error?reason=no_reference`,
      );
    }

    // Verify transaction with Chapa
    const verifyResponse = await fetch(
      `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        },
      },
    );

    const verifyData = await verifyResponse.json();

    if (verifyData.status === "success") {
      const transaction = verifyData.data;

      // Update transaction record
      await supabase
        .from("transactions")
        .update({
          status: "completed",
          verified_at: new Date().toISOString(),
          verification_data: transaction,
        })
        .eq("tx_ref", tx_ref);

      // Get user from transaction
      const { data: transactionRecord } = await supabase
        .from("transactions")
        .select("user_id")
        .eq("tx_ref", tx_ref)
        .single();

      if (transactionRecord) {
        // Update user subscription
        const subscriptionEnd = new Date();
        subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);

        await supabase
          .from("profiles")
          .update({
            subscription_tier: "premium",
            payment_status: "paid",
            subscription_end_date: subscriptionEnd.toISOString(),
            last_payment_date: new Date().toISOString(),
          })
          .eq("id", transactionRecord.user_id);
      }

      // Redirect to success page
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/payment-success`,
      );
    } else {
      // Update transaction as failed
      await supabase
        .from("transactions")
        .update({
          status: "failed",
          verification_data: verifyData,
        })
        .eq("tx_ref", tx_ref);

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/payment-error?reason=verification_failed`,
      );
    }
  } catch (error) {
    console.error("Chapa callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/payment-error?reason=server_error`,
    );
  }
}
