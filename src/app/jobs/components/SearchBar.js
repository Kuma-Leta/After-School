// app/components/SearchBar.js
"use client";

import { useState } from "react";

export function SearchBar({ value, onChange, placeholder }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="max-w-3xl mx-auto">
      <div
        className={`relative transition-all duration-200 ${isFocused ? "scale-105" : ""}`}
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="block w-full pl-10 pr-4 py-4 text-lg border-0 rounded-2xl shadow-lg focus:ring-4 focus:ring-[#FF1E00]/30 focus:outline-none transition-all"
          placeholder={placeholder}
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <svg
              className="h-5 w-5 text-gray-400 hover:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
      {/* Quick Search Suggestions */}
      {value && (
        <div className="mt-2 flex flex-wrap gap-2 justify-center">
          <span className="text-sm text-gray-600">Try:</span>
          <button
            onClick={() => onChange("Mathematics")}
            className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full"
          >
            Mathematics
          </button>
          <button
            onClick={() => onChange("Part-time")}
            className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full"
          >
            Part-time
          </button>
          <button
            onClick={() => onChange("Addis Ababa")}
            className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full"
          >
            Addis Ababa
          </button>
        </div>
      )}
    </div>
  );
}
