// app/components/PaymentModal.jsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function PaymentModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("chapa");

  if (!isOpen) return null;

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Initialize Chapa payment
      const response = await fetch("/api/chapa/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: "100", // 100 ETB for premium subscription
          currency: "ETB",
          email: "", // Will be filled with user email from Supabase
          first_name: "", // Will be filled with user name
        }),
      });

      const data = await response.json();

      if (data.url) {
        // Redirect to Chapa payment page
        window.location.href = data.url;
      } else {
        throw new Error("Failed to initiate payment");
      }
    } catch (error) {
      console.error("Payment initiation failed:", error);
      alert("Payment initiation failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Upgrade Your Account
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Premium Account
                </h3>
                <p className="text-gray-600">Unlimited job applications</p>
              </div>
              <div className="text-3xl font-bold text-[#FF1E00]">ETB 100</div>
            </div>
            <ul className="space-y-3">
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Unlimited job applications</span>
              </li>
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Priority application review</span>
              </li>
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Profile highlighting to employers</span>
              </li>
              <li className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Early access to new job postings</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">
            Select Payment Method
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentMethod("chapa")}
              className={`p-4 border rounded-xl flex flex-col items-center justify-center ${paymentMethod === "chapa" ? "border-[#FF1E00] bg-red-50" : "border-gray-300 hover:bg-gray-50"}`}
            >
              <div className="w-12 h-12 bg-[#FF1E00] rounded-lg flex items-center justify-center mb-2">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="font-medium">Chapa</span>
              <span className="text-xs text-gray-600 mt-1">
                Card & Mobile Money
              </span>
            </button>
            <button
              onClick={() => setPaymentMethod("telebirr")}
              className={`p-4 border rounded-xl flex flex-col items-center justify-center ${paymentMethod === "telebirr" ? "border-[#FF1E00] bg-red-50" : "border-gray-300 hover:bg-gray-50"}`}
            >
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-2">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="font-medium">Telebirr</span>
              <span className="text-xs text-gray-600 mt-1">Mobile Money</span>
            </button>
          </div>
        </div>

        <button
          onClick={handlePayment}
          disabled={loading}
          className={`w-full py-3 rounded-lg font-bold text-lg ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#FF1E00] hover:bg-[#E01B00]"
          } text-white shadow-lg`}
        >
          {loading ? "Processing..." : `Pay ETB 100 with ${paymentMethod}`}
        </button>

        <p className="text-center text-sm text-gray-600 mt-4">
          You'll be redirected to {paymentMethod} to complete your payment
          securely
        </p>
      </div>
    </div>
  );
}
