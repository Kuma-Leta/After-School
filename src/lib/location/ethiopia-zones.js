export const ETHIOPIA_REGION_ZONE_CAPITALS = [
  {
    region: "Addis Ababa City Administration",
    zones: [{ zone: "Addis Ababa", capitalCity: "Addis Ababa" }],
  },
  {
    region: "Dire Dawa City Administration",
    zones: [{ zone: "Dire Dawa", capitalCity: "Dire Dawa" }],
  },
  {
    region: "Afar",
    zones: [
      { zone: "Zone 1", capitalCity: "Asaita" },
      { zone: "Zone 3", capitalCity: "Amibara" },
      { zone: "Zone 5", capitalCity: "Semera" },
    ],
  },
  {
    region: "Amhara",
    zones: [
      { zone: "North Gondar", capitalCity: "Gondar" },
      { zone: "South Gondar", capitalCity: "Debre Tabor" },
      { zone: "East Gojjam", capitalCity: "Debre Markos" },
      { zone: "West Gojjam", capitalCity: "Finote Selam" },
      { zone: "North Wollo", capitalCity: "Woldiya" },
      { zone: "South Wollo", capitalCity: "Dessie" },
      { zone: "Awi", capitalCity: "Injibara" },
      { zone: "Bahir Dar Special Zone", capitalCity: "Bahir Dar" },
    ],
  },
  {
    region: "Benishangul-Gumuz",
    zones: [
      { zone: "Assosa", capitalCity: "Assosa" },
      { zone: "Metekel", capitalCity: "Gilgel Beles" },
      { zone: "Kamashi", capitalCity: "Kamashi" },
    ],
  },
  {
    region: "Central Ethiopia",
    zones: [
      { zone: "Gurage", capitalCity: "Wolkite" },
      { zone: "Hadiya", capitalCity: "Hossana" },
      { zone: "Silte", capitalCity: "Worabe" },
      { zone: "Kembata Tembaro", capitalCity: "Durame" },
    ],
  },
  {
    region: "Gambela",
    zones: [{ zone: "Gambela", capitalCity: "Gambela" }],
  },
  {
    region: "Harari",
    zones: [{ zone: "Harari", capitalCity: "Harar" }],
  },
  {
    region: "Oromia",
    zones: [
      { zone: "East Shewa", capitalCity: "Adama" },
      { zone: "West Shewa", capitalCity: "Ambo" },
      { zone: "south West Shewa", capitalCity: "Woliso" },
      { zone: "Arsi", capitalCity: "Asella" },
      { zone: "Bale", capitalCity: "Robe" },
      { zone: "Jimma", capitalCity: "Jimma" },
      { zone: "East Hararghe", capitalCity: "Harar" },
      { zone: "West Hararghe", capitalCity: "Chiro" },
      { zone: "North Shewa", capitalCity: "Fitche" },
      { zone: "Illubabor", capitalCity: "Metu" },
      { zone: "Horo Guduru Wollega", capitalCity: "Shambu" },
    ],
  },
  {
    region: "Sidama",
    zones: [{ zone: "Sidama", capitalCity: "Hawassa" }],
  },
  {
    region: "Somali",
    zones: [
      { zone: "Fafan", capitalCity: "Jigjiga" },
      { zone: "Korahe", capitalCity: "Kebri Dahar" },
      { zone: "Dollo", capitalCity: "Warder" },
      { zone: "Shabelle", capitalCity: "Gode" },
      { zone: "Siti", capitalCity: "Shinile" },
    ],
  },
  {
    region: "South Ethiopia",
    zones: [
      { zone: "Gamo", capitalCity: "Arba Minch" },
      { zone: "Wolayita", capitalCity: "Sodo" },
      { zone: "Gedeo", capitalCity: "Dilla" },
      { zone: "South Omo", capitalCity: "Jinka" },
    ],
  },
  {
    region: "South West Ethiopia",
    zones: [
      { zone: "Kaffa", capitalCity: "Bonga" },
      { zone: "Bench Sheko", capitalCity: "Mizan Teferi" },
      { zone: "Sheka", capitalCity: "Tepi" },
      { zone: "West Omo", capitalCity: "Bachuma" },
    ],
  },
  {
    region: "Tigray",
    zones: [
      { zone: "Mekelle Special Zone", capitalCity: "Mekelle" },
      { zone: "Eastern Zone", capitalCity: "Adigrat" },
      { zone: "Central Zone", capitalCity: "Axum" },
      { zone: "North Western Zone", capitalCity: "Shire" },
      { zone: "Southern Zone", capitalCity: "Maychew" },
    ],
  },
];

export const ETHIOPIA_ZONE_CAPITAL_OPTIONS =
  ETHIOPIA_REGION_ZONE_CAPITALS.flatMap((regionEntry) =>
    regionEntry.zones.map((zoneEntry) => ({
      region: regionEntry.region,
      zone: zoneEntry.zone,
      capitalCity: zoneEntry.capitalCity,
    })),
  );

export function normalizeLocationToken(value) {
  return (value || "").toString().trim().toLowerCase().replace(/\s+/g, " ");
}

export function buildLocationLabel(capitalCity, zone, region) {
  const cleanCapitalCity = (capitalCity || "").toString().trim();
  const cleanZone = (zone || "").toString().trim();
  const cleanRegion = (region || "").toString().trim();

  return [cleanCapitalCity, cleanZone, cleanRegion].filter(Boolean).join(", ");
}

export function parseStructuredLocation(locationValue) {
  const parts = (locationValue || "")
    .toString()
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 3) {
    return {
      capitalCity: parts[0],
      zone: parts[1],
      region: parts[2],
    };
  }

  if (parts.length === 2) {
    return {
      capitalCity: parts[0],
      zone: parts[1],
      region: "",
    };
  }

  return {
    capitalCity: parts[0] || "",
    zone: "",
    region: "",
  };
}

export function findZoneCapital(region, zone) {
  const normalizedRegion = normalizeLocationToken(region);
  const normalizedZone = normalizeLocationToken(zone);

  for (const regionEntry of ETHIOPIA_REGION_ZONE_CAPITALS) {
    if (normalizeLocationToken(regionEntry.region) !== normalizedRegion) {
      continue;
    }

    const zoneMatch = regionEntry.zones.find(
      (zoneEntry) => normalizeLocationToken(zoneEntry.zone) === normalizedZone,
    );

    if (zoneMatch) {
      return zoneMatch.capitalCity;
    }
  }

  return "";
}

export function isKnownCapitalCity(city) {
  const normalizedCity = normalizeLocationToken(city);
  if (!normalizedCity) return false;

  return ETHIOPIA_ZONE_CAPITAL_OPTIONS.some(
    (entry) => normalizeLocationToken(entry.capitalCity) === normalizedCity,
  );
}

export function isMissingProfileLocation(locationValue) {
  return !(locationValue || "").toString().trim();
}
