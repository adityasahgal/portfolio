// Shared content model + normalisation (safe to import on client and server).

export type Skill = { name: string; level: number };
export type SkillGroup = { id: string; category: string; items: Skill[] };
export type Experience = {
  id: string;
  title: string;
  org: string;
  period: string;
  location: string;
  points: string[];
};
export type Project = {
  id: string;
  name: string;
  stack: string;
  summary: string;
  impact: string[];
  link: string;
  repo: string;
  image: string;
};
export type Stat = { id: string; label: string; value: string };

export type Theme = { bg: string; accent: string; accent2: string; accent3: string; warm: string };

export const THEMES: Record<string, Theme> = {
  "Hacker Pro": { bg: "#050807", accent: "#2bd67b", accent2: "#4fd1c5", accent3: "#e5484d", warm: "#d9a441" },
  "Stealth": { bg: "#08090a", accent: "#3fb950", accent2: "#58a6ff", accent3: "#f85149", warm: "#d29922" },
  "Y2K Chrome": { bg: "#070b1f", accent: "#3d8bff", accent2: "#00e5ff", accent3: "#ff3ea5", warm: "#ffb238" },
  "Windows XP": { bg: "#0a1733", accent: "#4a90ff", accent2: "#7fd4ff", accent3: "#ff8c1a", warm: "#7ac143" },
  "Winamp": { bg: "#0d0d14", accent: "#c8d23c", accent2: "#5ad1ff", accent3: "#ff7a2f", warm: "#f5c542" },
  "Synthwave": { bg: "#12061f", accent: "#ff4fd8", accent2: "#36e4ff", accent3: "#ffd23f", warm: "#ff8a3d" },
  "Matrix": { bg: "#030605", accent: "#00ff88", accent2: "#22d3ee", accent3: "#ff2e88", warm: "#ffb000" },
};
const DEFAULT_THEME = THEMES["Hacker Pro"];

/** Black or white text, whichever reads better on the given hex colour. */
export function onColor(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#05070d" : "#ffffff";
}

export const DEFAULT_INTRO = {
  enabled: true,
  askName: false,
  sound: true,
  alarmSound: "redalert",
  alarmFile: "",
  identify: "IDENTIFY YOURSELF",
  hello: "{greeting}, {visitor}",
  bootLines: [
    "[ok] [ 0.000000] Initializing secure kernel ............. OK",
    "[ok] [ 0.004211] Mounting /dev/{handle}/portfolio ......... OK",
    "[ok] [ 0.017733] Loading engineering modules .............. OK",
    "[ok] [ 0.031002] Opening encrypted tunnel -> 10.13.37.1 ... OK",
    "[warn] [ 0.044809] Port scan [22, 80, 443, 1337] ........... 4 OPEN",
    "[warn] [ 0.051117] Handshake: unknown signature — verifying identity",
    "[warn] [ 0.058802] Visitor trace: {browser} on {os} · {city} ({tz})",
    "[err] [ 0.066420] Firewall ................................ BYPASSED",
    "[err] [ 0.071337] Privilege escalation .................... uid=0(root)",
  ],
  alarm: "⚠ ROOT ACCESS GRANTED",
  welcome: "WELCOME TO {name}'S SYSTEM",
  subtitle: "// AUTHORIZED ACCESS ONLY //",
  button: "[ PRESS ENTER TO CONNECT ]",
  briefingTitle: ">> MISSION BRIEFING",
  briefing: [
    "Target: {name} — {role}.",
    "Agent {visitor}, you now have shell access. Read the protocol before proceeding:",
    "",
    "  **01** Scroll to browse the full dossier — skills, operations, timeline.",
    "  **02** Press **`** anytime to open a live shell. Start with **help**.",
    "  **03** **TAB** autocompletes, **↑ ↓** cycles history, **+** opens a new tab.",
    "  **04** Recruiters: run **hr** or open Recruiter View for a one-page summary.",
    "  **05** Some commands are undocumented. Find them.",
    "",
    "This briefing will self-destruct.",
  ],
};

export const DEFAULT_SITE = {
  heroBadge: "SYSTEM ONLINE · IDENTITY VERIFIED",
  contactHeading: "Got a mission?",
  contactText: "Let's build something fast, secure and built to scale.",
  footerNote: "All systems nominal",
};

const PROFILE_KEYS = ["name", "role", "handle", "location"] as const;

/**
 * Replace placeholders: profile fields ({name} {role} {handle} {location}),
 * the visitor ({visitor}, "operator" when unknown) and auto-detected details
 * ({greeting} {browser} {os} {city} {tz}).
 */
export const fill = (s: string, p: Content["profile"], vars: Record<string, string> = {}) =>
  s.replace(/\{(\w+)\}/g, (m, k: string) => {
    if ((PROFILE_KEYS as readonly string[]).includes(k)) return p[k as (typeof PROFILE_KEYS)[number]];
    if (k === "visitor") return vars.visitor || "operator";
    return vars[k] ?? m;
  });

export type Content = {
  theme: Theme;
  intro: typeof DEFAULT_INTRO;
  site: typeof DEFAULT_SITE;
  profile: {
    name: string;
    handle: string;
    host: string;
    role: string;
    tagline: string;
    location: string;
    status: string;
    photo: string;
    resume: string;
    about: string[];
  };
  contact: {
    email: string;
    phone: string;
    website: string;
    github: string;
    linkedin: string;
  };
  hr: {
    summary: string;
    availability: string;
    noticePeriod: string;
    workMode: string;
    relocation: string;
    employmentTypes: string[];
    preferredRoles: string[];
    languages: string[];
  };
  stats: Stat[];
  skills: SkillGroup[];
  experience: Experience[];
  projects: Project[];
};

export const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {});
const str = (v: unknown, max = 2000) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const arr = (v: unknown) => (Array.isArray(v) ? v : []);
const lines = (v: unknown) => arr(v).map((x) => str(x)).filter(Boolean);
const id = (v: unknown) => str(v, 64) || newId();
const url = (v: unknown) => {
  const s = str(v, 500);
  return /^(https?:\/\/|\/uploads\/|mailto:|tel:)/i.test(s) || s === "" ? s : `https://${s}`;
};

/** Coerce untrusted input into a valid Content object. */
export function normalize(input: unknown): Content {
  const i = obj(input);
  const p = obj(i.profile);
  const c = obj(i.contact);
  const h = obj(i.hr);
  const t = obj(i.theme);
  const it = obj(i.intro);
  const st = obj(i.site);
  const hex = (v: unknown, d: string) => (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : d);
  const or = (v: unknown, d: string, max = 300) => (typeof v === "string" ? v.slice(0, max) : d);
  const list = (v: unknown, d: string[]) => (Array.isArray(v) ? v.map((x) => (typeof x === "string" ? x.slice(0, 300) : "")).slice(0, 40) : d);

  const usedIds = new Set<string>();
  const projects = arr(i.projects)
    .map((x) => {
      const r = obj(x);
      const name = str(r.name, 120);
      let pid = slugify(str(r.id, 40) || name) || newId();
      while (usedIds.has(pid)) pid = `${pid}-${newId().slice(0, 3)}`;
      usedIds.add(pid);
      return {
        id: pid,
        name,
        stack: str(r.stack, 300),
        summary: str(r.summary),
        impact: lines(r.impact),
        link: url(r.link),
        repo: url(r.repo),
        image: url(r.image),
      };
    })
    .filter((x) => x.name);

  return {
    theme: {
      bg: hex(t.bg, DEFAULT_THEME.bg),
      accent: hex(t.accent, DEFAULT_THEME.accent),
      accent2: hex(t.accent2, DEFAULT_THEME.accent2),
      accent3: hex(t.accent3, DEFAULT_THEME.accent3),
      warm: hex(t.warm, DEFAULT_THEME.warm),
    },
    intro: {
      enabled: typeof it.enabled === "boolean" ? it.enabled : true,
      askName: typeof it.askName === "boolean" ? it.askName : false,
      sound: typeof it.sound === "boolean" ? it.sound : true,
      alarmSound: ["klaxon", "redalert", "airraid", "beeper", "custom"].includes(it.alarmSound as string) ? (it.alarmSound as string) : DEFAULT_INTRO.alarmSound,
      alarmFile: url(it.alarmFile),
      identify: or(it.identify, DEFAULT_INTRO.identify),
      hello: or(it.hello, DEFAULT_INTRO.hello),
      bootLines: list(it.bootLines, DEFAULT_INTRO.bootLines).filter((x) => x.trim()),
      alarm: or(it.alarm, DEFAULT_INTRO.alarm),
      welcome: or(it.welcome, DEFAULT_INTRO.welcome),
      subtitle: or(it.subtitle, DEFAULT_INTRO.subtitle),
      button: or(it.button, DEFAULT_INTRO.button),
      briefingTitle: or(it.briefingTitle, DEFAULT_INTRO.briefingTitle),
      briefing: list(it.briefing, DEFAULT_INTRO.briefing),
    },
    site: {
      heroBadge: or(st.heroBadge, DEFAULT_SITE.heroBadge),
      contactHeading: or(st.contactHeading, DEFAULT_SITE.contactHeading),
      contactText: or(st.contactText, DEFAULT_SITE.contactText),
      footerNote: or(st.footerNote, DEFAULT_SITE.footerNote),
    },
    profile: {
      name: str(p.name, 60) || "ADITYA",
      handle: slugify(str(p.handle, 30)) || "guest",
      host: slugify(str(p.host, 30)) || "localhost",
      role: str(p.role, 120),
      tagline: str(p.tagline, 200),
      location: str(p.location, 120),
      status: str(p.status, 120),
      photo: url(p.photo),
      resume: url(p.resume),
      about: lines(p.about),
    },
    contact: {
      email: str(c.email, 200),
      phone: str(c.phone, 40),
      website: url(c.website),
      github: url(c.github),
      linkedin: url(c.linkedin),
    },
    hr: {
      summary: str(h.summary),
      availability: str(h.availability, 120),
      noticePeriod: str(h.noticePeriod, 120),
      workMode: str(h.workMode, 120),
      relocation: str(h.relocation, 120),
      employmentTypes: lines(h.employmentTypes),
      preferredRoles: lines(h.preferredRoles),
      languages: lines(h.languages),
    },
    stats: arr(i.stats)
      .map((x) => {
        const r = obj(x);
        return { id: id(r.id), label: str(r.label, 60), value: str(r.value, 40) };
      })
      .filter((x) => x.label && x.value),
    skills: arr(i.skills)
      .map((x) => {
        const r = obj(x);
        return {
          id: id(r.id),
          category: str(r.category, 60),
          items: arr(r.items)
            .map((s) => {
              const o = obj(s);
              const lvl = Math.round(Number(o.level));
              return { name: str(o.name, 60), level: Number.isFinite(lvl) ? Math.min(100, Math.max(0, lvl)) : 0 };
            })
            .filter((s) => s.name),
        };
      })
      .filter((x) => x.category && x.items.length),
    experience: arr(i.experience)
      .map((x) => {
        const r = obj(x);
        return {
          id: id(r.id),
          title: str(r.title, 120),
          org: str(r.org, 120),
          period: str(r.period, 60),
          location: str(r.location, 120),
          points: lines(r.points),
        };
      })
      .filter((x) => x.title || x.org),
    projects,
  };
}
