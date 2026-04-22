const JOB_MODE_VALUES = ["onsite", "remote", "hybrid"];
const EMPLOYMENT_TYPE_VALUES = [
  "full_time",
  "part_time",
  "contract",
  "temporary",
  "volunteer",
];

const EMPLOYMENT_TYPE_LABELS = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  temporary: "Temporary",
  volunteer: "Volunteer",
};

const LEGACY_JOB_TYPE_MAP = {
  "full-time": "full_time",
  fulltime: "full_time",
  "part-time": "part_time",
  parttime: "part_time",
  contract: "contract",
  temporary: "temporary",
  volunteer: "volunteer",
};

const REMOTE_PATTERN = /\b(remote|online|virtual|work\s*from\s*home|wfh)\b/i;

function normalizeText(value) {
  return (value || "").toString().trim();
}

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj || {}, key);
}

function inferJobMode(job) {
  const explicitMode = normalizeText(job?.job_mode).toLowerCase();
  if (JOB_MODE_VALUES.includes(explicitMode)) {
    return explicitMode;
  }

  const searchableText = [
    normalizeText(job?.location),
    normalizeText(job?.title),
    normalizeText(job?.description),
  ].join(" ");

  if (REMOTE_PATTERN.test(searchableText)) {
    return "remote";
  }

  return "onsite";
}

function inferEmploymentType(job) {
  const explicitType = normalizeText(job?.employment_type).toLowerCase();
  if (EMPLOYMENT_TYPE_VALUES.includes(explicitType)) {
    return explicitType;
  }

  if (job?.part_time === true) {
    return "part_time";
  }

  const legacyType = normalizeText(job?.job_type).toLowerCase();
  if (LEGACY_JOB_TYPE_MAP[legacyType]) {
    return LEGACY_JOB_TYPE_MAP[legacyType];
  }

  return "part_time";
}

function inferCity(job, mode) {
  const explicitCity = normalizeText(job?.city);
  if (explicitCity) {
    return explicitCity;
  }

  if (mode === "remote") {
    return null;
  }

  const legacyLocation = normalizeText(job?.location);
  if (legacyLocation && !REMOTE_PATTERN.test(legacyLocation)) {
    return legacyLocation;
  }

  return null;
}

export function normalizeJobModel(job = {}) {
  const job_mode = inferJobMode(job);
  const employment_type = inferEmploymentType(job);
  const city = inferCity(job, job_mode);

  return {
    ...job,
    job_mode,
    employment_type,
    part_time: employment_type === "part_time",
    city,
    location:
      job_mode === "remote" ? "Remote" : city || normalizeText(job?.location),
    job_type:
      EMPLOYMENT_TYPE_LABELS[employment_type] ||
      normalizeText(job?.job_type) ||
      "Part-time",
  };
}

export function validateJobModel(job = {}) {
  const normalized = normalizeJobModel(job);
  const errors = [];

  if (!JOB_MODE_VALUES.includes(normalized.job_mode)) {
    errors.push("job_mode must be one of: onsite, remote, hybrid.");
  }

  if (!EMPLOYMENT_TYPE_VALUES.includes(normalized.employment_type)) {
    errors.push(
      "employment_type must be one of: full_time, part_time, contract, temporary, volunteer.",
    );
  }

  if (
    ["onsite", "hybrid"].includes(normalized.job_mode) &&
    !normalizeText(normalized.city)
  ) {
    errors.push("city is required when job_mode is onsite or hybrid.");
  }

  // Prevent contradictory combinations when both fields are provided.
  if (hasOwn(job, "part_time") && hasOwn(job, "employment_type")) {
    const partTimeFlag = job.part_time === true;
    const isEmploymentPartTime = normalized.employment_type === "part_time";

    if (partTimeFlag !== isEmploymentPartTime) {
      errors.push(
        "part_time must match employment_type='part_time' for a valid job configuration.",
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    normalized,
  };
}

export const JOB_MODE_OPTIONS = JOB_MODE_VALUES;
export const EMPLOYMENT_TYPE_OPTIONS = EMPLOYMENT_TYPE_VALUES;
export const EMPLOYMENT_TYPE_LABEL_MAP = EMPLOYMENT_TYPE_LABELS;
