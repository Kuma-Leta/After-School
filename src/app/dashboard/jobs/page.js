// app/dashboard/jobs/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import MyJobs from "@/app/dashboard/profile/components/MyJobs";

export default function JobsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    // Check if user is an organization

    setLoading(false);
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FF1E00] mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-[#FF1E00] hover:underline flex items-center"
        >
          ← Back to Profile
        </button>
      </div>

      <MyJobs />
    </div>
  );
}
