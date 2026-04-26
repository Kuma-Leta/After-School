// app/payment/success/page.js
"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function PaymentSuccess() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF1E00] mx-auto mb-4"></div>
            <h2 className="text-2xl font-semibold mb-2">Verifying Payment</h2>
            <p className="text-gray-600">Loading payment details...</p>
          </div>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const tx_ref = searchParams.get("tx_ref");
  const [status, setStatus] = useState("verifying");

  useEffect(() => {
    const verify = async () => {
      // Optionally call your backend to confirm the payment
      // For now, we assume webhook will update subscription
      setStatus("success");
    };
    verify();
  }, [tx_ref]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
        {status === "verifying" ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF1E00] mx-auto mb-4"></div>
            <h2 className="text-2xl font-semibold mb-2">Verifying Payment</h2>
            <p className="text-gray-600">
              Please wait while we confirm your transaction...
            </p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-semibold mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for subscribing to After School. Your account now has
              full access.
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00]"
            >
              Go to Dashboard
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
