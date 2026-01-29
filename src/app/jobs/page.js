// app/page.js
"use client";

import { useState, useEffect } from "react";
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

      // First, let's check if the jobs table exists
      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (jobsError) {
        console.log("Error fetching jobs, using sample data:", jobsError);
        // If jobs table doesn't exist or has error, use sample data
        const sampleJobs = getSampleJobs();
        setJobs(sampleJobs);
        setFilteredJobs(sampleJobs);
        return;
      }

      // If we have jobs, get the organization profiles for each job
      const jobsWithOrganizations = await Promise.all(
        (jobsData || []).map(async (job) => {
          // Get the profile of the organization that posted the job
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

      // Filter by deadline
      const activeJobs = jobsWithOrganizations.filter((job) => {
        if (!job.application_deadline) return true;
        const deadline = new Date(job.application_deadline);
        return deadline >= new Date();
      });

      setJobs(activeJobs);
      setFilteredJobs(activeJobs);
    } catch (error) {
      console.error("Error loading jobs:", error);
      // Fallback to sample data
      const sampleJobs = getSampleJobs();
      setJobs(sampleJobs);
      setFilteredJobs(sampleJobs);
    } finally {
      setLoading(false);
    }
  }

  // Sample data for development/testing
  function getSampleJobs() {
    return [
      {
        id: "1",
        title: "Mathematics Teacher Needed",
        description:
          "Looking for an experienced mathematics teacher for high school students. Must have at least 3 years of teaching experience and a degree in Mathematics or related field.",
        requirements: [
          "Bachelor's degree in Mathematics",
          "3+ years teaching experience",
          "Good communication skills",
          "Teaching certification preferred",
        ],
        job_type: "Full-time",
        subject: "Mathematics",
        grade_levels: ["Secondary (9-10)", "Preparatory (11-12)"],
        location: "Addis Ababa, Bole",
        schedule: "Monday to Friday, 8:00 AM - 4:00 PM",
        salary_range: "ETB 8,000 - 12,000",
        application_deadline: "2024-12-31",
        start_date: "2024-09-01",
        duration: "1 year contract",
        vacancies: 2,
        is_active: true,
        created_at: "2024-01-15T10:30:00.000Z",
        organizations: {
          org_name: "St. Mary's High School",
          org_type: "school",
          verified: true,
          contact_person: "Mr. John Smith",
        },
      },
      {
        id: "2",
        title: "English Tutor for Elementary Students",
        description:
          "Part-time English tutor needed for elementary students. Flexible hours, good for university students.",
        requirements: [
          "Fluent in English",
          "Experience with children",
          "Patient and engaging",
        ],
        job_type: "Part-time",
        subject: "English Language",
        grade_levels: ["Elementary (1-4)", "Primary (5-8)"],
        location: "Adama",
        schedule: "Weekdays 3:00 PM - 6:00 PM",
        salary_range: "ETB 5,000 - 7,000",
        application_deadline: "2024-11-30",
        start_date: "2024-02-01",
        duration: "6 months",
        vacancies: 1,
        is_active: true,
        created_at: "2024-01-14T14:20:00.000Z",
        organizations: {
          org_name: "Green Valley Academy",
          org_type: "school",
          verified: true,
          contact_person: "Ms. Sarah Johnson",
        },
      },
      {
        id: "3",
        title: "Science Teacher",
        description:
          "Experienced science teacher needed for secondary school. Must be able to teach Physics, Chemistry, and Biology.",
        requirements: [
          "Degree in Science Education",
          "2+ years teaching experience",
          "Knowledge of Ethiopian curriculum",
        ],
        job_type: "Full-time",
        subject: "Science",
        grade_levels: ["Secondary (9-10)"],
        location: "Bahir Dar",
        schedule: "Regular school hours",
        salary_range: "ETB 9,000 - 14,000",
        application_deadline: "2024-12-15",
        start_date: "2024-09-01",
        duration: "Permanent",
        vacancies: 1,
        is_active: true,
        created_at: "2024-01-13T09:15:00.000Z",
        organizations: {
          org_name: "Bahir Dar International School",
          org_type: "school",
          verified: true,
          contact_person: "Dr. Michael Brown",
        },
      },
      {
        id: "4",
        title: "Home Tutor for Mathematics",
        description:
          "Family looking for a home tutor for two children in grades 5 and 7. Focus on Mathematics improvement.",
        requirements: [
          "Strong math background",
          "Experience tutoring",
          "Good with children",
        ],
        job_type: "Part-time",
        subject: "Mathematics",
        grade_levels: ["Elementary (1-4)", "Primary (5-8)"],
        location: "Addis Ababa, Kazanchis",
        schedule: "Weekends 10:00 AM - 1:00 PM",
        salary_range: "ETB 200 per hour",
        application_deadline: "2024-02-28",
        start_date: "2024-03-01",
        duration: "3 months trial",
        vacancies: 1,
        is_active: true,
        created_at: "2024-01-12T16:45:00.000Z",
        organizations: {
          org_name: "The Johnson Family",
          org_type: "family",
          verified: false,
          contact_person: "Mrs. Johnson",
        },
      },
    ];
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
    // Extract first number from salary string
    const matches = salaryString.match(/(\d+,?\d*)/);
    if (matches && matches.length > 0) {
      // Remove commas and convert to number
      return parseInt(matches[0].replace(/,/g, ""));
    }
    return 0;
  };

  const handleJobClick = (job) => {
    setSelectedJob(job);
    setShowDetail(true);
  };

  const handleApply = (job) => {
    // Check if user is logged in
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login?redirect=/dashboard/jobs";
      } else {
        // For now, just show an alert since we don't have application page
        alert(
          `Thank you for your interest in "${job.title}". Application feature will be available soon!`,
        );
      }
    };
    checkUser();
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
