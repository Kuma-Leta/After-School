// app/dashboard/subscription/page.js
"use client";

import { useRouter } from "next/navigation";
import SubscriptionSettings from "@/app/dashboard/settings/components/SubscriptionSettings";
import { useSettingsUserData } from "@/hooks/useSettingsUserData";

export default function SubscriptionPage() {
  const router = useRouter();
  const { user, profile, subscription, loading, setSubscription } =
    useSettingsUserData(router);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF1E00]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1F1F1F]">Subscription</h1>
        <p className="text-gray-600 mt-2">
          Upgrade your plan to access more features
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <SubscriptionSettings
          user={user}
          profile={profile}
          subscription={subscription}
          onUpdate={setSubscription}
        />
      </div>
    </div>
  );
}
