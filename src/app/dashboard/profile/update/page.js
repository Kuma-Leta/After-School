// app/dashboard/profile/update/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import ProfileUpdateForm from "../components/ProfileUpdateForm";
import Messages from "../components/Messages";

export default function ProfileUpdatePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [roleDetails, setRoleDetails] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      router.push("/login");
    }
  }, [user, router]);

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      // Get basic profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      if (profileData) {
        setProfile(profileData);

        // Get role-specific details
        let table = "teachers";
        if (profileData.role === "student") table = "students";
        if (["school", "ngo", "family"].includes(profileData.role))
          table = "organizations";

        const { data: details, error: detailsError } = await supabase
          .from(table)
          .select("*")
          .eq("id", user.id)
          .single();

        if (detailsError && detailsError.code !== "PGRST116") {
          console.warn("Error loading role details:", detailsError);
        }

        setRoleDetails(details || getDefaultRoleDetails(profileData.role));
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setError("Failed to load profile. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }

  function getDefaultRoleDetails(role) {
    switch (role) {
      case "teacher":
        return {
          subject: [],
          experience_years: 0,
          education_level: "",
          bio: "",
        };
      case "student":
        return {
          university: "",
          department: "",
          skills: [],
        };
      case "school":
        return {
          org_name: "",
          address: "",
          contact_person: "",
          contact_position: "",
        };
      case "ngo":
        return {
          org_name: "",
          address: "",
          contact_person: "",
          contact_position: "",
        };
      case "family":
        return {
          org_name: "",
          address: "",
          contact_person: "",
          contact_position: "",
        };
      default:
        return {};
    }
  }

  const handleSave = async (formData) => {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      console.log("Saving profile data:", formData);

      // Prepare profile update data
      const profileUpdateData = {
        full_name: formData.full_name,
        phone: formData.phone,
        location: formData.location,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        languages: Array.isArray(formData.languages) ? formData.languages : [],
        updated_at: new Date().toISOString(),
      };

      // Update profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdateData)
        .eq("id", user.id);

      if (profileError) {
        console.error("Profile update error:", profileError);
        throw profileError;
      }

      // Update role-specific table if roleDetails exist
      if (
        formData.roleDetails &&
        Object.keys(formData.roleDetails).length > 0
      ) {
        let table = "teachers";
        if (profile.role === "student") table = "students";
        if (["school", "ngo", "family"].includes(profile.role))
          table = "organizations";

        const roleUpdateData = {
          id: user.id,
          ...formData.roleDetails,
          updated_at: new Date().toISOString(),
        };

        console.log("Updating role table:", table, roleUpdateData);

        const { error: roleError } = await supabase
          .from(table)
          .upsert(roleUpdateData, {
            onConflict: "id",
          });

        if (roleError) {
          console.error("Role update error:", roleError);
          throw roleError;
        }
      }

      setSuccess("Profile updated successfully!");

      // Refresh and redirect
      setTimeout(() => {
        router.refresh();
        router.push("/dashboard/profile");
      }, 1500);
    } catch (error) {
      console.error("Error saving profile:", error);
      setError(error.message || "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FF1E00] mb-4"></div>
        <p className="text-gray-600">Loading profile for editing...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <Messages error={error} success={success} />

      <div className="mb-6">
        <button
          onClick={handleCancel}
          className="text-[#FF1E00] hover:underline flex items-center"
          disabled={saving}
        >
          ← Back to Profile View
        </button>
      </div>

      <ProfileUpdateForm
        profile={profile}
        roleDetails={roleDetails}
        user={user}
        onSave={handleSave}
        onCancel={handleCancel}
        saving={saving}
      />
    </div>
  );
}
