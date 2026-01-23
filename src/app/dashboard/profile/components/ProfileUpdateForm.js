// app/dashboard/profile/components/ProfileUpdateForm.js
"use client";

import { useState } from "react";

const TEACHING_SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English Language",
  "Amharic",
  "Afan Oromo",
  "History",
  "Geography",
  "Civics",
  "Economics",
  "Business Studies",
  "Computer Science",
  "ICT",
  "Art",
  "Music",
  "Physical Education",
  "Religious Education",
];

const STUDENT_SKILLS = [
  "Tutoring",
  "Mentoring",
  "Child Care",
  "Classroom Assistance",
  "Lesson Planning",
  "Educational Support",
  "Communication",
  "Leadership",
  "Organization",
  "Time Management",
  "Problem Solving",
  "Creative Teaching",
  "Adaptability",
];

const GRADE_LEVELS = [
  "Elementary (1-4)",
  "Primary (5-8)",
  "Secondary (9-10)",
  "Preparatory (11-12)",
  "University",
  "Adult Education",
];

export default function ProfileUpdateForm({
  profile,
  roleDetails,
  user,
  onSave,
  onCancel,
}) {
  const [saving, setSaving] = useState(false);
  const [formProfile, setFormProfile] = useState(profile || {});
  const [formRoleDetails, setFormRoleDetails] = useState(roleDetails || {});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...formProfile,
        roleDetails: formRoleDetails,
      });
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = (skill) => {
    if (profile?.role === "teacher") {
      const currentSubjects = Array.isArray(formRoleDetails?.subject)
        ? formRoleDetails.subject
        : [];
      if (!currentSubjects.includes(skill)) {
        setFormRoleDetails({
          ...formRoleDetails,
          subject: [...currentSubjects, skill],
        });
      }
    } else if (profile?.role === "student") {
      const currentSkills = Array.isArray(formRoleDetails?.skills)
        ? formRoleDetails.skills
        : [];
      if (!currentSkills.includes(skill)) {
        setFormRoleDetails({
          ...formRoleDetails,
          skills: [...currentSkills, skill],
        });
      }
    }
  };

  const handleRemoveSkill = (index, field) => {
    if (formRoleDetails && formRoleDetails[field]) {
      const updated = [...formRoleDetails[field]];
      updated.splice(index, 1);
      setFormRoleDetails({
        ...formRoleDetails,
        [field]: updated,
      });
    }
  };

  const getRoleTitle = () => {
    switch (profile?.role) {
      case "teacher":
        return "Update Educator Profile";
      case "student":
        return "Update Student Profile";
      case "school":
        return "Update School Profile";
      case "ngo":
        return "Update Organization Profile";
      case "family":
        return "Update Family Profile";
      default:
        return "Update Profile";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1F1F1F]">{getRoleTitle()}</h1>
        <p className="text-gray-600 mt-2">
          Update your profile information below
        </p>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[#1F1F1F]">
            Personal Information
          </h2>
          <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
            Required
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formProfile?.full_name || ""}
              onChange={(e) =>
                setFormProfile({ ...formProfile, full_name: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
              required
              placeholder="Dr. John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Professional Email
            </label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              value={formProfile?.phone || ""}
              onChange={(e) =>
                setFormProfile({ ...formProfile, phone: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
              required
              placeholder="+251 9XX XXX XXX"
            />
          </div>
        </div>
      </div>

      {/* Teacher-specific form */}
      {profile?.role === "teacher" && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[#1F1F1F]">
              Teaching Qualifications
            </h2>
            <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full">
              Professional
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subjects You Teach *
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {Array.isArray(formRoleDetails?.subject) &&
                  formRoleDetails.subject.map((subject, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {subject}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(index, "subject")}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {TEACHING_SUBJECTS.slice(0, 8).map((subject) => (
                  <button
                    type="button"
                    key={subject}
                    onClick={() => handleAddSkill(subject)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    + {subject}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Or type additional subjects (comma separated)"
                value={
                  Array.isArray(formRoleDetails?.subject)
                    ? formRoleDetails.subject.join(", ")
                    : ""
                }
                onChange={(e) =>
                  setFormRoleDetails({
                    ...formRoleDetails,
                    subject: e.target.value,
                  })
                }
                className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Years of Experience *
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={formRoleDetails?.experience_years || 0}
                onChange={(e) =>
                  setFormRoleDetails({
                    ...formRoleDetails,
                    experience_years: e.target.value,
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Education Level
              </label>
              <select
                value={formRoleDetails?.education_level || ""}
                onChange={(e) =>
                  setFormRoleDetails({
                    ...formRoleDetails,
                    education_level: e.target.value,
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
              >
                <option value="">Select highest degree</option>
                <option value="diploma">Diploma</option>
                <option value="bachelor">Bachelor&apos;s Degree</option>
                <option value="master">Master&apos;s Degree</option>
                <option value="phd">PhD</option>
                <option value="professor">Professor</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Professional Bio
              </label>
              <textarea
                value={formRoleDetails?.bio || ""}
                onChange={(e) =>
                  setFormRoleDetails({
                    ...formRoleDetails,
                    bio: e.target.value,
                  })
                }
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
                placeholder="Describe your teaching philosophy..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Student-specific form */}
      {profile?.role === "student" && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[#1F1F1F]">
              Student Profile
            </h2>
            <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full">
              Tutoring
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                University *
              </label>
              <input
                type="text"
                value={formRoleDetails?.university || ""}
                onChange={(e) =>
                  setFormRoleDetails({
                    ...formRoleDetails,
                    university: e.target.value,
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
                placeholder="Addis Ababa University"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department *
              </label>
              <input
                type="text"
                value={formRoleDetails?.department || ""}
                onChange={(e) =>
                  setFormRoleDetails({
                    ...formRoleDetails,
                    department: e.target.value,
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
                placeholder="Computer Science"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tutoring Skills & Abilities
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {Array.isArray(formRoleDetails?.skills) &&
                  formRoleDetails.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(index, "skills")}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {STUDENT_SKILLS.slice(0, 8).map((skill) => (
                  <button
                    type="button"
                    key={skill}
                    onClick={() => handleAddSkill(skill)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    + {skill}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Or type additional skills (comma separated)"
                value={
                  Array.isArray(formRoleDetails?.skills)
                    ? formRoleDetails.skills.join(", ")
                    : ""
                }
                onChange={(e) =>
                  setFormRoleDetails({
                    ...formRoleDetails,
                    skills: e.target.value,
                  })
                }
                className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Organization-specific form */}
      {["school", "ngo", "family"].includes(profile?.role) && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[#1F1F1F]">
              {profile.role === "school"
                ? "School Information"
                : profile.role === "ngo"
                  ? "Organization Details"
                  : "Family Information"}
            </h2>
            <span className="text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
              Employer
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {profile.role === "school"
                  ? "School Name *"
                  : profile.role === "ngo"
                    ? "Organization Name *"
                    : "Family Name *"}
              </label>
              <input
                type="text"
                value={formRoleDetails?.org_name || ""}
                onChange={(e) =>
                  setFormRoleDetails({
                    ...formRoleDetails,
                    org_name: e.target.value,
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
                placeholder={
                  profile.role === "school"
                    ? "Green Valley High School"
                    : profile.role === "ngo"
                      ? "Education for All NGO"
                      : "Smith Family"
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Person *
              </label>
              <input
                type="text"
                value={formRoleDetails?.contact_person || ""}
                onChange={(e) =>
                  setFormRoleDetails({
                    ...formRoleDetails,
                    contact_person: e.target.value,
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
                placeholder="Mr. John Smith"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={formRoleDetails?.address || ""}
                onChange={(e) =>
                  setFormRoleDetails({
                    ...formRoleDetails,
                    address: e.target.value,
                  })
                }
                rows="2"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
                placeholder="Full address for coordination"
              />
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200">
        <div>
          <p className="text-sm text-gray-600">
            Your profile is visible to potential employers/teachers
          </p>
        </div>
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center"
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
                Saving Changes...
              </>
            ) : (
              "Update Profile"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
