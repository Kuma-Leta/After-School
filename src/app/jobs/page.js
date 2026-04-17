// app/page.js
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import JobFilters from "./components/JobFilters";
import JobCard from "./components/JobCard";
import JobDetailModal from "./components/JobDetailModal";
import { SearchBar } from "./components/SearchBar";
import LoadingSpinner from "./components/ui/LoadingSpinner";
import Header from "@/components/layout/Header";

export default function HomePage() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewerRole, setViewerRole] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    jobType: [],
    category: [],
    duration: [],
    hoursPerWeek: [],
    location: [],
    salaryRange: { min: 0, max: 50000 },
  });

  useEffect(() => {
    loadJobs();
    loadViewerRole();
  }, []);

  useEffect(() => {
    let result = [...jobs];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (job) =>
          job.title.toLowerCase().includes(query) ||
          job.description.toLowerCase().includes(query) ||
          job.subject.toLowerCase().includes(query) ||
          job.location?.toLowerCase().includes(query),
      );
    }

    if (filters.jobType.length > 0) {
      result = result.filter((job) => filters.jobType.includes(job.job_type));
    }

    if (filters.category.length > 0) {
      result = result.filter((job) => filters.category.includes(job.subject));
    }

    if (filters.duration.length > 0) {
      result = result.filter((job) => {
        if (!job.duration) return false;
        return filters.duration.some((duration) => {
          if (
            duration === "short_term" &&
            job.duration.toLowerCase().includes("month")
          )
            return true;
          if (
            duration === "long_term" &&
            (job.duration.toLowerCase().includes("year") ||
              job.duration.toLowerCase().includes("permanent"))
          )
            return true;
          if (
            duration === "contract" &&
            job.duration.toLowerCase().includes("contract")
          )
            return true;
          return false;
        });
      });
    }

    if (filters.location.length > 0) {
      result = result.filter(
        (job) => job.location && filters.location.includes(job.location),
      );
    }

    if (filters.salaryRange.min > 0 || filters.salaryRange.max < 50000) {
      result = result.filter((job) => {
        if (!job.salary_range) return false;
        const salary = extractSalary(job.salary_range);
        return (
          salary >= filters.salaryRange.min && salary <= filters.salaryRange.max
        );
      });
    }

    setFilteredJobs(result);
  }, [jobs, filters, searchQuery]);

  async function loadJobs() {
    try {
      setLoading(true);
      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (jobsError) {
        console.error("Error fetching jobs:", jobsError);
        setFilteredJobs([]);
        return;
      }

      // Enrich with organization profiles
      const jobsWithOrganizations = await Promise.all(
        (jobsData || []).map(async (job) => {
          let organizationProfile = null;
          if (job.organization_id) {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("full_name, role, location, phone")
              .eq("id", job.organization_id)
              .single();
            organizationProfile = profileData;
          }
          return {
            ...job,
            organizations: {
              org_name: organizationProfile?.full_name || "Private Employer",
              org_type: organizationProfile?.role || "school",
              verified: false,
              contact_person:
                organizationProfile?.full_name || "Contact Person",
            },
          };
        }),
      );

      const activeJobs = jobsWithOrganizations.filter((job) => {
        if (!job.application_deadline) return true;
        const deadline = new Date(job.application_deadline);
        return deadline >= new Date();
      });

      setJobs(activeJobs);
      setFilteredJobs(activeJobs);
    } catch (error) {
      console.error("Error loading jobs:", error);
      setFilteredJobs([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadViewerRole() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.id) {
        setViewerRole(null);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      setViewerRole((profile?.role || "").toLowerCase() || null);
    } catch (error) {
      console.error("Error loading viewer role:", error);
      setViewerRole(null);
    }
  }

  const extractSalary = (salaryString) => {
    if (!salaryString) return 0;
    const matches = salaryString.match(/(\d+,?\d*)/);
    if (matches && matches.length > 0) {
      return parseInt(matches[0].replace(/,/g, ""));
    }
    return 0;
  };

  const handleJobClick = (job) => {
    setSelectedJob(job);
    setShowDetail(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Loading job opportunities...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#FF1E00] to-[#FF6B00] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Find Your Perfect{" "}
              <span className="text-yellow-300">Teaching</span> Job
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Connect with schools, families, and organizations looking for
              talented educators in Ethiopia
            </p>

            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 min-w-[120px]">
                <div className="text-3xl font-bold">{jobs.length}</div>
                <div className="text-sm opacity-90">Active Jobs</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 min-w-[120px]">
                <div className="text-3xl font-bold">
                  {
                    [...new Set(jobs.map((j) => j.location).filter(Boolean))]
                      .length
                  }
                </div>
                <div className="text-sm opacity-90">Locations</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 min-w-[120px]">
                <div className="text-3xl font-bold">
                  {
                    [...new Set(jobs.map((j) => j.subject).filter(Boolean))]
                      .length
                  }
                </div>
                <div className="text-sm opacity-90">Subjects</div>
              </div>
            </div>

            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search for jobs by title, subject, or location..."
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <JobFilters filters={filters} setFilters={setFilters} jobs={jobs} />
          </div>

          {/* Job Listings */}
          <div className="lg:w-3/4">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {filteredJobs.length} Job
                  {filteredJobs.length !== 1 ? "s" : ""} Found
                </h2>
                <p className="text-gray-600">
                  {searchQuery
                    ? `Results for "${searchQuery}"`
                    : "Browse all available teaching positions"}
                </p>
              </div>
            </div>

            {filteredJobs.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-medium text-gray-900 mb-2">
                  No jobs found
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery
                    ? `No jobs match your search for "${searchQuery}". Try different keywords or filters.`
                    : "There are currently no active job postings. Check back soon!"}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilters({
                      jobType: [],
                      category: [],
                      duration: [],
                      hoursPerWeek: [],
                      location: [],
                      salaryRange: { min: 0, max: 50000 },
                    });
                  }}
                  className="px-6 py-3 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] font-medium"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onClick={() => handleJobClick(job)}
                    viewerRole={viewerRole}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Job Detail Modal */}
      {showDetail && selectedJob && (
        <JobDetailModal
          job={selectedJob}
          viewerRole={viewerRole}
          onClose={() => setShowDetail(false)}
          onApply={() => {
            // The modal will call the job's own apply logic? Better to close and rely on JobCard's apply button.
            // But since the modal might have its own apply button, we can simply close it and let user click apply on card.
            // For simplicity, we can just close.
            setShowDetail(false);
          }}
        />
      )}
    </div>
  );
}
