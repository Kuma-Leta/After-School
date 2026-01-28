// app/components/JobFilters.js
"use client";

import { useState } from "react";

const JOB_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Temporary",
  "Volunteer",
];
const DURATION_TYPES = [
  { value: "short_term", label: "Short-term (1-6 months)" },
  { value: "long_term", label: "Long-term (1+ years)" },
  { value: "contract", label: "Contract Basis" },
];
const HOURS_PER_WEEK = [
  { value: "less_than_20", label: "Less than 20 hrs" },
  { value: "20_30", label: "20-30 hrs" },
  { value: "30_40", label: "30-40 hrs" },
  { value: "more_than_40", label: "More than 40 hrs" },
];

export default function JobFilters({ filters, setFilters, jobs }) {
  const [salaryRange, setSalaryRange] = useState({
    min: filters.salaryRange.min,
    max: filters.salaryRange.max,
  });

  // Extract unique categories from jobs
  const uniqueCategories = [
    ...new Set(jobs.map((job) => job.subject).filter(Boolean)),
  ];
  const uniqueLocations = [
    ...new Set(jobs.map((job) => job.location).filter(Boolean)),
  ];

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => {
      const currentArray = prev[filterType];
      const isSelected = currentArray.includes(value);

      return {
        ...prev,
        [filterType]: isSelected
          ? currentArray.filter((item) => item !== value)
          : [...currentArray, value],
      };
    });
  };

  const handleSalaryChange = (type, value) => {
    const newRange = {
      ...salaryRange,
      [type]: parseInt(value) || 0,
    };
    setSalaryRange(newRange);
    setFilters((prev) => ({
      ...prev,
      salaryRange: newRange,
    }));
  };

  const clearFilters = () => {
    setFilters({
      jobType: [],
      category: [],
      duration: [],
      hoursPerWeek: [],
      location: [],
      salaryRange: { min: 0, max: 50000 },
    });
    setSalaryRange({ min: 0, max: 50000 });
  };

  const activeFilterCount = Object.values(filters).reduce((count, filter) => {
    if (Array.isArray(filter)) {
      return count + filter.length;
    } else if (
      typeof filter === "object" &&
      filter.min === 0 &&
      filter.max === 50000
    ) {
      return count;
    }
    return count + 1;
  }, 0);

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-lg">Filters</h3>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm text-[#FF1E00] hover:text-[#E01B00]"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Job Type Filter */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Job Type</h4>
        <div className="space-y-2">
          {JOB_TYPES.map((type) => (
            <label key={type} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.jobType.includes(type)}
                onChange={() => handleFilterChange("jobType", type)}
                className="h-4 w-4 text-[#FF1E00] focus:ring-[#FF1E00] border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Subject/Category Filter */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Subject / Category</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
          {uniqueCategories.map((category) => (
            <label key={category} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.category.includes(category)}
                onChange={() => handleFilterChange("category", category)}
                className="h-4 w-4 text-[#FF1E00] focus:ring-[#FF1E00] border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{category}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Duration Filter */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Duration</h4>
        <div className="space-y-2">
          {DURATION_TYPES.map((duration) => (
            <label key={duration.value} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.duration.includes(duration.value)}
                onChange={() => handleFilterChange("duration", duration.value)}
                className="h-4 w-4 text-[#FF1E00] focus:ring-[#FF1E00] border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                {duration.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Location Filter */}
      {uniqueLocations.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Location</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {uniqueLocations.map((location) => (
              <label key={location} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.location.includes(location)}
                  onChange={() => handleFilterChange("location", location)}
                  className="h-4 w-4 text-[#FF1E00] focus:ring-[#FF1E00] border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{location}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Salary Range Filter */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Monthly Salary (ETB)</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <input
              type="number"
              value={salaryRange.min}
              onChange={(e) => handleSalaryChange("min", e.target.value)}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Min"
            />
            <span className="text-gray-500">to</span>
            <input
              type="number"
              value={salaryRange.max}
              onChange={(e) => handleSalaryChange("max", e.target.value)}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Max"
            />
          </div>
          <div className="px-2">
            <input
              type="range"
              min="0"
              max="50000"
              step="1000"
              value={salaryRange.max}
              onChange={(e) => handleSalaryChange("max", e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0</span>
              <span>25,000</span>
              <span>50,000+</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hours Per Week Filter */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Hours Per Week</h4>
        <div className="space-y-2">
          {HOURS_PER_WEEK.map((hours) => (
            <label key={hours.value} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.hoursPerWeek.includes(hours.value)}
                onChange={() => handleFilterChange("hoursPerWeek", hours.value)}
                className="h-4 w-4 text-[#FF1E00] focus:ring-[#FF1E00] border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{hours.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Active Filters Summary */}
      {activeFilterCount > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-medium">{activeFilterCount}</span> active
            filter{activeFilterCount !== 1 ? "s" : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            {filters.jobType.map((type) => (
              <span
                key={type}
                className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {type}
                <button
                  onClick={() => handleFilterChange("jobType", type)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
            {filters.category.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
              >
                {cat}
                <button
                  onClick={() => handleFilterChange("category", cat)}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            ))}
            {filters.location.map((loc) => (
              <span
                key={loc}
                className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
              >
                {loc}
                <button
                  onClick={() => handleFilterChange("location", loc)}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  ×
                </button>
              </span>
            ))}
            {(salaryRange.min > 0 || salaryRange.max < 50000) && (
              <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                ETB {salaryRange.min.toLocaleString()} -{" "}
                {salaryRange.max.toLocaleString()}
                <button
                  onClick={() => {
                    setSalaryRange({ min: 0, max: 50000 });
                    setFilters((prev) => ({
                      ...prev,
                      salaryRange: { min: 0, max: 50000 },
                    }));
                  }}
                  className="ml-1 text-yellow-600 hover:text-yellow-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
