export interface SchoolMatchEntry {
  name: string;
  normalized: string;
  initials: string;
  consonant: string;
}

export const normalizeSchoolName = (value: string) =>
  value.toUpperCase().replace(/[^A-Z0-9]+/g, "").trim();

export const getInitials = (value: string) => {
  const parts = value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return parts.map((part) => part[0]).join("");
};

export const getConsonantKey = (value: string) =>
  normalizeSchoolName(value).replace(/[AEIOU]/g, "");

const SCHOOL_ALIASES: Record<string, string> = {
  OK: "Old Kampala",
  OLDKLA: "Old Kampala",
  OLDKAMPALA: "Old Kampala",
  FWYS: "Fairways",
};

export const buildSchoolMatchIndex = (schools: { name: string }[]): SchoolMatchEntry[] => {
  return schools.map((school) => ({
    name: school.name,
    normalized: normalizeSchoolName(school.name),
    initials: getInitials(school.name),
    consonant: getConsonantKey(school.name),
  }));
};

export const resolveSchoolName = (rawValue: string, index: SchoolMatchEntry[]) => {
  const raw = String(rawValue || "").trim();
  if (!raw) return null;

  const normalized = normalizeSchoolName(raw);
  const aliasTarget = SCHOOL_ALIASES[normalized];
  if (aliasTarget) {
    const aliasNormalized = normalizeSchoolName(aliasTarget);
    const aliasMatch = index.find((s) => s.normalized === aliasNormalized);
    return aliasMatch ? aliasMatch.name : aliasTarget;
  }
  const initials = getInitials(raw);
  const consonant = getConsonantKey(raw);

  const exact = index.find((s) => s.normalized === normalized);
  if (exact) return exact.name;

  const initialsMatches = index.filter((s) => s.initials === initials && initials.length > 1);
  if (initialsMatches.length === 1) return initialsMatches[0].name;

  const consonantMatches = index.filter((s) => s.consonant === consonant && consonant.length > 2);
  if (consonantMatches.length === 1) return consonantMatches[0].name;

  const prefixMatches = index.filter(
    (s) => normalized.length >= 3 && s.normalized.startsWith(normalized)
  );
  if (prefixMatches.length === 1) return prefixMatches[0].name;

  return null;
};
