"use client";

import { useState } from "react";
import Link from "next/link";
import { CreditCard, Calendar, CheckCircle, AlertCircle } from "lucide-react";

const ELIGIBLE_ROLES = ["teacher", "student"];

export default function SubscriptionSettings({
  user,
  profile,
  subscription,
  onUpdate,
}) {
  const [loading, setLoading] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [message, setMessage] = useState("");

  const normalizedRole = (profile?.role || "").toLowerCase();
  const canUpgrade = ELIGIBLE_ROLES.includes(normalizedRole);
  const isPaidActive =
    (subscription?.payment_status || "").toLowerCase() === "paid" &&
    !!subscription?.subscriptionEndDate &&
    new Date(subscription.subscriptionEndDate).getTime() > Date.now();

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
    if (subscription?.subscriptionTier === "premium" && isPaidActive) {
      return {
        name: "Premium Plan",
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
        features: [
          "Unlimited messages",
          "Job postings",
          "Priority support",
          "Active subscription",
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

  const startChappaUpgrade = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/payment/upgrade/chappa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to initialize Chappa payment.");
      }

      if (!result.checkoutUrl) {
        throw new Error("Checkout URL missing from payment gateway response.");
      }

      onUpdate?.((prev) => ({
        ...(prev || {}),
        payment_status: "pending",
      }));

      window.location.href = result.checkoutUrl;
    } catch (error) {
      setMessage(error.message || "Could not start Chappa payment.");
      setLoading(false);
    }
  };

  const submitBankTransferProof = async () => {
    if (!proofFile) {
      setMessage("Please attach a screenshot of your transfer receipt first.");
      return;
    }

    setUploadingProof(true);
    setMessage("");

    try {
      const uploadForm = new FormData();
      uploadForm.append("file", proofFile);

      const uploadResponse = await fetch("/api/payment/upgrade/proof-upload", {
        method: "POST",
        body: uploadForm,
      });

      const uploadResult = await uploadResponse.json();
      if (!uploadResponse.ok) {
        throw new Error(
          uploadResult.error || "Failed to upload proof screenshot.",
        );
      }

      const submitResponse = await fetch("/api/payment/upgrade/bank-transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proofUrl: uploadResult.proofUrl,
          proofPath: uploadResult.proofPath,
        }),
      });

      const submitResult = await submitResponse.json();
      if (!submitResponse.ok) {
        throw new Error(
          submitResult.error || "Failed to submit bank transfer request.",
        );
      }

      onUpdate?.((prev) => ({
        ...(prev || {}),
        payment_status: "pending",
      }));
      setProofFile(null);
      setMessage(
        "Bank transfer proof submitted. Admin will verify and activate your upgrade.",
      );
    } catch (error) {
      setMessage(error.message || "Failed to submit bank transfer proof.");
    } finally {
      setUploadingProof(false);
    }
  };

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
          ) : subscription?.subscriptionTier === "premium" && isPaidActive ? (
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
                {isPaidActive ? "**** **** **** 4242" : "No payment method"}
              </p>
              <p className="text-sm text-gray-600">
                {isPaidActive
                  ? `Active until ${formatDate(subscription?.subscriptionEndDate)}`
                  : "Add a card to upgrade"}
              </p>
            </div>
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            {isPaidActive ? "Update" : "Add Card"}
          </button>
        </div>
      </div>

      {/* Upgrade Options */}
      {(!isPaidActive || subscription?.subscriptionTier !== "premium") &&
        canUpgrade && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Upgrade for Teachers and University Students
                </h3>
                <p className="text-blue-800 text-sm mb-4">
                  Choose Chappa for instant checkout, or pay by bank transfer
                  and upload your receipt for admin verification.
                </p>

                <div className="flex flex-wrap gap-3 mb-4">
                  <button
                    onClick={startChappaUpgrade}
                    disabled={loading || uploadingProof}
                    className="inline-flex items-center px-4 py-2 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] disabled:opacity-60 transition-colors"
                  >
                    {loading ? "Redirecting..." : "Pay with Chappa"}
                  </button>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center px-4 py-2 border border-blue-300 text-blue-900 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    View Plan Details
                  </Link>
                </div>

                <div className="rounded-lg border border-blue-200 bg-white p-4 space-y-3">
                  <p className="text-sm font-semibold text-gray-900">
                    Bank transfer
                  </p>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>Bank: Commercial Bank of Ethiopia</p>
                    <p>Account Name: Afterschool Technologies</p>
                    <p>Account Number: 1000123456789</p>
                  </div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) =>
                      setProofFile(event.target.files?.[0] || null)
                    }
                    className="block w-full text-sm text-gray-700"
                  />
                  <button
                    onClick={submitBankTransferProof}
                    disabled={uploadingProof || loading}
                    className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black disabled:opacity-60"
                  >
                    {uploadingProof
                      ? "Uploading proof..."
                      : "Submit bank transfer proof"}
                  </button>
                </div>

                {message && (
                  <p
                    className="mt-3 text-sm text-blue-900"
                    role="status"
                    aria-live="polite"
                  >
                    {message}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

      {(!isPaidActive || subscription?.subscriptionTier !== "premium") &&
        !canUpgrade && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
            <p className="text-sm text-gray-700">
              Upgrades are currently available for teacher and university
              student accounts.
            </p>
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
