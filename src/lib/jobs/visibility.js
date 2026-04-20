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
  const searchableText = [
    normalizeLocation(job?.title),
    normalizeLocation(job?.description),
    normalizeLocation(job?.location),
    normalizeLocation(job?.job_type),
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
  if (matchesLocalJob(job?.location, userLocation)) {
    return true;
  }

  if (includeRemotePartTime && isRemotePartTimeJob(job)) {
    return true;
  }

  return false;
}
