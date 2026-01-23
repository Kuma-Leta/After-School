// app/dashboard/profile/components/ProfileView.js
import TeacherProfile from "./TeacherProfile";
import StudentProfile from "./StudentProfile";
import OrganizationProfile from "./OrganizationProfile";

export default function ProfileView({ profile, roleDetails, user }) {
  if (!profile) return null;

  return (
    <div className="space-y-8 mt-8">
      {/* Basic Information Card */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-[#1F1F1F] mb-6">
          Personal Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">
              Full Name
            </label>
            <p className="text-lg text-[#1F1F1F]">
              {profile.full_name || "Not provided"}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p className="text-lg text-[#1F1F1F]">
              {user?.email || "Not provided"}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">
              Phone Number
            </label>
            <p className="text-lg text-[#1F1F1F]">
              {profile.phone || "Not provided"}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">
              Account Type
            </label>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">{getRoleEmoji(profile.role)}</span>
              </div>
              <div>
                <p className="font-medium text-[#1F1F1F] capitalize">
                  {getRoleDisplayName(profile.role)}
                </p>
                <p className="text-sm text-gray-600">
                  {getRoleDescription(profile.role)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role-specific Profile Section */}
      {profile.role === "teacher" && (
        <TeacherProfile roleDetails={roleDetails} />
      )}

      {profile.role === "student" && (
        <StudentProfile roleDetails={roleDetails} />
      )}

      {["school", "ngo", "family"].includes(profile.role) && (
        <OrganizationProfile
          roleDetails={roleDetails}
          roleType={profile.role}
        />
      )}
    </div>
  );
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

function getRoleDisplayName(role) {
  const names = {
    teacher: "Professional Teacher",
    student: "University Student",
    school: "School Administrator",
    ngo: "Organization",
    family: "Family",
  };
  return names[role] || role;
}

function getRoleDescription(role) {
  const descriptions = {
    teacher: "Can apply for teaching jobs",
    student: "Can apply for tutoring jobs",
    school: "Can post jobs and hire educators",
    ngo: "Can post jobs and hire educators",
    family: "Can hire tutors and educators",
  };
  return descriptions[role] || "User account";
}
