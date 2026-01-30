"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push("/login");
          return;
        }

        setUser(session.user);
        setAuthLoading(false);

        // Get user profile after auth is confirmed
        await getUserProfile(session.user.id);
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/login");
      } finally {
        setAuthLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  async function getUserProfile(userId) {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error getting profile:", error);
        // If profile doesn't exist, redirect to complete profile
        if (error.code === "PGRST116") {
          router.push("/dashboard/profile");
          return;
        }
        throw error;
      }

      if (profile) {
        setUserProfile(profile);
        setUserRole(profile.role);
      }
    } catch (error) {
      console.error("Error getting user data:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FF1E00] mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-[#1F1F1F] mb-2">
            Loading Dashboard
          </h2>
          <p className="text-gray-600">
            Please wait while we set up your workspace...
          </p>
        </div>
      </div>
    );
  }

  // Don't render if no user (will redirect)
  if (!user) {
    return null;
  }

  const getNavItems = () => {
    const common = [
      {
        href: "/dashboard",
        label: "Overview",
        icon: "📊",
        description: "Dashboard home",
      },
      {
        href: "/dashboard/profile",
        label: "My Profile",
        icon: "👤",
        description: "Edit your profile",
      },
      {
        href: "/dashboard/messages",
        label: "Messages",
        icon: "💬",
        description: "View conversations",
      },
      {
        href: "/dashboard/notifications",
        label: "Notifications",
        icon: "🔔",
        description: "Alerts & updates",
      },
    ];

    if (userRole === "teacher") {
      return [
        ...common,
        {
          href: "/jobs",
          label: "Find Jobs",
          icon: "🔍",
          description: "Browse opportunities",
        },
        {
          href: "/dashboard/applications",
          label: "My Applications",
          icon: "📄",
          description: "Track applications",
        },
        {
          href: "/dashboard/schedule",
          label: "My Schedule",
          icon: "📅",
          description: "Teaching schedule",
        },
        {
          href: "/dashboard/subscription",
          label: "Subscription",
          icon: "⭐",
          description: "Manage plan",
        },
        {
          href: "/dashboard/earnings",
          label: "Earnings",
          icon: "💰",
          description: "View income",
        },
      ];
    }

    if (userRole === "student") {
      return [
        ...common,
        {
          href: "/dashboard/jobs",
          label: "Find Jobs",
          icon: "🔍",
          description: "Browse opportunities",
        },
        {
          href: "/dashboard/applications",
          label: "My Applications",
          icon: "📄",
          description: "Track applications",
        },
        {
          href: "/dashboard/schedule",
          label: "My Schedule",
          icon: "📅",
          description: "Work schedule",
        },
        {
          href: "/dashboard/subscription",
          label: "Subscription",
          icon: "⭐",
          description: "Manage plan",
        },
      ];
    }

    if (["school", "ngo", "family"].includes(userRole)) {
      return [
        ...common,
        {
          href: "/dashboard/jobs",
          label: "Post a Job",
          icon: "➕",
          description: "Create new job",
        },
        {
          href: "/dashboard/jobs",
          label: "My Jobs",
          icon: "📋",
          description: "Manage job posts",
        },
        {
          href: "/dashboard/candidates",
          label: "Candidates",
          icon: "👥",
          description: "Browse applicants",
        },
        {
          href: "/dashboard/hires",
          label: "My Hires",
          icon: "✅",
          description: "Track hired staff",
        },
        {
          href: "/dashboard/billing",
          label: "Billing",
          icon: "💳",
          description: "Payment history",
        },
      ];
    }

    if (userRole === "admin") {
      return [
        {
          href: "/admin/dashboard",
          label: "Dashboard",
          icon: "📊",
          description: "Admin overview",
        },
        {
          href: "/admin/users",
          label: "Users",
          icon: "👥",
          description: "Manage all users",
        },
        {
          href: "/admin/verifications",
          label: "Verifications",
          icon: "✅",
          description: "Approve profiles",
        },
        {
          href: "/admin/transactions",
          label: "Transactions",
          icon: "💰",
          description: "View payments",
        },
        {
          href: "/admin/reports",
          label: "Reports",
          icon: "📈",
          description: "Analytics & insights",
        },
        {
          href: "/admin/settings",
          label: "Settings",
          icon: "⚙️",
          description: "Platform settings",
        },
      ];
    }

    return common;
  };

  const getRoleColor = (role) => {
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
      case "admin":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getRoleIcon = (role) => {
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
      case "admin":
        return "🛡️";
      default:
        return "👤";
    }
  };

  const navItems = getNavItems();
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <svg
                className="w-6 h-6 text-[#1F1F1F]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    mobileMenuOpen
                      ? "M6 18L18 6M6 6l12 12"
                      : "M4 6h16M4 12h16M4 18h16"
                  }
                />
              </svg>
            </button>
            <div className="flex items-center space-x-2">
              <div
                className={`w-8 h-8 ${getRoleColor(userRole)} rounded-lg flex items-center justify-center`}
              >
                <span className="text-white text-sm">
                  {getRoleIcon(userRole)}
                </span>
              </div>
              <span className="text-lg font-bold text-[#1F1F1F]">
                AfterSchool
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-600 hover:text-[#1F1F1F]">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>
            <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden">
              {userProfile?.avatar_url ? (
                <img
                  src={userProfile.avatar_url}
                  alt={userProfile.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#FF1E00] flex items-center justify-center text-white font-medium">
                  {userProfile?.full_name?.charAt(0) ||
                    user?.email?.charAt(0) ||
                    "U"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3 mb-4">
                <div
                  className={`w-10 h-10 ${getRoleColor(userRole)} rounded-lg flex items-center justify-center`}
                >
                  <span className="text-white text-lg">
                    {getRoleIcon(userRole)}
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1F1F1F]">
                    AfterSchool
                  </h2>
                  <p className="text-sm text-gray-500 capitalize">
                    {userRole} Account
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium text-[#1F1F1F]">
                  {userProfile?.full_name || "User"}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {user?.email}
                </div>
              </div>
            </div>

            <nav className="p-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-4 py-3 text-[#1F1F1F] hover:bg-gray-100 rounded-lg transition-colors group"
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-gray-500">
                      {item.description}
                    </div>
                  </div>
                </Link>
              ))}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
              <button
                onClick={handleSignOut}
                className="flex items-center w-full px-4 py-3 text-[#1F1F1F] hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-3 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-[#FF1E00] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">AS</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1F1F1F]">
                After<span className="text-[#FF1E00]">School</span>
              </h1>
              <p className="text-xs text-gray-500">
                Ethiopia&apos;s Education Network
              </p>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="relative">
              <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                {userProfile?.avatar_url ? (
                  <img
                    src={userProfile.avatar_url}
                    alt={userProfile.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#FF1E00] flex items-center justify-center text-white font-medium">
                    {userProfile?.full_name?.charAt(0) ||
                      user?.email?.charAt(0) ||
                      "U"}
                  </div>
                )}
              </div>
              <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 ${getRoleColor(userRole)} rounded-full border-2 border-white`}
              ></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1F1F1F] truncate">
                {userProfile?.full_name || "Welcome!"}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              <div className="flex items-center mt-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full capitalize ${userRole === "teacher" ? "bg-blue-100 text-blue-800" : userRole === "student" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                >
                  {userRole}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center px-4 py-3 text-[#1F1F1F] hover:bg-gray-100 rounded-lg transition-colors group"
              >
                <span className="mr-3 text-lg group-hover:scale-110 transition-transform">
                  {item.icon}
                </span>
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.description}
                  </div>
                </div>
              </Link>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center w-full px-4 py-2.5 text-[#1F1F1F] hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
          >
            <svg
              className="w-5 h-5 mr-2 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:pl-64">
        {/* Desktop Top Bar */}
        <div className="hidden md:block bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#1F1F1F]">
                Welcome back, {userProfile?.full_name?.split(" ")[0] || "there"}
                !
              </h2>
              <p className="text-gray-600 text-sm">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-600 hover:text-[#1F1F1F] relative">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF1E00] text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>
              <button className="p-2 text-gray-600 hover:text-[#1F1F1F]">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <main
          className={`${isMobile ? "pt-16" : "pt-0"} p-4 md:p-8 min-h-screen`}
        >
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex justify-around items-center z-40">
            {navItems.slice(0, 4).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center p-2 text-gray-600 hover:text-[#FF1E00]"
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
