// app/dashboard/profile/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import ProfileUpdateForm from "../components/ProfileUpdateForm";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [roleDetails, setRoleDetails] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        setUser(session.user);

        // Load profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profileError) {
          console.error("Profile error:", profileError);
          // If profile doesn't exist, create a basic one
          if (profileError.code === "PGRST116") {
            const newProfile = {
              id: session.user.id,
              email: session.user.email,
              full_name: "",
              role: "teacher", // Default role
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            setProfile(newProfile);
            setRoleDetails({});
          } else {
            throw profileError;
          }
        } else {
          setProfile(profileData);

          // Load role-specific details
          const roleTable = getRoleTable(profileData.role);
          if (roleTable) {
            const { data: roleData, error: roleError } = await supabase
              .from(roleTable)
              .select("*")
              .eq("id", session.user.id)
              .single();

            if (roleError && roleError.code !== "PGRST116") {
              console.error("Role details error:", roleError);
            } else {
              setRoleDetails(roleData || {});
            }
          }
        }
      } catch (err) {
        console.error("Load error:", err);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);
  const getRoleTable = (role) => {
    switch (role) {
      case "teacher":
        return "teacher_profiles";
      case "student":
        return "student_profiles";
      case "school":
        return "school_profiles";
      case "ngo":
        return "ngo_profiles";
      case "family":
        return "family_profiles";
      case "admin":
        return "admin_profiles";
      default:
        return null;
    }
  };

  const handleSave = async (data) => {
    setSaving(true);
    setError("");

    try {
      const { roleDetails, ...profileData } = data;

      // Update main profile
      const { error: profileError } = await supabase.from("profiles").upsert({
        ...profileData,
        updated_at: new Date().toISOString(),
      });

      if (profileError) throw profileError;

      // Update role-specific profile
      const roleTable = getRoleTable(profileData.role);
      if (roleTable && roleDetails) {
        const { error: roleError } = await supabase.from(roleTable).upsert({
          ...roleDetails,
          id: user.id,
          updated_at: new Date().toISOString(),
        });

        if (roleError) throw roleError;
      }

      // Refresh data
      const { data: updatedProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(updatedProfile);
      setRoleDetails(roleDetails);

      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Save error:", err);
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-100 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-500 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        <ProfileUpdateForm
          profile={profile}
          roleDetails={roleDetails}
          user={user}
          onSave={handleSave}
          onCancel={handleCancel}
          saving={saving}
        />
      </div>
    </div>
  );
}
