"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { checkUserSubscription } from "@/lib/supabase/client";

// Import components
import SettingsSidebar from "./components/SettingsSidebar";
import ProfileSettings from "./components/ProfileSettings";
import AccountSettings from "./components/AccountSettings";
import NotificationSettings from "./components/NotificationSettings";
import SubscriptionSettings from "./components/SubscriptionSettings";
import PrivacySettings from "./components/PrivacySettings";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadUserData = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      // Load profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(profile);

      // Load subscription status
      const sub = await checkUserSubscription(user.id);
      setSubscription(sub);
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

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
          {/* Sidebar */}
          <SettingsSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            subscription={subscription}
          />

          {/* Main content */}
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
                <NotificationSettings userId={user.id} />
              )}
              {activeTab === "subscription" && (
                <SubscriptionSettings
                  user={user}
                  subscription={subscription}
                  onUpdate={setSubscription}
                />
              )}
              {activeTab === "privacy" && <PrivacySettings userId={user.id} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
