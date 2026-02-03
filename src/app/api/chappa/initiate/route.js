// app/api/chapa/initiate/route.js
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, currency } = body;

    // Get user from Supabase auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate unique transaction reference
    const tx_ref = `tx_${Date.now()}_${user.id.substring(0, 8)}`;

    // Prepare Chapa payment data
    const paymentData = {
      amount: amount || "100",
      currency: currency || "ETB",
      email: user.email,
      first_name: user.user_metadata?.full_name?.split(" ")[0] || "User",
      last_name: user.user_metadata?.full_name?.split(" ")[1] || "",
      tx_ref,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/chapa/callback?tx_ref=${tx_ref}`,
      customization: {
        title: "AfterSchool Premium Subscription",
        description: "Unlimited job applications",
        logo: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`,
      },
    };

    // Call Chapa API
    const chapaResponse = await fetch(
      "https://api.chapa.co/v1/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      },
    );

    const chapaData = await chapaResponse.json();

    if (!chapaData.status || chapaData.status !== "success") {
      throw new Error(chapaData.message || "Failed to initiate payment");
    }

    // Save transaction record in database
    await supabase.from("transactions").insert({
      user_id: user.id,
      tx_ref,
      amount: paymentData.amount,
      currency: paymentData.currency,
      status: "pending",
      payment_method: "chapa",
      metadata: paymentData,
    });

    return NextResponse.json({
      url: chapaData.data.checkout_url,
      tx_ref,
    });
  } catch (error) {
    console.error("Chapa initiation error:", error);
    return NextResponse.json(
      { error: error.message || "Payment initiation failed" },
      { status: 500 },
    );
  }
}
