import { normalizeJobModel } from "@/lib/jobs/model";

const REMOTE_PATTERNS = [
  "remote",
  "online",
  "virtual",
  "work from home",
  "wfh",
];

export function normalizeLocation(value) {
  return (value || "").toString().trim().toLowerCase().replace(/\s+/g, " ");
}

export function matchesLocalJob(jobLocation, userLocation) {
  const normalizedJobLocation = normalizeLocation(jobLocation);
  const normalizedUserLocation = normalizeLocation(userLocation);

  if (!normalizedJobLocation || !normalizedUserLocation) {
    return false;
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

export function isJobVisibleToUser(
  job,
  userLocation,
  { includeRemotePartTime = false } = {},
) {
  const normalizedJob = normalizeJobModel(job);
  const jobCityOrLocation = normalizedJob?.city || normalizedJob?.location;

  if (matchesLocalJob(jobCityOrLocation, userLocation)) {
    return true;
  }

  if (includeRemotePartTime && isRemotePartTimeJob(normalizedJob)) {
    return true;
  }

  return false;
}
