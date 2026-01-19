// app/dashboard/profile/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [roleDetails, setRoleDetails] = useState(null);
  const [error, setError] = useState("");
  const [needsProfileCreation, setNeedsProfileCreation] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      loadProfile();
    } else if (!authLoading && !user) {
      // No user, redirect to login
      router.push("/login");
    }
  }, [user, authLoading, router]);

  async function loadProfile() {
    try {
      // Get basic profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.log("Profile error:", profileError);

        // If profile doesn't exist, create one
        if (profileError.code === "PGRST116") {
          console.log("No profile found, creating one...");
          await createInitialProfile();
          // Reload after creation
          await loadProfile();
          return;
        }
        throw profileError;
      }

      if (profileData) {
        console.log("Profile loaded:", profileData);
        setProfile(profileData);

        // Get role-specific details
        const table = getRoleTable(profileData.role);

        if (table) {
          const { data: details, error: detailsError } = await supabase
            .from(table)
            .select("*")
            .eq("id", user.id)
            .single();

          if (detailsError && detailsError.code !== "PGRST116") {
            console.error("Error loading role details:", detailsError);
          }

          setRoleDetails(details || getDefaultRoleDetails(profileData.role));
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setError("Failed to load profile. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }

  function getRoleTable(role) {
    switch (role) {
      case "teacher":
        return "teachers";
      case "student":
        return "students";
      case "school":
      case "ngo":
      case "family":
        return "organizations";
      default:
        return null;
    }
  }

  function getDefaultRoleDetails(role) {
    switch (role) {
      case "teacher":
        return { experience_years: 0, subject: [] };
      case "student":
        return {
          university: "",
          department: "",
          graduation_year: new Date().getFullYear() + 1,
        };
      case "school":
      case "ngo":
      case "family":
        return { org_name: "", org_type: role, contact_person: "" };
      default:
        return {};
    }
  }

  async function createInitialProfile() {
    try {
      // Get user metadata from auth
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) throw new Error("No authenticated user found");

      const userMetadata = authUser.user_metadata || {};

      // Create basic profile
      const { data: newProfile, error: profileError } = await supabase
        .from("profiles")
        .insert([
          {
            id: authUser.id,
            role: userMetadata.role || "student",
            full_name: userMetadata.full_name || "",
            phone: userMetadata.phone || "",
          },
        ])
        .select()
        .single();

      if (profileError) throw profileError;

      // Create role-specific record
      const role = userMetadata.role || "student";
      const table = getRoleTable(role);

      if (table) {
        const roleData = {
          id: authUser.id,
          ...getDefaultRoleDetails(role),
        };

        // Add organization-specific fields
        if (table === "organizations") {
          roleData.org_name = userMetadata.full_name || "";
          roleData.org_type = role === "family" ? "individual" : role;
          roleData.contact_person = userMetadata.full_name || "";
        }

        await supabase.from(table).insert([roleData]);
      }

      console.log("Initial profile created successfully");
      return newProfile;
    } catch (error) {
      console.error("Error creating initial profile:", error);
      throw error;
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Update role-specific table
      const table = getRoleTable(profile.role);

      if (table && roleDetails) {
        const updateData = { ...roleDetails };

        // Ensure ID is included
        updateData.id = user.id;

        // Handle array fields
        if (
          profile.role === "teacher" &&
          typeof updateData.subject === "string"
        ) {
          updateData.subject = updateData.subject
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s);
        }

        const { error: roleError } = await supabase
          .from(table)
          .upsert(updateData);

        if (roleError) throw roleError;
      }

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      setError(error.message || "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // Show loading while checking auth
  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF1E00] mb-4"></div>
        <p className="text-gray-600">Loading your profile...</p>
        <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
      </div>
    );
  }

  // If no profile yet (should be rare with the fix above)
  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-yellow-800">
                Profile Setup Required
              </h3>
              <div className="mt-2 text-yellow-700">
                <p>We need to set up your profile first.</p>
                <button
                  onClick={createInitialProfile}
                  className="mt-4 px-4 py-2 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] transition-colors"
                >
                  Create My Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1F1F1F]">My Profile</h1>
        <p className="text-gray-600 mt-2">
          Complete your profile to get better opportunities
        </p>
      </div>

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

      <form onSubmit={handleSave} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-[#1F1F1F] mb-6 pb-4 border-b border-gray-200">
            Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={profile?.full_name || ""}
                onChange={(e) =>
                  setProfile({ ...profile, full_name: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
                required
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
              <p className="text-xs text-gray-500 mt-2">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={profile?.phone || ""}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
                required
                placeholder="+251 9XX XXX XXX"
              />
              <p className="text-xs text-gray-500 mt-2">
                Used for notifications and verification
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${getRoleColor(profile.role)}`}
                >
                  <span className="text-white text-sm font-medium">
                    {getRoleIcon(profile.role)}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-[#1F1F1F] capitalize">
                    {profile.role}
                  </div>
                  <div className="text-sm text-gray-500">
                    {getRoleDescription(profile.role)}
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Role cannot be changed. Contact support if needed.
              </p>
            </div>
          </div>
        </div>

        {/* Role-specific fields */}
        {profile?.role === "teacher" && roleDetails && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-[#1F1F1F] mb-6 pb-4 border-b border-gray-200">
              Teaching Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subjects *
                </label>
                <input
                  type="text"
                  value={
                    Array.isArray(roleDetails.subject)
                      ? roleDetails.subject.join(", ")
                      : roleDetails.subject || ""
                  }
                  onChange={(e) =>
                    setRoleDetails({
                      ...roleDetails,
                      subject: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
                  placeholder="Mathematics, Physics, Chemistry"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Separate multiple subjects with commas
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience (Years)
                </label>
                <input
                  type="number"
                  value={roleDetails.experience_years || 0}
                  onChange={(e) =>
                    setRoleDetails({
                      ...roleDetails,
                      experience_years: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
                  min="0"
                  max="50"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Years of teaching experience
                </p>
              </div>
            </div>
          </div>
        )}

        {profile?.role === "student" && roleDetails && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-[#1F1F1F] mb-6 pb-4 border-b border-gray-200">
              Student Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  University
                </label>
                <input
                  type="text"
                  value={roleDetails.university || ""}
                  onChange={(e) =>
                    setRoleDetails({
                      ...roleDetails,
                      university: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
                  placeholder="Addis Ababa University"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={roleDetails.department || ""}
                  onChange={(e) =>
                    setRoleDetails({
                      ...roleDetails,
                      department: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
                  placeholder="Computer Science"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Graduation Year
                </label>
                <input
                  type="number"
                  value={
                    roleDetails.graduation_year || new Date().getFullYear() + 1
                  }
                  onChange={(e) =>
                    setRoleDetails({
                      ...roleDetails,
                      graduation_year:
                        parseInt(e.target.value) ||
                        new Date().getFullYear() + 1,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
                  min={new Date().getFullYear()}
                  max={new Date().getFullYear() + 10}
                />
              </div>
            </div>
          </div>
        )}

        {/* Organization fields */}
        {["school", "ngo", "family"].includes(profile?.role) && roleDetails && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-[#1F1F1F] mb-6 pb-4 border-b border-gray-200">
              Organization Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  value={roleDetails.org_name || ""}
                  onChange={(e) =>
                    setRoleDetails({
                      ...roleDetails,
                      org_name: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
                  required
                  placeholder={
                    profile.role === "family"
                      ? "Family Name"
                      : "Organization Name"
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Person *
                </label>
                <input
                  type="text"
                  value={roleDetails.contact_person || ""}
                  onChange={(e) =>
                    setRoleDetails({
                      ...roleDetails,
                      contact_person: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
                  required
                  placeholder="Contact person name"
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center"
          >
            {saving ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Saving...
              </>
            ) : (
              "Save Profile"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// Helper functions
function getRoleColor(role) {
  switch (role) {
    case "teacher":
      return "bg-blue-500";
    case "student":
      return "bg-green-500";
    case "school":
      return "bg-purple-500";
    case "ngo":
      return "bg-orange-500";
    case "family":
      return "bg-pink-500";
    default:
      return "bg-gray-500";
  }
}

function getRoleIcon(role) {
  switch (role) {
    case "teacher":
      return "👨‍🏫";
    case "student":
      return "🎓";
    case "school":
      return "🏫";
    case "ngo":
      return "🤝";
    case "family":
      return "👨‍👩‍👧";
    default:
      return "👤";
  }
}

function getRoleDescription(role) {
  switch (role) {
    case "teacher":
      return "Educator looking for teaching opportunities";
    case "student":
      return "University student seeking part-time work";
    case "school":
      return "Educational institution hiring staff";
    case "ngo":
      return "Organization running educational programs";
    case "family":
      return "Family seeking private tutors";
    default:
      return "Platform user";
  }
}
