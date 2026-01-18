// app/dashboard/layout.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUserRole() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile) {
          setUserRole(profile.role);
        }
      } catch (error) {
        console.error("Error getting user role:", error);
      } finally {
        setLoading(false);
      }
    }

    getUserRole();
  }, [router]);

  const getNavItems = () => {
    const common = [
      { href: "/dashboard", label: "Overview", icon: "📊" },
      { href: "/dashboard/profile", label: "My Profile", icon: "👤" },
      { href: "/dashboard/messages", label: "Messages", icon: "💬" },
    ];

    if (userRole === "teacher" || userRole === "student") {
      return [
        ...common,
        { href: "/dashboard/jobs", label: "Find Jobs", icon: "🔍" },
        {
          href: "/dashboard/applications",
          label: "My Applications",
          icon: "📄",
        },
        { href: "/dashboard/subscription", label: "Subscription", icon: "⭐" },
      ];
    }

    if (["school", "ngo", "family", "company"].includes(userRole)) {
      return [
        ...common,
        { href: "/dashboard/post-job", label: "Post a Job", icon: "➕" },
        { href: "/dashboard/my-jobs", label: "My Jobs", icon: "📋" },
        { href: "/dashboard/candidates", label: "Candidates", icon: "👥" },
      ];
    }

    if (userRole === "admin") {
      return [
        { href: "/admin/users", label: "Users", icon: "👥" },
        { href: "/admin/transactions", label: "Transactions", icon: "💰" },
        { href: "/admin/reports", label: "Reports", icon: "📈" },
        { href: "/admin/settings", label: "Settings", icon: "⚙️" },
      ];
    }

    return common;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            AfterSchool<span className="text-blue-600">.</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {userRole ? `Logged in as ${userRole}` : ""}
          </p>
        </div>

        <nav className="px-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={() => {
              supabase.auth.signOut();
              router.push("/login");
            }}
            className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="mr-3">🚪</span>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
