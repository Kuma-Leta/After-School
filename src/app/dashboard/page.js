// app/dashboard/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (!authLoading && user) {
      loadDashboardData();
    } else if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  async function loadDashboardData() {
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUserProfile(profile);
        await loadStats(profile.role);
        await loadRecentActivities(profile.role);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats(role) {
    let statsData = {};

    if (role === "teacher" || role === "student") {
      // For teachers/students
      const { count: applicationsCount } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("applicant_id", user.id);

      const { count: jobsCount } = await supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("status", "open");

      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      statsData = {
        applications: applicationsCount || 0,
        availableJobs: jobsCount || 0,
        subscriptionActive: !!subscription,
        profileComplete: calculateProfileComplete(userProfile),
      };
    } else if (["school", "ngo", "family"].includes(role)) {
      // For employers
      const { count: postedJobs } = await supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("employer_id", user.id);

      const { count: applicationsCount } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .in(
          "job_id",
          (
            await supabase.from("jobs").select("id").eq("employer_id", user.id)
          ).data?.map((j) => j.id) || [],
        );

      const { count: candidatesCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .in("role", ["teacher", "student"]);

      statsData = {
        postedJobs: postedJobs || 0,
        totalApplications: applicationsCount || 0,
        availableCandidates: candidatesCount || 0,
        profileComplete: calculateProfileComplete(userProfile),
      };
    }

    setStats(statsData);
  }

  async function loadRecentActivities(role) {
    const activities = [];

    if (role === "teacher" || role === "student") {
      // Recent applications
      const { data: recentApplications } = await supabase
        .from("applications")
        .select(
          `
          *,
          jobs!inner(title, employer_id)
        `,
        )
        .eq("applicant_id", user.id)
        .order("applied_at", { ascending: false })
        .limit(5);

      if (recentApplications) {
        activities.push(
          ...recentApplications.map((app) => ({
            id: app.id,
            type: "application",
            title: `Applied for ${app.jobs.title}`,
            time: new Date(app.applied_at).toLocaleDateString(),
            status: app.status,
          })),
        );
      }
    } else if (["school", "ngo", "family"].includes(role)) {
      // Recent job posts
      const { data: recentJobs } = await supabase
        .from("jobs")
        .select("*")
        .eq("employer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (recentJobs) {
        activities.push(
          ...recentJobs.map((job) => ({
            id: job.id,
            type: "job",
            title: `Posted "${job.title}"`,
            time: new Date(job.created_at).toLocaleDateString(),
            status: job.status,
          })),
        );
      }
    }

    setRecentActivities(activities.slice(0, 5));
  }

  function calculateProfileComplete(profile) {
    if (!profile) return 0;

    let complete = 0;
    if (profile.full_name) complete += 25;
    if (profile.phone) complete += 25;
    if (profile.role) complete += 25;

    // Role-specific completion
    if (
      profile.role === "teacher" ||
      profile.role === "student" ||
      ["school", "ngo", "family"].includes(profile.role)
    ) {
      complete += 25;
    }

    return Math.min(complete, 100);
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF1E00] mb-4"></div>
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  const isTalent =
    userProfile?.role === "teacher" || userProfile?.role === "student";
  const isEmployer = ["school", "ngo", "family"].includes(userProfile?.role);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1F1F1F] mb-2">
          Welcome back, {userProfile?.full_name?.split(" ")[0] || "there"}!
        </h1>
        <p className="text-gray-600">
          Here&apos;s what&apos;s happening with your {userProfile?.role}{" "}
          account today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {isTalent && stats && (
          <>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#1F1F1F]">
                  Applications
                </h3>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-xl">📄</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-[#1F1F1F]">
                {stats.applications || 0}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Total applications submitted
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#1F1F1F]">
                  Available Jobs
                </h3>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-xl">🔍</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-[#1F1F1F]">
                {stats.availableJobs || 0}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Jobs matching your profile
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#1F1F1F]">
                  Subscription
                </h3>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 text-xl">⭐</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-[#1F1F1F]">
                {stats.subscriptionActive ? "Active" : "Inactive"}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {stats.subscriptionActive
                  ? "Premium features enabled"
                  : "Upgrade to apply"}
              </p>
            </div>
          </>
        )}

        {isEmployer && stats && (
          <>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#1F1F1F]">
                  Posted Jobs
                </h3>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-xl">📋</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-[#1F1F1F]">
                {stats.postedJobs || 0}
              </p>
              <p className="text-sm text-gray-600 mt-2">Active job listings</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#1F1F1F]">
                  Applications
                </h3>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-xl">📨</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-[#1F1F1F]">
                {stats.totalApplications || 0}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Total applications received
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#1F1F1F]">
                  Candidates
                </h3>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 text-xl">👥</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-[#1F1F1F]">
                {stats.availableCandidates || 0}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Qualified candidates available
              </p>
            </div>
          </>
        )}

        {/* Profile Completion Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-[#FF1E00]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#1F1F1F]">
              Profile Complete
            </h3>
            <div className="w-10 h-10 bg-[#FF1E00]/10 rounded-lg flex items-center justify-center">
              <span className="text-[#FF1E00] text-xl">📊</span>
            </div>
          </div>
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Completion</span>
              <span>{stats?.profileComplete || 0}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FF1E00] transition-all duration-500"
                style={{ width: `${stats?.profileComplete || 0}%` }}
              ></div>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {stats?.profileComplete >= 80
              ? "Great job! Your profile is complete."
              : "Complete your profile for better opportunities."}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-[#1F1F1F] mb-6">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isTalent && (
                <>
                  <Link
                    href="/dashboard/jobs"
                    className="p-4 border border-gray-200 rounded-lg hover:border-[#FF1E00] hover:bg-[#FF1E00]/5 transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <span className="text-blue-600 text-xl">🔍</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-[#1F1F1F]">
                          Browse Jobs
                        </h3>
                        <p className="text-sm text-gray-600">
                          Find teaching opportunities
                        </p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/applications"
                    className="p-4 border border-gray-200 rounded-lg hover:border-[#FF1E00] hover:bg-[#FF1E00]/5 transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <span className="text-green-600 text-xl">📄</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-[#1F1F1F]">
                          My Applications
                        </h3>
                        <p className="text-sm text-gray-600">
                          Track your applications
                        </p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/subscription"
                    className="p-4 border border-gray-200 rounded-lg hover:border-[#FF1E00] hover:bg-[#FF1E00]/5 transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                        <span className="text-purple-600 text-xl">⭐</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-[#1F1F1F]">
                          Subscription
                        </h3>
                        <p className="text-sm text-gray-600">
                          Upgrade your plan
                        </p>
                      </div>
                    </div>
                  </Link>
                </>
              )}

              {isEmployer && (
                <>
                  <Link
                    href="/dashboard/post-job"
                    className="p-4 border border-gray-200 rounded-lg hover:border-[#FF1E00] hover:bg-[#FF1E00]/5 transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <span className="text-blue-600 text-xl">➕</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-[#1F1F1F]">
                          Post a Job
                        </h3>
                        <p className="text-sm text-gray-600">
                          Hire qualified talent
                        </p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/my-jobs"
                    className="p-4 border border-gray-200 rounded-lg hover:border-[#FF1E00] hover:bg-[#FF1E00]/5 transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <span className="text-green-600 text-xl">📋</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-[#1F1F1F]">My Jobs</h3>
                        <p className="text-sm text-gray-600">
                          Manage job listings
                        </p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/candidates"
                    className="p-4 border border-gray-200 rounded-lg hover:border-[#FF1E00] hover:bg-[#FF1E00]/5 transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                        <span className="text-purple-600 text-xl">👥</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-[#1F1F1F]">
                          Candidates
                        </h3>
                        <p className="text-sm text-gray-600">
                          Browse qualified candidates
                        </p>
                      </div>
                    </div>
                  </Link>
                </>
              )}

              <Link
                href="/dashboard/profile"
                className="p-4 border border-gray-200 rounded-lg hover:border-[#FF1E00] hover:bg-[#FF1E00]/5 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#FF1E00]/10 rounded-lg flex items-center justify-center group-hover:bg-[#FF1E00]/20 transition-colors">
                    <span className="text-[#FF1E00] text-xl">👤</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#1F1F1F]">
                      Complete Profile
                    </h3>
                    <p className="text-sm text-gray-600">
                      Update your information
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[#1F1F1F]">
              Recent Activity
            </h2>
            <Link
              href="/dashboard/activity"
              className="text-sm text-[#FF1E00] hover:text-[#E01B00]"
            >
              View all
            </Link>
          </div>

          {recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${activity.type === "application" ? "bg-blue-100" : "bg-green-100"}`}
                  >
                    <span
                      className={`text-sm ${activity.type === "application" ? "text-blue-600" : "text-green-600"}`}
                    >
                      {activity.type === "application" ? "📄" : "📋"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#1F1F1F]">
                      {activity.title}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        {activity.time}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${activity.status === "pending" ? "bg-yellow-100 text-yellow-800" : activity.status === "approved" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                      >
                        {activity.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-2xl">📊</span>
              </div>
              <p className="text-gray-600">No recent activity</p>
              <p className="text-sm text-gray-500 mt-1">
                Your activity will appear here
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Platform Stats */}
      <div className="bg-gradient-to-r from-[#1F1F1F] to-[#2A2A2A] rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-xl font-semibold mb-6">Platform Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">500+</div>
            <div className="text-gray-300">Active Teachers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">150+</div>
            <div className="text-gray-300">Schools & NGOs</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">1,000+</div>
            <div className="text-gray-300">Jobs Posted</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">95%</div>
            <div className="text-gray-300">Success Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}
