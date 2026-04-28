"use client";

import { Calendar, Globe, MapPin, Phone, Star, User } from "lucide-react";
import { resolveAvatarSrc } from "@/lib/avatar";
import CandidatePortfolioSection from "./CandidatePortfolioSection";

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function formatTime(value) {
  if (!value) return "";
  const [hourRaw, minuteRaw] = value.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value;
  const suffix = hour >= 12 ? "PM" : "AM";
  const normalizedHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${normalizedHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

function formatLanguages(languages) {
  if (!languages) return "Not specified";
  if (Array.isArray(languages)) return languages.join(", ");
  return languages;
}

export default function CandidateProfileView({
  profile,
  roleDetails,
  ratingSummary,
  serviceAvailability,
}) {
  const avatarSrc = resolveAvatarSrc(profile?.avatar_url);
  const age = calculateAge(profile?.date_of_birth);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <div
              role="img"
              aria-label={profile?.full_name || "Default profile avatar"}
              className="h-16 w-16 rounded-full bg-center bg-cover"
              style={{ backgroundImage: `url(${avatarSrc})` }}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">
              {profile?.full_name || "Candidate"}
            </h3>
            <p className="text-gray-600">{profile?.email || "N/A"}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {profile?.role && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded capitalize">
                  {profile.role}
                </span>
              )}
              {age && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                  {age} years old
                </span>
              )}
              {ratingSummary?.reviewCount > 0 && (
                <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded inline-flex items-center">
                  <Star className="h-3.5 w-3.5 mr-1" />
                  {Number(ratingSummary.averageScore || 0).toFixed(1)} (
                  {ratingSummary.reviewCount})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <User className="h-5 w-5 mr-2 text-gray-400" />
          Contact Information
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profile?.phone && (
            <div className="flex items-center">
              <Phone className="h-4 w-4 mr-2 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{profile.phone}</p>
              </div>
            </div>
          )}

          {profile?.location && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">{profile.location}</p>
              </div>
            </div>
          )}

          {profile?.gender && (
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Gender</p>
                <p className="font-medium">{profile.gender}</p>
              </div>
            </div>
          )}

          {profile?.languages && (
            <div className="flex items-center">
              <Globe className="h-4 w-4 mr-2 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Languages</p>
                <p className="font-medium">
                  {formatLanguages(profile.languages)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-gray-400" />
          Service Availability
        </h4>

        {!Array.isArray(serviceAvailability) ||
        serviceAvailability.length === 0 ? (
          <p className="text-sm text-gray-600">
            This candidate has not added service availability yet.
          </p>
        ) : (
          <div className="space-y-2">
            {serviceAvailability
              .slice()
              .sort((left, right) => left.dayOfWeek - right.dayOfWeek)
              .map((slot) => (
                <div
                  key={slot.dayOfWeek}
                  className={`rounded-lg border px-3 py-2 ${
                    slot.isAvailable
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <p
                    className={`text-sm font-medium ${
                      slot.isAvailable ? "text-emerald-900" : "text-gray-700"
                    }`}
                  >
                    {DAY_LABELS[slot.dayOfWeek]}:{" "}
                    {slot.isAvailable ? "Available" : "Not Available"}
                  </p>
                  {slot.isAvailable && (
                    <p className="text-xs text-emerald-700 mt-1">
                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}{" "}
                      ({slot.timezone || "UTC"})
                    </p>
                  )}
                  {slot.notes && (
                    <p className="text-xs text-gray-600 mt-1">
                      Notes: {slot.notes}
                    </p>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      <CandidatePortfolioSection
        roleDetails={roleDetails}
        canEdit={false}
        title="Candidate Portfolio"
        subtitle="Education, certificates, and experience shared by the candidate."
      />

      {profile?.bio && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">About</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-600 whitespace-pre-wrap">{profile.bio}</p>
          </div>
        </div>
      )}
    </div>
  );
}
