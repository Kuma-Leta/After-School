function getUtcDateParts(value) {
  if (!value) return null;

  if (typeof value === "string") {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3]),
      };
    }
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return {
    year: parsed.getUTCFullYear(),
    month: parsed.getUTCMonth() + 1,
    day: parsed.getUTCDate(),
  };
}

export function getDeadlineEndOfDayUtc(deadline) {
  const parts = getUtcDateParts(deadline);
  if (!parts) return null;

  return new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, 23, 59, 59, 999),
  );
}

export function isDeadlineExpired(deadline, now = new Date()) {
  const deadlineEnd = getDeadlineEndOfDayUtc(deadline);
  if (!deadlineEnd) return false;

  return deadlineEnd.getTime() < now.getTime();
}

export function isDeadlineActive(deadline, now = new Date()) {
  return !isDeadlineExpired(deadline, now);
}
