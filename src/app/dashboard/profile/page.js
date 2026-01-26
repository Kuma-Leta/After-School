// app/dashboard/profile/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import ProfileUpdateForm from "./components/ProfileUpdateForm";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [roleDetails, setRoleDetails] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
          router.push("/login");
          return;
        }

        if (!session) {
          router.push("/login");
          return;
        }

        setUser(session.user);
        await loadProfile(session.user.id);
      } catch (err) {
        console.error("Load error:", err);
        setError("Failed to load profile data: " + err.message);
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  async function loadProfile(userId) {
    try {
      setLoading(true);
      setError("");

      // Load main profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("Profile error:", profileError);
        throw profileError;
      }

      if (!profileData) {
        // Create default profile if doesn't exist
        const newProfile = {
          id: userId,
          email: user?.email || "",
          full_name: "",
          role: "teacher",
          phone: "",
          location: "",
          gender: "",
          languages: [],
          bio: "",
          date_of_birth: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setProfile(newProfile);
        setRoleDetails({});
        return;
      }

      setProfile(profileData);

      // Load role-specific details
      const roleTable = getRoleTable(profileData.role);
      if (roleTable) {
        console.log(`Loading from ${roleTable} for user ${userId}`);

        const { data: roleData, error: roleError } = await supabase
          .from(roleTable)
          .select("*")
          .or(`id.eq.${userId},user_id.eq.${userId}`)
          .maybeSingle();

        if (roleError) {
          console.warn(`Role details error for ${roleTable}:`, roleError);

          // If table doesn't exist or has no data, use empty object
          if (
            roleError.code === "PGRST116" ||
            roleError.message.includes("does not exist")
          ) {
            console.log(`No data found in ${roleTable}, using empty object`);
            setRoleDetails({});
          } else {
            throw roleError;
          }
        } else {
          console.log(`Loaded role data:`, roleData);
          setRoleDetails(roleData || {});
        }
      } else {
        setRoleDetails({});
      }
    } catch (err) {
      console.error("Profile load error:", err);
      setError("Failed to load profile: " + err.message);
    } finally {
      setLoading(false);
    }
  }

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

  const handleEditClick = () => {
    router.push("/dashboard/profile/update");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FF1E00] mx-auto mb-6"></div>
            <h2 className="text-xl font-semibold text-[#1F1F1F] mb-2">
              Loading Profile
            </h2>
            <p className="text-gray-600">
              Please wait while we load your profile...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <svg
              className="w-12 h-12 text-red-500 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Error Loading Profile
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => loadProfile(user?.id)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <span className="text-red-700 text-sm font-medium">Error</span>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <span className="text-green-700 text-sm font-medium">
                  Success!
                </span>
                <p className="text-green-600 text-sm mt-1">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#1F1F1F]">My Profile</h1>
              <p className="text-gray-600 mt-2">
                View and manage your profile information
              </p>
            </div>
            <button
              onClick={handleEditClick}
              className="px-6 py-3 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] transition-colors font-medium flex items-center"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit Profile
            </button>
          </div>
        </div>

        {/* Profile Info Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-center">
                <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#FF1E00] flex items-center justify-center text-white text-4xl font-bold">
                      {profile?.full_name?.charAt(0) ||
                        profile?.email?.charAt(0) ||
                        "U"}
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold text-[#1F1F1F]">
                  {profile?.full_name || "No Name Provided"}
                </h2>
                <p className="text-gray-600 mt-1">{profile?.email}</p>
                <div className="mt-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                      profile?.role === "teacher"
                        ? "bg-blue-100 text-blue-800"
                        : profile?.role === "student"
                          ? "bg-green-100 text-green-800"
                          : profile?.role === "school"
                            ? "bg-purple-100 text-purple-800"
                            : profile?.role === "ngo"
                              ? "bg-orange-100 text-orange-800"
                              : profile?.role === "family"
                                ? "bg-pink-100 text-pink-800"
                                : profile?.role === "admin"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {profile?.role} Account
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {profile?.phone && (
                  <div className="flex items-center text-gray-700">
                    <svg
                      className="w-5 h-5 text-gray-500 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <span>{profile.phone}</span>
                  </div>
                )}
                {profile?.location && (
                  <div className="flex items-center text-gray-700">
                    <svg
                      className="w-5 h-5 text-gray-500 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile?.gender && (
                  <div className="flex items-center text-gray-700">
                    <svg
                      className="w-5 h-5 text-gray-500 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span>{profile.gender}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-[#1F1F1F] mb-4">
                Profile Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <p className="text-gray-900 font-medium">
                    {profile?.full_name || "Not provided"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <p className="text-gray-900 font-medium">{profile?.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <p className="text-gray-900 font-medium capitalize">
                    {profile?.role}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Member Since
                  </label>
                  <p className="text-gray-900 font-medium">
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <p className="text-gray-900">
                    {profile?.bio || "No bio provided"}
                  </p>
                </div>

                {Array.isArray(profile?.languages) &&
                  profile.languages.length > 0 && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Languages Spoken
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {profile.languages.map((lang, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              {/* Role-specific information */}
              {renderRoleSpecificInfo(profile?.role, roleDetails)}
            </div>
          </div>
        </div>

        {/* Placeholder for messages/notifications */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <span className="text-yellow-800 text-sm font-medium">
                Profile Preview
              </span>
              <p className="text-yellow-700 text-sm mt-1">
                This is a preview of your profile. Click "Edit Profile" above to
                update your information. You can also navigate to specific
                profile sections using the dashboard sidebar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderRoleSpecificInfo(role, roleDetails) {
  if (!role || !roleDetails) return null;

  switch (role) {
    case "teacher":
      return (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-lg font-medium text-[#1F1F1F] mb-4">
            Teaching Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roleDetails.experience_years && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Experience
                </label>
                <p className="font-medium">
                  {roleDetails.experience_years} years
                </p>
              </div>
            )}
            {roleDetails.education_level && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Education Level
                </label>
                <p className="font-medium capitalize">
                  {roleDetails.education_level}
                </p>
              </div>
            )}
            {Array.isArray(roleDetails.subjects) &&
              roleDetails.subjects.length > 0 && (
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">
                    Subjects
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {roleDetails.subjects.map((subject, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      );

    case "student":
      return (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-lg font-medium text-[#1F1F1F] mb-4">
            Student Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roleDetails.university && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  University
                </label>
                <p className="font-medium">{roleDetails.university}</p>
              </div>
            )}
            {roleDetails.department && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Department
                </label>
                <p className="font-medium">{roleDetails.department}</p>
              </div>
            )}
            {Array.isArray(roleDetails.skills) &&
              roleDetails.skills.length > 0 && (
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">
                    Skills
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {roleDetails.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      );

    case "school":
      return (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-lg font-medium text-[#1F1F1F] mb-4">
            School Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roleDetails.school_name && (
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">
                  School Name
                </label>
                <p className="font-medium text-lg">{roleDetails.school_name}</p>
              </div>
            )}
            {roleDetails.school_type && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  School Type
                </label>
                <p className="font-medium">{roleDetails.school_type}</p>
              </div>
            )}
            {roleDetails.student_count && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Students
                </label>
                <p className="font-medium">{roleDetails.student_count}</p>
              </div>
            )}
          </div>
        </div>
      );

    default:
      return null;
  }
}
