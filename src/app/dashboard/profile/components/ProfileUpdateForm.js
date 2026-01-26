// app/dashboard/profile/components/ProfileUpdateForm.js
"use client";

import { useState, useEffect } from "react";

// Common constants
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
  "Kindergarten",
  "Elementary (1-4)",
  "Primary (5-8)",
  "Secondary (9-10)",
  "Preparatory (11-12)",
  "University",
  "Adult Education",
  "Special Needs",
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
  "Arabic",
  "French",
  "Other",
];

const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];

// School-specific constants
const SCHOOL_TYPES = [
  "Public School",
  "Private School",
  "International School",
  "Community School",
  "Religious School",
  "Charter School",
  "Other",
];

const SCHOOL_LEVELS = [
  "Kindergarten",
  "Elementary",
  "Primary",
  "Secondary",
  "Preparatory",
  "Vocational",
  "All Levels",
];

const NGO_FOCUS_AREAS = [
  "Education",
  "Poverty Alleviation",
  "Healthcare",
  "Child Welfare",
  "Women Empowerment",
  "Disability Support",
  "Rural Development",
  "Environmental Protection",
  "Youth Development",
  "Refugee Support",
];

const FAMILY_NEEDS = [
  "Homework Help",
  "Exam Preparation",
  "Reading Assistance",
  "Math Tutoring",
  "Science Help",
  "Language Learning",
  "Special Education",
  "College Prep",
  "SAT/ACT Prep",
  "ESL Support",
];

const ADMIN_DEPARTMENTS = [
  "User Management",
  "Content Moderation",
  "Payment Processing",
  "Technical Support",
  "Customer Service",
  "Marketing",
  "Operations",
];

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
  const [customSkill, setCustomSkill] = useState("");

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
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      const currentArray = Array.isArray(formProfile[name])
        ? formProfile[name]
        : [];
      let updatedArray;
      if (checked) {
        updatedArray = [...currentArray, value];
      } else {
        updatedArray = currentArray.filter((item) => item !== value);
      }
      setFormProfile((prev) => ({
        ...prev,
        [name]: updatedArray,
      }));
    } else {
      setFormProfile((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleRoleDetailsChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      const currentArray = Array.isArray(formRoleDetails[name])
        ? formRoleDetails[name]
        : [];
      let updatedArray;
      if (checked) {
        updatedArray = [...currentArray, value];
      } else {
        updatedArray = currentArray.filter((item) => item !== value);
      }
      setFormRoleDetails((prev) => ({
        ...prev,
        [name]: updatedArray,
      }));
    } else {
      setFormRoleDetails((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleAddSkill = (skill, field) => {
    const currentSkills = Array.isArray(formRoleDetails[field])
      ? formRoleDetails[field]
      : [];
    if (skill && !currentSkills.includes(skill)) {
      setFormRoleDetails((prev) => ({
        ...prev,
        [field]: [...currentSkills, skill],
      }));
      if (field === "skills" || field === "subject") {
        setCustomSkill("");
      }
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

  const handleAddCustomSkill = (field) => {
    if (customSkill.trim()) {
      handleAddSkill(customSkill.trim(), field);
    }
  };

  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      // In a real app, you would upload to Supabase storage here
      console.log("File selected for", field, file);
      setFormProfile((prev) => ({
        ...prev,
        [field]: URL.createObjectURL(file), // Temporary URL
      }));
    }
  };

  // Render role-specific sections
  const renderRoleSpecificSection = () => {
    switch (profile?.role) {
      case "teacher":
        return renderTeacherSection();
      case "student":
        return renderStudentSection();
      case "school":
        return renderSchoolSection();
      case "ngo":
        return renderNgoSection();
      case "family":
        return renderFamilySection();
      case "admin":
        return renderAdminSection();
      default:
        return null;
    }
  };

  const renderTeacherSection = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-[#1F1F1F] mb-6">
        Teaching Qualifications
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subjects You Teach *
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {Array.isArray(formRoleDetails?.subjects) &&
              formRoleDetails.subjects.map((subject, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {subject}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(index, "subjects")}
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
                onClick={() => handleAddSkill(subject, "subjects")}
                className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                + {subject}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add custom subject"
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              onKeyPress={(e) =>
                e.key === "Enter" && handleAddCustomSkill("subjects")
              }
            />
            <button
              type="button"
              onClick={() => handleAddCustomSkill("subjects")}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Add
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Years of Experience *
          </label>
          <input
            type="number"
            name="experience_years"
            value={formRoleDetails?.experience_years || ""}
            onChange={handleRoleDetailsChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            min="0"
            max="50"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Education Level *
          </label>
          <select
            name="education_level"
            value={formRoleDetails?.education_level || ""}
            onChange={handleRoleDetailsChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            required
          >
            <option value="">Select highest degree</option>
            <option value="certificate">Certificate</option>
            <option value="diploma">Diploma</option>
            <option value="bachelor">Bachelor&apos;s Degree</option>
            <option value="master">Master&apos;s Degree</option>
            <option value="phd">PhD</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Grade Levels You Teach
          </label>
          <div className="grid grid-cols-2 gap-2">
            {GRADE_LEVELS.slice(0, 6).map((level) => (
              <div key={level} className="flex items-center">
                <input
                  type="checkbox"
                  id={`level-${level}`}
                  value={level}
                  checked={
                    Array.isArray(formRoleDetails?.grade_levels) &&
                    formRoleDetails.grade_levels.includes(level)
                  }
                  onChange={handleRoleDetailsChange}
                  name="grade_levels"
                  className="h-4 w-4 text-[#FF1E00] focus:ring-[#FF1E00] border-gray-300 rounded"
                />
                <label
                  htmlFor={`level-${level}`}
                  className="ml-2 text-sm text-gray-700"
                >
                  {level}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio / Teaching Philosophy *
          </label>
          <textarea
            name="bio"
            value={formRoleDetails?.bio || ""}
            onChange={handleRoleDetailsChange}
            rows="4"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            placeholder="Tell us about your teaching experience, philosophy, and approach..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hourly Rate (ETB)
          </label>
          <input
            type="number"
            name="hourly_rate"
            value={formRoleDetails?.hourly_rate || ""}
            onChange={handleRoleDetailsChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            min="50"
            step="50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Availability
          </label>
          <select
            name="availability"
            value={formRoleDetails?.availability || ""}
            onChange={handleRoleDetailsChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
          >
            <option value="">Select availability</option>
            <option value="full_time">Full Time</option>
            <option value="part_time">Part Time</option>
            <option value="weekends_only">Weekends Only</option>
            <option value="evenings_only">Evenings Only</option>
            <option value="flexible">Flexible</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderStudentSection = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-[#1F1F1F] mb-6">
        Student Information
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            University/College *
          </label>
          <input
            type="text"
            name="university"
            value={formRoleDetails?.university || ""}
            onChange={handleRoleDetailsChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Department/Major *
          </label>
          <input
            type="text"
            name="department"
            value={formRoleDetails?.department || ""}
            onChange={handleRoleDetailsChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Year of Study
          </label>
          <select
            name="year_of_study"
            value={formRoleDetails?.year_of_study || ""}
            onChange={handleRoleDetailsChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
          >
            <option value="">Select year</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
            <option value="5+">Year 5+</option>
            <option value="graduate">Graduate Student</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expected Graduation Year
          </label>
          <input
            type="number"
            name="graduation_year"
            value={formRoleDetails?.graduation_year || ""}
            onChange={handleRoleDetailsChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            min="2024"
            max="2030"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Skills & Competencies
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
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add custom skill"
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              onKeyPress={(e) =>
                e.key === "Enter" && handleAddCustomSkill("skills")
              }
            />
            <button
              type="button"
              onClick={() => handleAddCustomSkill("skills")}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Add
            </button>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Career Interests / Goals
          </label>
          <textarea
            name="career_goals"
            value={formRoleDetails?.career_goals || ""}
            onChange={handleRoleDetailsChange}
            rows="3"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            placeholder="What are your career goals? What kind of teaching/tutoring work are you looking for?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Availability for Work
          </label>
          <select
            name="availability"
            value={formRoleDetails?.availability || ""}
            onChange={handleRoleDetailsChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
          >
            <option value="">Select availability</option>
            <option value="full_time">Full Time</option>
            <option value="part_time">Part Time</option>
            <option value="weekends">Weekends Only</option>
            <option value="evenings">Evenings Only</option>
            <option value="summer">Summer Break</option>
            <option value="flexible">Flexible</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Subjects
          </label>
          <select
            name="preferred_subjects"
            value={formRoleDetails?.preferred_subjects || ""}
            onChange={handleRoleDetailsChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
          >
            <option value="">Select preferred subjects</option>
            {TEACHING_SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const renderSchoolSection = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-[#1F1F1F] mb-6">
        School Information
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            School Name *
          </label>
          <input
            type="text"
            name="school_name"
            value={formRoleDetails?.school_name || ""}
            onChange={handleRoleDetailsChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            School Type *
          </label>
          <select
            name="school_type"
            value={formRoleDetails?.school_type || ""}
            onChange={handleRoleDetailsChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            required
          >
            <option value="">Select school type</option>
            {SCHOOL_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            School Level *
          </label>
          <select
            name="school_level"
            value={formRoleDetails?.school_level || ""}
            onChange={handleRoleDetailsChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            required
          >
            <option value="">Select level</option>
            {SCHOOL_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            School Address *
          </label>
          <textarea
            name="address"
            value={formRoleDetails?.address || ""}
            onChange={handleRoleDetailsChange}
            rows="2"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            placeholder="Full school address"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Person *
          </label>
          <input
            type="text"
            name="contact_person"
            value={formRoleDetails?.contact_person || ""}
            onChange={handleRoleDetailsChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Position
          </label>
          <input
            type="text"
            name="contact_position"
            value={formRoleDetails?.contact_position || ""}
            onChange={handleRoleDetailsChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            placeholder="e.g., Principal, HR Manager"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Students
          </label>
          <input
            type="number"
            name="student_count"
            value={formRoleDetails?.student_count || ""}
            onChange={handleRoleDetailsChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Teachers Needed
          </label>
          <input
            type="number"
            name="teachers_needed"
            value={formRoleDetails?.teachers_needed || ""}
            onChange={handleRoleDetailsChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            min="0"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subjects Needed
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {TEACHING_SUBJECTS.slice(0, 12).map((subject) => (
              <div key={subject} className="flex items-center">
                <input
                  type="checkbox"
                  id={`school-subject-${subject}`}
                  value={subject}
                  checked={
                    Array.isArray(formRoleDetails?.subjects_needed) &&
                    formRoleDetails.subjects_needed.includes(subject)
                  }
                  onChange={handleRoleDetailsChange}
                  name="subjects_needed"
                  className="h-4 w-4 text-[#FF1E00] focus:ring-[#FF1E00] border-gray-300 rounded"
                />
                <label
                  htmlFor={`school-subject-${subject}`}
                  className="ml-2 text-sm text-gray-700"
                >
                  {subject}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            School Description / Mission
          </label>
          <textarea
            name="description"
            value={formRoleDetails?.description || ""}
            onChange={handleRoleDetailsChange}
            rows="3"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            placeholder="Tell us about your school, mission, and what you're looking for in teachers..."
          />
        </div>
      </div>
    </div>
  );

  const renderNgoSection = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-[#1F1F1F] mb-6">
        NGO Information
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Organization Name *
          </label>
          <input
            type="text"
            name="organization_name"
            value={formRoleDetails?.organization_name || ""}
            onChange={handleRoleDetailsChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Focus Area *
          </label>
          <select
            name="focus_area"
            value={formRoleDetails?.focus_area || ""}
            onChange={handleRoleDetailsChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            required
          >
            <option value="">Select focus area</option>
            {NGO_FOCUS_AREAS.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Website
          </label>
          <input
            type="url"
            name="website"
            value={formRoleDetails?.website || ""}
            onChange={handleRoleDetailsChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            placeholder="https://example.org"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Organization Address *
          </label>
          <textarea
            name="address"
            value={formRoleDetails?.address || ""}
            onChange={handleRoleDetailsChange}
            rows="2"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Person *
          </label>
          <input
            type="text"
            name="contact_person"
            value={formRoleDetails?.contact_person || ""}
            onChange={handleRoleDetailsChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Position
          </label>
          <input
            type="text"
            name="contact_position"
            value={formRoleDetails?.contact_position || ""}
            onChange={handleRoleDetailsChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            placeholder="e.g., Program Manager, Director"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Volunteers Needed
          </label>
          <input
            type="number"
            name="volunteers_needed"
            value={formRoleDetails?.volunteers_needed || ""}
            onChange={handleRoleDetailsChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Paid Positions
          </label>
          <input
            type="number"
            name="paid_positions"
            value={formRoleDetails?.paid_positions || ""}
            onChange={handleRoleDetailsChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            min="0"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mission Statement *
          </label>
          <textarea
            name="mission"
            value={formRoleDetails?.mission || ""}
            onChange={handleRoleDetailsChange}
            rows="3"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            placeholder="Describe your organization's mission and goals..."
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Program Description
          </label>
          <textarea
            name="program_description"
            value={formRoleDetails?.program_description || ""}
            onChange={handleRoleDetailsChange}
            rows="3"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            placeholder="Describe the educational programs you run..."
          />
        </div>
      </div>
    </div>
  );

  const renderFamilySection = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-[#1F1F1F] mb-6">
        Family Information
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Family/Guardian Name *
          </label>
          <input
            type="text"
            name="guardian_name"
            value={formRoleDetails?.guardian_name || ""}
            onChange={handleRoleDetailsChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Relationship to Children *
          </label>
          <select
            name="relationship"
            value={formRoleDetails?.relationship || ""}
            onChange={handleRoleDetailsChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            required
          >
            <option value="">Select relationship</option>
            <option value="parent">Parent</option>
            <option value="guardian">Guardian</option>
            <option value="sibling">Sibling</option>
            <option value="relative">Relative</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Children *
          </label>
          <input
            type="number"
            name="number_of_children"
            value={formRoleDetails?.number_of_children || ""}
            onChange={handleRoleDetailsChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            min="1"
            max="10"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Children&apos;s Ages
          </label>
          <input
            type="text"
            name="children_ages"
            value={formRoleDetails?.children_ages || ""}
            onChange={handleRoleDetailsChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            placeholder="e.g., 8, 10, 15"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Education Needs *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {FAMILY_NEEDS.map((need) => (
              <div key={need} className="flex items-center">
                <input
                  type="checkbox"
                  id={`need-${need}`}
                  value={need}
                  checked={
                    Array.isArray(formRoleDetails?.education_needs) &&
                    formRoleDetails.education_needs.includes(need)
                  }
                  onChange={handleRoleDetailsChange}
                  name="education_needs"
                  className="h-4 w-4 text-[#FF1E00] focus:ring-[#FF1E00] border-gray-300 rounded"
                />
                <label
                  htmlFor={`need-${need}`}
                  className="ml-2 text-sm text-gray-700"
                >
                  {need}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Subjects
          </label>
          <div className="flex flex-wrap gap-2">
            {Array.isArray(formRoleDetails?.preferred_subjects) &&
              formRoleDetails.preferred_subjects.map((subject, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                >
                  {subject}
                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveSkill(index, "preferred_subjects")
                    }
                    className="ml-2 text-purple-600 hover:text-purple-800"
                  >
                    ×
                  </button>
                </span>
              ))}
          </div>
          <div className="mt-2 flex gap-2">
            <select
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select subject</option>
              {TEACHING_SUBJECTS.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => handleAddCustomSkill("preferred_subjects")}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Add
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Tutor Gender
          </label>
          <select
            name="preferred_tutor_gender"
            value={formRoleDetails?.preferred_tutor_gender || ""}
            onChange={handleRoleDetailsChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Frequency Needed
          </label>
          <select
            name="frequency"
            value={formRoleDetails?.frequency || ""}
            onChange={handleRoleDetailsChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
          >
            <option value="">Select frequency</option>
            <option value="once_a_week">Once a week</option>
            <option value="twice_a_week">Twice a week</option>
            <option value="three_times_a_week">Three times a week</option>
            <option value="daily">Daily</option>
            <option value="as_needed">As needed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Budget Range (ETB per hour)
          </label>
          <select
            name="budget_range"
            value={formRoleDetails?.budget_range || ""}
            onChange={handleRoleDetailsChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
          >
            <option value="">Select budget</option>
            <option value="50-100">50-100 ETB</option>
            <option value="100-200">100-200 ETB</option>
            <option value="200-300">200-300 ETB</option>
            <option value="300-500">300-500 ETB</option>
            <option value="500+">500+ ETB</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Information
          </label>
          <textarea
            name="additional_info"
            value={formRoleDetails?.additional_info || ""}
            onChange={handleRoleDetailsChange}
            rows="3"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            placeholder="Any special requirements, learning goals, or other information..."
          />
        </div>
      </div>
    </div>
  );

  const renderAdminSection = () => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-[#1F1F1F] mb-6">
        Admin Information
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Department *
          </label>
          <select
            name="department"
            value={formRoleDetails?.department || ""}
            onChange={handleRoleDetailsChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            required
          >
            <option value="">Select department</option>
            {ADMIN_DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Position/Title *
          </label>
          <input
            type="text"
            name="position"
            value={formRoleDetails?.position || ""}
            onChange={handleRoleDetailsChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            placeholder="e.g., System Administrator, Content Moderator"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Employee ID
          </label>
          <input
            type="text"
            name="employee_id"
            value={formRoleDetails?.employee_id || ""}
            onChange={handleRoleDetailsChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Access Level
          </label>
          <select
            name="access_level"
            value={formRoleDetails?.access_level || ""}
            onChange={handleRoleDetailsChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
            <option value="moderator">Moderator</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio / Responsibilities
          </label>
          <textarea
            name="bio"
            value={formRoleDetails?.bio || ""}
            onChange={handleRoleDetailsChange}
            rows="3"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            placeholder="Describe your role and responsibilities..."
          />
        </div>

        <div className="md:col-span-2">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">
              Admin Permissions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                "User Management",
                "Content Moderation",
                "Payment Access",
                "System Settings",
              ].map((permission) => (
                <div key={permission} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`perm-${permission}`}
                    checked={true}
                    readOnly
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label
                    htmlFor={`perm-${permission}`}
                    className="ml-2 text-sm text-blue-700"
                  >
                    {permission}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1F1F1F]">
          Update{" "}
          {profile?.role
            ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
            : ""}{" "}
          Profile
        </h1>
        <p className="text-gray-600 mt-2">
          Complete your profile information below
        </p>
      </div>

      {/* Basic Information - Common for all roles */}
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
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formProfile?.phone || ""}
              onChange={handleProfileChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <input
              type="text"
              name="location"
              value={formProfile?.location || ""}
              onChange={handleProfileChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
              placeholder="City, Region"
              required
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Picture
            </label>
            <div className="flex items-center space-x-4">
              {formProfile?.avatar_url ? (
                <img
                  src={formProfile.avatar_url}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-500">No image</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, "avatar_url")}
                className="flex-1"
              />
            </div>
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
                    value={language}
                    checked={
                      Array.isArray(formProfile?.languages) &&
                      formProfile.languages.includes(language)
                    }
                    onChange={handleProfileChange}
                    name="languages"
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

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              About Me
            </label>
            <textarea
              name="bio"
              value={formProfile?.bio || ""}
              onChange={handleProfileChange}
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
              placeholder="Tell us about yourself..."
            />
          </div>
        </div>
      </div>

      {/* Role-specific section */}
      {renderRoleSpecificSection()}

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
