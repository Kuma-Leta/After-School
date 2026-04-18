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

const DEFAULT_FILTERS = {
  jobType: [],
  category: [],
  duration: [],
  hoursPerWeek: [],
  location: [],
  salaryRange: { min: 0, max: 50000 },
};

export default function HomePage() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewerRole, setViewerRole] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

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

    if (sortBy === "salary_high") {
      result.sort(
        (a, b) => extractSalary(b.salary_range) - extractSalary(a.salary_range),
      );
    } else if (sortBy === "salary_low") {
      result.sort(
        (a, b) => extractSalary(a.salary_range) - extractSalary(b.salary_range),
      );
    } else if (sortBy === "deadline") {
      result.sort((a, b) => {
        const dateA = a.application_deadline
          ? new Date(a.application_deadline).getTime()
          : Number.MAX_SAFE_INTEGER;
        const dateB = b.application_deadline
          ? new Date(b.application_deadline).getTime()
          : Number.MAX_SAFE_INTEGER;
        return dateA - dateB;
      });
    } else {
      result.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }

    setFilteredJobs(result);
  }, [jobs, filters, searchQuery, sortBy]);

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

  const clearAll = () => {
    setSearchQuery("");
    setSortBy("newest");
    setFilters(DEFAULT_FILTERS);
  };

  const activeFilterCount = Object.values(filters).reduce((count, filter) => {
    if (Array.isArray(filter)) return count + filter.length;
    if (
      typeof filter === "object" &&
      filter.min === 0 &&
      filter.max === 50000
    ) {
      return count;
    }
    return count + 1;
  }, 0);

  const topSubjects = [
    ...new Set(jobs.map((job) => job.subject).filter(Boolean)),
  ].slice(0, 6);

  const topLocations = [
    ...new Set(jobs.map((job) => job.location).filter(Boolean)),
  ].slice(0, 4);

  const urgentJobs = jobs.filter((job) => {
    if (!job.application_deadline) return false;
    const daysLeft = Math.ceil(
      (new Date(job.application_deadline) - new Date()) / (1000 * 60 * 60 * 24),
    );
    return daysLeft >= 0 && daysLeft <= 3;
  }).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fc] flex flex-col items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl px-8 py-10 w-full max-w-md text-center">
          <div className="flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
          <p className="mt-4 text-slate-800 font-semibold">
            Loading job opportunities...
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Fetching the latest teaching roles for you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <Header />
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-[#8f2f07] text-white">
        <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-[#FF6B00]/25 blur-3xl" />
        <div className="absolute -bottom-20 -right-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="text-center mb-8 md:mb-10">
            <p className="inline-flex items-center rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-sm font-medium tracking-wide mb-5">
              Curated opportunities across Ethiopia
            </p>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4">
              Discover Your Next
              <span className="block text-[#FFC56F]">Teaching Opportunity</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-100/95 max-w-3xl mx-auto">
              Explore verified openings from schools, families, and
              organizations. Use smart filters to find roles that match your
              experience and goals.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
            <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur p-4 text-left">
              <p className="text-xs uppercase tracking-wider text-slate-200">
                Open Jobs
              </p>
              <p className="text-3xl font-bold mt-1">{jobs.length}</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur p-4 text-left">
              <p className="text-xs uppercase tracking-wider text-slate-200">
                Locations
              </p>
              <p className="text-3xl font-bold mt-1">{topLocations.length}</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur p-4 text-left">
              <p className="text-xs uppercase tracking-wider text-slate-200">
                Subjects
              </p>
              <p className="text-3xl font-bold mt-1">{topSubjects.length}</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur p-4 text-left">
              <p className="text-xs uppercase tracking-wider text-slate-200">
                Urgent Roles
              </p>
              <p className="text-3xl font-bold mt-1">{urgentJobs}</p>
            </div>
          </div>

          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by title, subject, location, or skill..."
          />

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-slate-100/90">Quick picks:</span>
            {topSubjects.map((subject) => {
              const isActive = filters.category.includes(subject);
              return (
                <button
                  key={subject}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      category: isActive
                        ? prev.category.filter((item) => item !== subject)
                        : [...prev.category, subject],
                    }))
                  }
                  className={`rounded-full px-3 py-1.5 text-sm border transition ${
                    isActive
                      ? "bg-[#FFC56F] text-slate-900 border-[#FFC56F]"
                      : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                  }`}
                  aria-pressed={isActive}
                >
                  {subject}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 md:p-5 mb-6 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
              {filteredJobs.length} Job{filteredJobs.length !== 1 ? "s" : ""}{" "}
              Found
            </h2>
            <p className="text-slate-600 mt-1">
              {searchQuery
                ? `Results for \"${searchQuery}\"`
                : "Browse all available teaching positions"}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <label
              className="text-sm text-slate-700 font-medium"
              htmlFor="sort-jobs"
            >
              Sort by
            </label>
            <select
              id="sort-jobs"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
            >
              <option value="newest">Newest first</option>
              <option value="deadline">Closest deadline</option>
              <option value="salary_high">Highest salary</option>
              <option value="salary_low">Lowest salary</option>
            </select>

            {(searchQuery || activeFilterCount > 0) && (
              <button
                onClick={clearAll}
                className="rounded-lg px-4 py-2 text-sm font-semibold bg-slate-900 text-white hover:bg-black"
              >
                Reset All
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/4">
            <div className="lg:sticky lg:top-24">
              <JobFilters
                filters={filters}
                setFilters={setFilters}
                jobs={jobs}
              />
            </div>
          </div>

          <div className="lg:w-3/4">
            {filteredJobs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-12 text-center">
                <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-5-5m2-4a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  No jobs found
                </h3>
                <p className="text-slate-600 mb-6">
                  {searchQuery
                    ? `No jobs match your search for "${searchQuery}". Try different keywords or filters.`
                    : "There are currently no active job postings. Check back soon!"}
                </p>
                <button
                  onClick={clearAll}
                  className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-black font-semibold"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                {urgentJobs > 0 && (
                  <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900 text-sm font-medium">
                    {urgentJobs} role{urgentJobs !== 1 ? "s" : ""} close within
                    3 days. Apply soon.
                  </div>
                )}

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
              </>
            )}
          </div>
        </div>
      </div>

      {showDetail && selectedJob && (
        <JobDetailModal
          job={selectedJob}
          viewerRole={viewerRole}
          onClose={() => setShowDetail(false)}
          onApply={() => {
            setShowDetail(false);
          }}
        />
      )}
    </div>
  );
}
