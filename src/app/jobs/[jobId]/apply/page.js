"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import ApplicationForm from "./components/ApplicationForm";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

export default function ApplyPage() {
  const { jobId } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [job, setJob] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/jobs/${jobId}/apply`);
    }
  }, [user, authLoading, router, jobId]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  async function loadData() {
    try {
      setLoading(true);

      // Validate inputs
      if (!jobId) {
        console.error("No jobId provided");
        return;
      }

      if (!user?.id) {
        console.error("No user ID available");
        return;
      }

      // 1. Fetch job details through backend policy-enforced API
      const jobResponse = await fetch(
        `/api/jobs/${jobId}?includeRemotePartTime=true`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        },
      );

      if (!jobResponse.ok) {
        const errorPayload = await jobResponse.json().catch(() => ({}));
        throw new Error(errorPayload?.error || "Unable to access this job");
      }

      const { job: jobData } = await jobResponse.json();

      // 2. Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        throw profileError;
      }

      setJob(jobData);
      setProfile(profileData);
    } catch (error) {
      console.error("Error loading data:", {
        message: error?.message,
        details: error?.details,
        code: error?.code,
        hint: error?.hint,
      });

      // Set empty states on error
      setJob(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Loading application form...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-red-600">Job not found</h2>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-[#FF1E00] text-white rounded-lg"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-[#FF1E00] hover:underline flex items-center"
          >
            ← Back to Job
          </button>
        </div>
        <ApplicationForm job={job} profile={profile} />
      </div>
    </div>
  );
}
