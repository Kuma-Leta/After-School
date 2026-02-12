"use client";

import { useState } from "react";
import Link from "next/link";
import { CreditCard, Calendar, CheckCircle, AlertCircle } from "lucide-react";

export default function SubscriptionSettings({ user, subscription, onUpdate }) {
  const [loading, setLoading] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getPlanDetails = () => {
    if (subscription?.isTrialActive) {
      return {
        name: "Free Trial",
        color: "bg-yellow-100 text-yellow-800",
        icon: Calendar,
        features: [
          "Full access to all features",
          `${Math.ceil(
            (new Date(subscription.trialEndDate) - new Date()) /
              (1000 * 60 * 60 * 24),
          )} days remaining`,
        ],
      };
    }
    if (subscription?.subscriptionTier === "pro") {
      return {
        name: "Pro Plan",
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
        features: [
          "Unlimited messages",
          "Job postings",
          "Priority support",
          subscription.payment_status === "paid"
            ? "Active subscription"
            : "Payment pending",
        ],
      };
    }
    return {
      name: "Free Plan",
      color: "bg-gray-100 text-gray-800",
      icon: CreditCard,
      features: ["Limited messages", "Basic profile", "Upgrade to unlock more"],
    };
  };

  const plan = getPlanDetails();

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Subscription & Billing
      </h2>

      {/* Current Plan Card */}
      <div className="bg-gradient-to-br from-[#FF1E00] to-[#FF6B00] rounded-xl shadow-lg p-8 text-white mb-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm opacity-90 mb-1">Current Plan</p>
            <h3 className="text-3xl font-bold mb-2">{plan.name}</h3>
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${plan.color}`}
            >
              <plan.icon className="w-4 h-4 mr-2" />
              {plan.name}
            </div>
          </div>
          {subscription?.isTrialActive ? (
            <div className="text-right">
              <p className="text-sm opacity-90">Trial ends</p>
              <p className="text-lg font-semibold">
                {formatDate(subscription.trialEndDate)}
              </p>
            </div>
          ) : subscription?.subscriptionTier === "pro" ? (
            <div className="text-right">
              <p className="text-sm opacity-90">Next billing</p>
              <p className="text-lg font-semibold">
                {formatDate(subscription.subscriptionEndDate)}
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-6 pt-6 border-t border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plan.features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Payment Method
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {subscription?.payment_status === "paid"
                  ? "**** **** **** 4242"
                  : "No payment method"}
              </p>
              <p className="text-sm text-gray-600">
                {subscription?.payment_status === "paid"
                  ? "Expires 12/25"
                  : "Add a card to upgrade"}
              </p>
            </div>
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            {subscription?.payment_status === "paid" ? "Update" : "Add Card"}
          </button>
        </div>
      </div>

      {/* Upgrade Options */}
      {subscription?.subscriptionTier !== "pro" && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">
                Upgrade to Pro
              </h3>
              <p className="text-blue-800 text-sm mb-4">
                Get unlimited messaging, job postings, and priority support.
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center px-4 py-2 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] transition-colors"
              >
                View Plans
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Billing History */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Billing History
        </h3>
        <div className="text-center py-6 text-gray-500">
          <p>No billing history yet.</p>
        </div>
      </div>
    </div>
  );
}
