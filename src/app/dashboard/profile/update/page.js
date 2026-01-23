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

      // Get basic profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);

        // Get role-specific details
        let table = "teachers";
        if (profileData.role === "student") table = "students";
        if (["school", "ngo", "family"].includes(profileData.role))
          table = "organizations";

        const { data: details } = await supabase
          .from(table)
          .select("*")
          .eq("id", user.id)
          .single();

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
          hourly_rate_range: [0, 0],
          is_verified: false,
          rating: 0,
          total_reviews: 0,
          grade_levels: [],
          teaching_methods: [],
        };
      case "student":
        return {
          university: "",
          department: "",
          graduation_year: new Date().getFullYear() + 1,
          skills: [],
          availability: {},
          is_verified: false,
          rating: 0,
          gpa: 0,
          extracurriculars: [],
        };
      case "school":
        return {
          org_name: "",
          org_type: "school",
          address: "",
          contact_person: "",
          contact_position: "",
          verified: false,
          billing_email: "",
          school_levels: [],
          student_count: 0,
          established_year: new Date().getFullYear(),
        };
      case "ngo":
        return {
          org_name: "",
          org_type: "ngo",
          address: "",
          contact_person: "",
          contact_position: "",
          verified: false,
          billing_email: "",
          focus_areas: [],
          program_description: "",
        };
      case "family":
        return {
          org_name: "",
          org_type: "individual",
          address: "",
          contact_person: "",
          contact_position: "",
          verified: false,
          billing_email: "",
          children_count: 0,
          children_ages: [],
          preferred_schedule: "",
        };
      default:
        return {};
    }
  }

  const handleSave = async (formData) => {
    setError("");
    setSuccess("");

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Update role-specific table
      let table = "teachers";
      if (profile.role === "student") table = "students";
      if (["school", "ngo", "family"].includes(profile.role))
        table = "organizations";

      const updateData = { ...formData.roleDetails };

      // Process array fields
      if (profile.role === "teacher") {
        if (typeof updateData.subject === "string") {
          updateData.subject = updateData.subject
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s);
        }
        if (typeof updateData.grade_levels === "string") {
          updateData.grade_levels = updateData.grade_levels
            .split(",")
            .map((g) => g.trim())
            .filter((g) => g);
        }
        updateData.experience_years = Number(updateData.experience_years) || 0;
        if (Array.isArray(updateData.hourly_rate_range)) {
          updateData.hourly_rate_range = updateData.hourly_rate_range.map(
            (v) => Number(v) || 0,
          );
        }
      }

      if (profile.role === "student") {
        if (typeof updateData.skills === "string") {
          updateData.skills = updateData.skills
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s);
        }
        updateData.graduation_year =
          Number(updateData.graduation_year) || new Date().getFullYear() + 1;
        updateData.gpa = Number(updateData.gpa) || 0;
      }

      const { error: roleError } = await supabase
        .from(table)
        .update(updateData)
        .eq("id", user.id);

      if (roleError) throw roleError;

      setSuccess("Profile updated successfully!");

      // Redirect back after 2 seconds
      setTimeout(() => {
        router.push("/dashboard/profile");
      }, 2000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setError(error.message || "Failed to save profile. Please try again.");
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
      />
    </div>
  );
}
