import { useCallback, useEffect, useState } from "react";
import { supabase, checkUserSubscription } from "@/lib/supabase/client";

export function useSettingsUserData(router) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

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
      console.error("Error loading settings data:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  return {
    user,
    profile,
    subscription,
    loading,
    setProfile,
    setSubscription,
    refreshUserData: loadUserData,
  };
}
