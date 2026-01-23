// app/dashboard/profile/components/ProfileHeader.js
export default function ProfileHeader({ profile, roleDetails }) {
  const completionPercentage = calculateCompletion(profile, roleDetails);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1F1F1F]">
            {getRoleTitle(profile?.role)}
          </h1>
          <p className="text-gray-600 mt-2">
            {getRoleDescription(profile?.role)}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-500">Account Type</div>
            <div className="font-medium text-[#1F1F1F] capitalize">
              {profile?.role}
            </div>
          </div>
          <div className="w-12 h-12 bg-[#FF1E00]/10 rounded-lg flex items-center justify-center">
            <span className="text-[#FF1E00] text-xl">
              {getRoleEmoji(profile?.role)}
            </span>
          </div>
        </div>
      </div>

      {/* Profile Completion */}
      <div className="bg-gradient-to-r from-[#FF1E00]/5 to-transparent p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[#1F1F1F]">
            Profile Completeness
          </span>
          <span className="text-sm font-bold text-[#FF1E00]">
            {completionPercentage}%
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#FF1E00] transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Complete all sections to increase your chances of getting hired
        </p>
      </div>
    </div>
  );
}

// Helper functions
function getRoleTitle(role) {
  const titles = {
    teacher: "Professional Educator Profile",
    student: "Student Tutor Profile",
    school: "School Administrator Profile",
    ngo: "Organization Profile",
    family: "Family Profile",
  };
  return titles[role] || "Professional Profile";
}

function getRoleDescription(role) {
  const descriptions = {
    teacher:
      "Complete your professional teaching profile to attract better opportunities",
    student:
      "Showcase your skills and qualifications to find tutoring opportunities",
    school: "Manage your school's profile and hiring preferences",
    ngo: "Set up your organization's profile for educational programs",
    family: "Create your family profile to find the perfect tutor",
  };
  return descriptions[role] || "Complete your profile";
}

function getRoleEmoji(role) {
  const emojis = {
    teacher: "👨‍🏫",
    student: "🎓",
    school: "🏫",
    ngo: "🤝",
    family: "👨‍👩‍👧",
  };
  return emojis[role] || "👤";
}

function calculateCompletion(profile, roleDetails) {
  if (!profile) return 0;

  let completed = 0;
  let total = 0;

  // Basic info
  if (profile.full_name?.trim()) completed++;
  if (profile.phone?.trim()) completed++;
  total += 2;

  // Role-specific completion
  if (roleDetails) {
    if (profile.role === "teacher") {
      if (Array.isArray(roleDetails.subject) && roleDetails.subject.length > 0)
        completed++;
      if (roleDetails.experience_years > 0) completed++;
      if (roleDetails.education_level?.trim()) completed++;
      if (roleDetails.bio?.trim()) completed++;
      total += 4;
    } else if (profile.role === "student") {
      if (roleDetails.university?.trim()) completed++;
      if (roleDetails.department?.trim()) completed++;
      if (Array.isArray(roleDetails.skills) && roleDetails.skills.length > 0)
        completed++;
      total += 3;
    } else if (["school", "ngo", "family"].includes(profile.role)) {
      if (roleDetails.org_name?.trim()) completed++;
      if (roleDetails.contact_person?.trim()) completed++;
      total += 2;
    }
  }

  return Math.round((completed / total) * 100);
}
