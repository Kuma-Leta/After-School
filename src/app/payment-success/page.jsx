// app/payment-success/page.jsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PaymentSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard after 5 seconds
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-12 h-12 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-600 mb-6">
          Your payment has been processed successfully. Your premium account is
          now active.
        </p>
        <div className="space-y-4">
          <Link
            href="/dashboard"
            className="block w-full py-3 bg-[#FF1E00] text-white rounded-lg font-bold hover:bg-[#E01B00]"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/jobs"
            className="block w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50"
          >
            Browse Jobs
          </Link>
        </div>
        <p className="text-sm text-gray-500 mt-6">
          You will be redirected to dashboard in 5 seconds...
        </p>
      </div>
    </div>
  );
}
