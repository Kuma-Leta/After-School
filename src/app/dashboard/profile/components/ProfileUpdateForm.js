// app/dashboard/profile/components/ProfileUpdateForm.js
"use client";

import { useState, useEffect } from "react";

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

const LANGUAGES = [
  "English",
  "Amharic",
  "Afan Oromo",
  "Tigrinya",
  "Somali",
  "Wolaytta",
  "Sidama",
  "Hadiyya",
  "Gurage",
  "Other",
];

const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];

export default function ProfileUpdateForm({
  profile,
  roleDetails,
  user,
  onSave,
  onCancel,
  saving = false,
}) {
  const [formProfile, setFormProfile] = useState(profile || {});
  const [formRoleDetails, setFormRoleDetails] = useState(roleDetails || {});

  useEffect(() => {
    if (profile) {
      setFormProfile(profile);
    }
    if (roleDetails) {
      setFormRoleDetails(roleDetails);
    }
  }, [profile, roleDetails]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSave = {
      ...formProfile,
      roleDetails: formRoleDetails,
    };
    await onSave(dataToSave);
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setFormProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleArrayFieldChange = (field, value, isChecked) => {
    const currentArray = Array.isArray(formProfile[field])
      ? formProfile[field]
      : [];

    let updatedArray;
    if (isChecked) {
      updatedArray = [...currentArray, value];
    } else {
      updatedArray = currentArray.filter((item) => item !== value);
    }

    setFormProfile((prev) => ({
      ...prev,
      [field]: updatedArray,
    }));
  };

  const handleRoleDetailsChange = (e) => {
    const { name, value } = e.target;
    setFormRoleDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddSkill = (skill, field) => {
    const currentSkills = Array.isArray(formRoleDetails[field])
      ? formRoleDetails[field]
      : [];

    if (!currentSkills.includes(skill)) {
      setFormRoleDetails((prev) => ({
        ...prev,
        [field]: [...currentSkills, skill],
      }));
    }
  };

  const handleRemoveSkill = (index, field) => {
    const currentSkills = Array.isArray(formRoleDetails[field])
      ? formRoleDetails[field]
      : [];

    const updatedSkills = [...currentSkills];
    updatedSkills.splice(index, 1);

    setFormRoleDetails((prev) => ({
      ...prev,
      [field]: updatedSkills,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1F1F1F]">Update Profile</h1>
        <p className="text-gray-600 mt-2">
          Update your profile information below
        </p>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-[#1F1F1F] mb-6">
          Personal Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="full_name"
              value={formProfile?.full_name || ""}
              onChange={handleProfileChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formProfile?.phone || ""}
              onChange={handleProfileChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formProfile?.location || ""}
              onChange={handleProfileChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
              placeholder="City, Region"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              name="date_of_birth"
              value={formProfile?.date_of_birth || ""}
              onChange={handleProfileChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender
            </label>
            <select
              name="gender"
              value={formProfile?.gender || ""}
              onChange={handleProfileChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            >
              <option value="">Select Gender</option>
              {GENDERS.map((gender) => (
                <option key={gender} value={gender}>
                  {gender}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Languages Spoken
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {LANGUAGES.map((language) => (
                <div key={language} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`lang-${language}`}
                    checked={
                      Array.isArray(formProfile?.languages) &&
                      formProfile.languages.includes(language)
                    }
                    onChange={(e) =>
                      handleArrayFieldChange(
                        "languages",
                        language,
                        e.target.checked,
                      )
                    }
                    className="h-4 w-4 text-[#FF1E00] focus:ring-[#FF1E00] border-gray-300 rounded"
                  />
                  <label
                    htmlFor={`lang-${language}`}
                    className="ml-2 text-sm text-gray-700"
                  >
                    {language}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Teacher-specific form */}
      {profile?.role === "teacher" && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-[#1F1F1F] mb-6">
            Teaching Qualifications
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subjects You Teach
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                {TEACHING_SUBJECTS.slice(0, 8).map((subject) => (
                  <button
                    type="button"
                    key={subject}
                    onClick={() => handleAddSkill(subject, "subject")}
                    className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    + {subject}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Type additional subjects (comma separated)"
                value={
                  Array.isArray(formRoleDetails?.subject)
                    ? formRoleDetails.subject.join(", ")
                    : ""
                }
                onChange={(e) =>
                  setFormRoleDetails((prev) => ({
                    ...prev,
                    subject: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter((s) => s),
                  }))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Years of Experience
              </label>
              <input
                type="number"
                name="experience_years"
                value={formRoleDetails?.experience_years || 0}
                onChange={handleRoleDetailsChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
                min="0"
                max="50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Education Level
              </label>
              <select
                name="education_level"
                value={formRoleDetails?.education_level || ""}
                onChange={handleRoleDetailsChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
              >
                <option value="">Select highest degree</option>
                <option value="diploma">Diploma</option>
                <option value="bachelor">Bachelor's Degree</option>
                <option value="master">Master's Degree</option>
                <option value="phd">PhD</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                name="bio"
                value={formRoleDetails?.bio || ""}
                onChange={handleRoleDetailsChange}
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
                placeholder="Tell us about your teaching experience..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Student-specific form */}
      {profile?.role === "student" && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-[#1F1F1F] mb-6">
            Student Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                University
              </label>
              <input
                type="text"
                name="university"
                value={formRoleDetails?.university || ""}
                onChange={handleRoleDetailsChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <input
                type="text"
                name="department"
                value={formRoleDetails?.department || ""}
                onChange={handleRoleDetailsChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                {STUDENT_SKILLS.slice(0, 8).map((skill) => (
                  <button
                    type="button"
                    key={skill}
                    onClick={() => handleAddSkill(skill, "skills")}
                    className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    + {skill}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Type additional skills (comma separated)"
                value={
                  Array.isArray(formRoleDetails?.skills)
                    ? formRoleDetails.skills.join(", ")
                    : ""
                }
                onChange={(e) =>
                  setFormRoleDetails((prev) => ({
                    ...prev,
                    skills: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter((s) => s),
                  }))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-8 py-3 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center"
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
            "Save Changes"
          )}
        </button>
      </div>
    </form>
  );
}
