// app/payment/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import Header from "@/components/layout/Header";
import LoadingSpinner from "../dashboard/candidates/components/Layout/LoadingSpinner";

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const { trialStatus, updateSubscription } = useTrialStatus();
  const [processing, setProcessing] = useState(false);

  // If user is already premium, redirect immediately
  useEffect(() => {
    if (!trialStatus.loading && !trialStatus.requiresPayment) {
      router.push(redirect);
    }
  }, [trialStatus, router, redirect]);

  const handlePayment = async () => {
    setProcessing(true);
    try {
      // Here you would integrate with your payment provider.
      // For demo, we simulate a successful payment.
      const paymentData = {
        amount: 100, // example
        currency: "ETB",
        method: "mock",
        timestamp: new Date().toISOString(),
      };

      const success = await updateSubscription(paymentData);
      if (success) {
        router.push(redirect);
      } else {
        alert("Payment failed. Please try again.");
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (trialStatus.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">💳</div>
          <h1 className="text-2xl font-bold mb-2">Upgrade to Premium</h1>
          <p className="text-gray-600 mb-6">
            Your free trial has ended. Subscribe to continue applying for jobs.
          </p>
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <div className="text-3xl font-bold text-[#FF1E00]">$10</div>
            <div className="text-sm text-gray-600">per month</div>
          </div>
          <button
            onClick={handlePayment}
            disabled={processing}
            className={`w-full py-3 rounded-lg font-medium ${
              processing
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-[#FF1E00] text-white hover:bg-[#E01B00]"
            }`}
          >
            {processing ? "Processing..." : "Subscribe Now"}
          </button>
          <p className="text-xs text-gray-500 mt-4">
            Secure payment powered by [Your Gateway]. No commitment, cancel
            anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
