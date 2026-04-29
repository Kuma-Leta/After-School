import { normalizeJobModel } from "@/lib/jobs/model";
import {
  isKnownCapitalCity,
  normalizeLocationToken,
  parseStructuredLocation,
} from "@/lib/location/ethiopia-zones";

const REMOTE_PATTERNS = [
  "remote",
  "online",
  "virtual",
  "work from home",
  "wfh",
];

export function normalizeLocation(value) {
  return normalizeLocationToken(value);
}

export function matchesLocalJob(jobLocation, userLocation) {
  const normalizedJobLocation = normalizeLocation(jobLocation);
  const normalizedUserLocation = normalizeLocation(userLocation);
  const parsedJobLocation = parseStructuredLocation(jobLocation);
  const parsedUserLocation = parseStructuredLocation(userLocation);
  const normalizedJobCapital = normalizeLocation(parsedJobLocation.capitalCity);
  const normalizedUserCapital = normalizeLocation(
    parsedUserLocation.capitalCity,
  );

  if (!normalizedJobLocation || !normalizedUserLocation) {
    return false;
  }

  // Primary rule: when both sides identify a known capital city, match by capital.
  if (
    normalizedJobCapital &&
    normalizedUserCapital &&
    isKnownCapitalCity(parsedJobLocation.capitalCity) &&
    isKnownCapitalCity(parsedUserLocation.capitalCity)
  ) {
    return normalizedJobCapital === normalizedUserCapital;
  }

  // Secondary rule: if user has a known capital, allow exact/specific mention in job location.
  if (
    normalizedUserCapital &&
    isKnownCapitalCity(parsedUserLocation.capitalCity)
  ) {
    return (
      normalizedJobLocation === normalizedUserCapital ||
      normalizedJobLocation.includes(normalizedUserCapital)
    );
  }

  return (
    normalizedJobLocation === normalizedUserLocation ||
    normalizedJobLocation.includes(normalizedUserLocation) ||
    normalizedUserLocation.includes(normalizedJobLocation)
  );
}

export function isRemotePartTimeJob(job) {
  const normalizedJob = normalizeJobModel(job);

  if (
    normalizedJob.job_mode === "remote" &&
    normalizedJob.employment_type === "part_time"
  ) {
    return true;
  }

  const searchableText = [
    normalizeLocation(normalizedJob?.title),
    normalizeLocation(normalizedJob?.description),
    normalizeLocation(normalizedJob?.location),
    normalizeLocation(normalizedJob?.job_type),
  ].join(" ");

  const isRemote = REMOTE_PATTERNS.some((token) =>
    searchableText.includes(token),
  );
  const isPartTime =
    searchableText.includes("part-time") ||
    searchableText.includes("part time");

  return isRemote && isPartTime;
}

export function isRemoteAllowedForJob(job) {
  const normalizedJob = normalizeJobModel(job);

  if (typeof normalizedJob?.remote_allowed === "boolean") {
    return normalizedJob.remote_allowed;
  }

  return ["remote", "hybrid"].includes(normalizedJob?.job_mode);
}

export function evaluateLocationAwareJobEligibility(
  job,
  candidateCity,
  { candidateRemotePreference = false, includeRemotePartTime = false } = {},
) {
  const normalizedJob = normalizeJobModel(job);
  const normalizedCandidateCity = normalizeLocation(candidateCity);
  const normalizedJobCity = normalizeLocation(
    normalizedJob?.city || normalizedJob?.location,
  );
  const remoteAllowed = isRemoteAllowedForJob(normalizedJob);
  const remotePreferred = Boolean(candidateRemotePreference);
  const cityMatch = matchesLocalJob(normalizedJobCity, normalizedCandidateCity);
  const remotePartTimeMatch = isRemotePartTimeJob(normalizedJob);

  if (cityMatch) {
    return {
      eligible: true,
      reason: "city_match",
      checks: {
        candidateCity: normalizedCandidateCity,
        jobCity: normalizedJobCity,
        cityMatch,
        remoteAllowed,
        remotePreferred,
        remotePartTimeMatch,
      },
    };
  }

  if (remoteAllowed && remotePreferred) {
    return {
      eligible: true,
      reason: "remote_preference_match",
      checks: {
        candidateCity: normalizedCandidateCity,
        jobCity: normalizedJobCity,
        cityMatch,
        remoteAllowed,
        remotePreferred,
        remotePartTimeMatch,
      },
    };
  }

  if (includeRemotePartTime && remotePartTimeMatch) {
    return {
      eligible: true,
      reason: "remote_part_time_discovery_match",
      checks: {
        candidateCity: normalizedCandidateCity,
        jobCity: normalizedJobCity,
        cityMatch,
        remoteAllowed,
        remotePreferred,
        remotePartTimeMatch,
      },
    };
  }

  return {
    eligible: false,
    reason: remoteAllowed
      ? remotePreferred
        ? "remote_preference_unmet"
        : "candidate_remote_preference_disabled"
      : "location_mismatch",
    checks: {
      candidateCity: normalizedCandidateCity,
      jobCity: normalizedJobCity,
      cityMatch,
      remoteAllowed,
      remotePreferred,
      remotePartTimeMatch,
    },
  };
}

export function isJobVisibleToUser(
  job,
  userLocation,
  { includeRemotePartTime = false, candidateRemotePreference = false } = {},
) {
  return evaluateLocationAwareJobEligibility(job, userLocation, {
    includeRemotePartTime,
    candidateRemotePreference,
  }).eligible;
}
