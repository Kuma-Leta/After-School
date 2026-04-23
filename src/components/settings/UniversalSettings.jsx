"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { User, Bell, Shield, CreditCard, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { checkUserSubscription } from "@/lib/supabase/client";
import SettingsSidebar from "@/app/dashboard/settings/components/SettingsSidebar";
import ProfileSettings from "@/app/dashboard/settings/components/ProfileSettings";
import AccountSettings from "@/app/dashboard/settings/components/AccountSettings";
import NotificationSettings from "@/app/dashboard/settings/components/NotificationSettings";
import SubscriptionSettings from "@/app/dashboard/settings/components/SubscriptionSettings";
import PrivacySettings from "@/app/dashboard/settings/components/PrivacySettings";

const ALL_TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "account", label: "Account", icon: Lock },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "subscription", label: "Subscription", icon: CreditCard },
];

export default function UniversalSettings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadUserData = useCallback(async () => {
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        router.push("/login");
        return;
      }

      setUser(currentUser);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      setProfile(profileData || null);

      const userSubscription = await checkUserSubscription(currentUser.id);
      setSubscription(userSubscription);
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const tabs = useMemo(() => {
    if (profile?.role === "admin") {
      return ALL_TABS.filter((tab) => tab.id !== "subscription");
    }

    return ALL_TABS;
  }, [profile?.role]);

  useEffect(() => {
    if (!tabs.find((tab) => tab.id === activeTab)) {
      setActiveTab(tabs[0]?.id || "profile");
    }
  }, [activeTab, tabs]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF1E00]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <SettingsSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            subscription={subscription}
            tabs={tabs}
          />

          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-md p-6">
              {activeTab === "profile" && (
                <ProfileSettings
                  user={user}
                  profile={profile}
                  onUpdate={(updated) => setProfile(updated)}
                />
              )}
              {activeTab === "account" && <AccountSettings user={user} />}
              {activeTab === "notifications" && (
                <NotificationSettings userId={user?.id} />
              )}
              {activeTab === "subscription" && (
                <SubscriptionSettings
                  user={user}
                  profile={profile}
                  subscription={subscription}
                  onUpdate={setSubscription}
                />
              )}
              {activeTab === "privacy" && <PrivacySettings userId={user?.id} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
