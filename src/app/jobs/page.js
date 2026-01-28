// app/page.js
"use client";

import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase/client";
import JobFilters from "./components/JobFilters";
import JobCard from "./components/JobCard";
import JobDetailModal from "./components/JobDetailModal";
import { SearchBar } from "./components/SearchBar";
import LoadingSpinner from "./components/ui/LoadingSpinner";

export default function HomePage() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
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
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, filters, searchQuery]);

  async function loadJobs() {
    try {
      setLoading(true);

      // Get active jobs with organization info
      const { data, error } = await supabase
        .from("jobs")
        .select(
          `
          *,
          organizations (
            org_name,
            org_type,
            verified,
            contact_person
          )
        `,
        )
        .eq("is_active", true)
        .gte("application_deadline", new Date().toISOString().split("T")[0])
        .order("created_at", { ascending: false });

      if (error) throw error;

      setJobs(data || []);
      setFilteredJobs(data || []);
    } catch (error) {
      console.error("Error loading jobs:", error);
    } finally {
      setLoading(false);
    }
  }

  const filterJobs = () => {
    let result = [...jobs];

    // Search filter
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

    // Job type filter
    if (filters.jobType.length > 0) {
      result = result.filter((job) => filters.jobType.includes(job.job_type));
    }

    // Category filter
    if (filters.category.length > 0) {
      result = result.filter((job) => filters.category.includes(job.subject));
    }

    // Duration filter
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

    // Location filter
    if (filters.location.length > 0) {
      result = result.filter(
        (job) => job.location && filters.location.includes(job.location),
      );
    }

    // Salary range filter
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
  };

  const extractSalary = (salaryString) => {
    if (!salaryString) return 0;
    const matches = salaryString.match(/(\d+)/g);
    if (matches && matches.length > 0) {
      return parseInt(matches[0]);
    }
    return 0;
  };

  const handleJobClick = (job) => {
    setSelectedJob(job);
    setShowDetail(true);
  };

  const handleApply = (job) => {
    // Redirect to login if not authenticated, otherwise to application page
    const user = supabase.auth.getUser();
    if (!user) {
      window.location.href = "/login?redirect=/jobs/apply";
    } else {
      window.location.href = `/jobs/${job.id}/apply`;
    }
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

            {/* Stats */}
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

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-md p-6 mt-6">
              <h3 className="font-semibold text-lg mb-4">
                Job Market Insights
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">
                      Most in-demand subjects:
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {getTopSubjects(jobs).map((subject) => (
                      <span
                        key={subject}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">
                      Popular job types:
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {getTopJobTypes(jobs).map((type) => (
                      <span
                        key={type}
                        className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Job Listings */}
          <div className="lg:w-3/4">
            {/* Results Header */}
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
              <div className="flex items-center space-x-4">
                <select className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF1E00]">
                  <option>Sort by: Newest</option>
                  <option>Sort by: Deadline</option>
                  <option>Sort by: Salary</option>
                  <option>Sort by: Location</option>
                </select>
              </div>
            </div>

            {/* Job Cards Grid */}
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
                    onApply={() => handleApply(job)}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {filteredJobs.length > 0 && (
              <div className="mt-8 flex justify-center">
                <nav className="flex items-center space-x-2">
                  <button className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                    ← Previous
                  </button>
                  <button className="px-3 py-2 rounded-lg bg-[#FF1E00] text-white">
                    1
                  </button>
                  <button className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                    2
                  </button>
                  <button className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                    3
                  </button>
                  <span className="px-3 py-2">...</span>
                  <button className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                    10
                  </button>
                  <button className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                    Next →
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Featured Employers Section */}
      <div className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-8">
            Featured Employers
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {getFeaturedOrganizations(jobs).map((org) => (
              <div
                key={org.org_name}
                className="bg-gray-50 rounded-xl p-6 text-center hover:shadow-md transition-shadow"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">
                    {org.org_type === "school"
                      ? "🏫"
                      : org.org_type === "ngo"
                        ? "🤝"
                        : "👨‍👩‍👧"}
                  </span>
                </div>
                <h3 className="font-semibold text-lg mb-1">{org.org_name}</h3>
                <p className="text-sm text-gray-600 mb-2">{org.org_type}</p>
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  {org.job_count} job{org.job_count !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Job Detail Modal */}
      {showDetail && selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setShowDetail(false)}
          onApply={() => handleApply(selectedJob)}
        />
      )}
    </div>
  );
}

// Helper functions
function getTopSubjects(jobs, limit = 5) {
  const subjectCount = {};
  jobs.forEach((job) => {
    if (job.subject) {
      subjectCount[job.subject] = (subjectCount[job.subject] || 0) + 1;
    }
  });
  return Object.entries(subjectCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([subject]) => subject);
}

function getTopJobTypes(jobs, limit = 4) {
  const typeCount = {};
  jobs.forEach((job) => {
    if (job.job_type) {
      typeCount[job.job_type] = (typeCount[job.job_type] || 0) + 1;
    }
  });
  return Object.entries(typeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([type]) => type);
}

function getFeaturedOrganizations(jobs) {
  const orgMap = new Map();
  jobs.forEach((job) => {
    if (job.organizations) {
      const key = job.organizations.org_name;
      if (!orgMap.has(key)) {
        orgMap.set(key, {
          org_name: job.organizations.org_name,
          org_type: job.organizations.org_type,
          verified: job.organizations.verified,
          job_count: 0,
        });
      }
      orgMap.get(key).job_count += 1;
    }
  });
  return Array.from(orgMap.values())
    .filter((org) => org.verified)
    .sort((a, b) => b.job_count - a.job_count)
    .slice(0, 4);
}
