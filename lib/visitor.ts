// Visitor name: from a personal link (?to=Priya) or typed during the intro.
// Kept in localStorage so returning visitors are greeted without being asked again.

const KEY = "visitor-name";

export const cleanName = (s: string) =>
  s.replace(/[^\p{L}\p{N} .'-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 24);

/** Lowercase terminal-safe handle, e.g. "Priya Sharma" → "priya". */
export const visitorHandle = (name: string) =>
  name.toLowerCase().split(" ")[0].replace(/[^a-z0-9]/g, "").slice(0, 16);

/** Returns the name from the URL (and remembers it) or from storage; null if unknown. */
export function readVisitor(): string | null {
  try {
    const p = new URLSearchParams(location.search);
    const fromUrl = cleanName(p.get("to") || p.get("name") || "");
    if (fromUrl) {
      localStorage.setItem(KEY, fromUrl);
      return fromUrl;
    }
    const stored = localStorage.getItem(KEY);
    return stored === null ? null : cleanName(stored);
  } catch {
    return null;
  }
}

/** Saves the name; an empty string records "stayed anonymous" so we don't ask again. */
export function saveVisitor(name: string) {
  try {
    localStorage.setItem(KEY, cleanName(name));
  } catch {}
}

/** Details the browser exposes on its own — used for the automatic "visitor trace" greeting. */
export function fingerprint(): Record<string, string> {
  if (typeof navigator === "undefined") return {};
  const ua = navigator.userAgent;
  const os = /iPhone|iPad|iPod/.test(ua) ? "iOS"
    : /Android/.test(ua) ? "Android"
    : /Mac OS X|Macintosh/.test(ua) ? "macOS"
    : /Windows/.test(ua) ? "Windows"
    : /CrOS/.test(ua) ? "ChromeOS"
    : /Linux/.test(ua) ? "Linux" : "Unknown OS";
  const browser = /Edg\//.test(ua) ? "Edge"
    : /OPR\/|Opera/.test(ua) ? "Opera"
    : /Firefox\//.test(ua) ? "Firefox"
    : /Chrome\//.test(ua) ? "Chrome"
    : /Safari\//.test(ua) ? "Safari" : "Browser";
  let tz = "";
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch {}
  // "Asia/Kolkata" → "Kolkata", "America/New_York" → "New York"
  const RENAMED: Record<string, string> = { Calcutta: "Kolkata", Saigon: "Ho Chi Minh City", Kiev: "Kyiv", Rangoon: "Yangon", Katmandu: "Kathmandu" };
  const raw = tz.split("/").pop()?.replace(/_/g, " ") || "Unknown";
  const city = RENAMED[raw] ?? raw;
  if (tz === "Asia/Calcutta") tz = "Asia/Kolkata";
  const h = new Date().getHours();
  const greeting = h < 5 ? "Working late" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : h < 22 ? "Good evening" : "Working late";
  return { os, browser, city, tz: tz || "UTC", greeting };
}
