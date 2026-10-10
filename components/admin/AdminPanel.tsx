"use client";

import { ReactNode, useEffect, useState } from "react";
import { ALARM_STYLES, AlarmStyle, sfx, unlock } from "@/lib/sfx";
import { Content, DEFAULT_INTRO, Experience, Project, SkillGroup, Stat, THEMES, Theme, newId, onColor, slugify } from "@/lib/content";

const TABS = ["Profile", "HR", "Skills", "Experience", "Projects", "Metrics", "Intro", "Appearance"] as const;
type Tab = (typeof TABS)[number];

/* ---------- small form primitives ---------- */

function Field({ label, value, onChange, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      {hint && <small>{hint}</small>}
    </label>
  );
}

function Area({ label, value, onChange, rows = 3, hint }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number; hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
      {hint && <small>{hint}</small>}
    </label>
  );
}

/** Textarea bound to a string[] — one entry per line. */
function Lines({ label, value, onChange, rows = 4 }: {
  label: string; value: string[]; onChange: (v: string[]) => void; rows?: number;
}) {
  return <Area label={label} rows={rows} value={value.join("\n")} onChange={(v) => onChange(v.split("\n"))} hint="One item per line" />;
}

function Upload({ label, value, onChange, accept }: {
  label: string; value: string; onChange: (v: string) => void; accept: string;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setErr("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) onChange(data.url);
    else setErr(data.error || "Upload failed");
  };

  const isImage = /\.(jpe?g|png|webp|gif)$/i.test(value) || /^https?:/.test(value) && !/\.(pdf|mp3|wav|ogg)$/i.test(value);
  const ext = value.split(".").pop()?.toUpperCase();
  return (
    <div className="field">
      <span>{label}</span>
      <div className="upload">
        {isImage ? <img src={value} alt="" /> : <div className="upload-ph">{value ? ext : "—"}</div>}
        <div className="upload-ctl">
          <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Upload a file or paste a URL" />
          <div className="row-btns">
            <label className="btn sm">
              {busy ? "Uploading…" : "Upload"}
              <input type="file" accept={accept} hidden onChange={(e) => upload(e.target.files?.[0])} />
            </label>
            {value && <button type="button" className="btn sm ghost" onClick={() => onChange("")}>Remove</button>}
          </div>
          {err && <small className="err">{err}</small>}
        </div>
      </div>
    </div>
  );
}

/** Card wrapper for an item in an orderable list. */
function Item({ title, index, total, onMove, onRemove, children }: {
  title: string; index: number; total: number; onMove: (dir: -1 | 1) => void; onRemove: () => void; children: ReactNode;
}) {
  return (
    <div className="item">
      <div className="item-head">
        <strong>{title || "Untitled"}</strong>
        <div className="row-btns">
          <button type="button" className="btn sm ghost" disabled={index === 0} onClick={() => onMove(-1)} aria-label="Move up">↑</button>
          <button type="button" className="btn sm ghost" disabled={index === total - 1} onClick={() => onMove(1)} aria-label="Move down">↓</button>
          <button type="button" className="btn sm danger" onClick={() => confirm(`Delete "${title || "item"}"?`) && onRemove()}>Delete</button>
        </div>
      </div>
      <div className="item-body">{children}</div>
    </div>
  );
}

/* ---------- list helpers ---------- */

function useList<T>(list: T[], set: (v: T[]) => void) {
  return {
    patch: (i: number, p: Partial<T>) => set(list.map((x, j) => (j === i ? { ...x, ...p } : x))),
    remove: (i: number) => set(list.filter((_, j) => j !== i)),
    move: (i: number, d: -1 | 1) => {
      const n = [...list];
      [n[i], n[i + d]] = [n[i + d], n[i]];
      set(n);
    },
    add: (item: T) => set([...list, item]),
  };
}

/* ---------- panel ---------- */

export default function AdminPanel({ initial }: { initial: Content }) {
  const [c, setC] = useState<Content>(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [tab, setTab] = useState<Tab>("Profile");
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(c) !== saved;

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Live-preview theme colours while editing
  useEffect(() => {
    const st = document.documentElement.style;
    const t = c.theme;
    [["--bg", t.bg], ["--acc", t.accent], ["--acc2", t.accent2], ["--acc3", t.accent3], ["--warm", t.warm], ["--on-acc", onColor(t.accent)]]
      .forEach(([k, v]) => st.setProperty(k, v));
  }, [c.theme]);

  const save = async () => {
    setSaving(true);
    setStatus(null);
    const res = await fetch("/api/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(c),
    });
    setSaving(false);
    if (res.status === 401) return location.reload();
    if (!res.ok) return setStatus({ kind: "err", msg: "Save failed." });
    const next = (await res.json()) as Content;
    setC(next);
    setSaved(JSON.stringify(next));
    setStatus({ kind: "ok", msg: "Published. Changes are live." });
  };

  const logout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    location.reload();
  };

  const profile = <K extends keyof Content["profile"]>(k: K) => (v: Content["profile"][K]) =>
    setC((s) => ({ ...s, profile: { ...s.profile, [k]: v } }));
  const contact = (k: keyof Content["contact"]) => (v: string) =>
    setC((s) => ({ ...s, contact: { ...s.contact, [k]: v } }));
  const hr = <K extends keyof Content["hr"]>(k: K) => (v: Content["hr"][K]) =>
    setC((s) => ({ ...s, hr: { ...s.hr, [k]: v } }));

  const intro = <K extends keyof Content["intro"]>(k: K) => (v: Content["intro"][K]) =>
    setC((s) => ({ ...s, intro: { ...s.intro, [k]: v } }));
  const site = (k: keyof Content["site"]) => (v: string) =>
    setC((s) => ({ ...s, site: { ...s.site, [k]: v } }));
  const theme = (k: keyof Theme) => (v: string) =>
    setC((s) => ({ ...s, theme: { ...s.theme, [k]: v } }));

  const skills = useList<SkillGroup>(c.skills, (v) => setC((s) => ({ ...s, skills: v })));
  const exp = useList<Experience>(c.experience, (v) => setC((s) => ({ ...s, experience: v })));
  const projects = useList<Project>(c.projects, (v) => setC((s) => ({ ...s, projects: v })));
  const stats = useList<Stat>(c.stats, (v) => setC((s) => ({ ...s, stats: v })));

  const counts: Partial<Record<Tab, number>> = {
    Skills: c.skills.reduce((n, g) => n + g.items.length, 0),
    Experience: c.experience.length,
    Projects: c.projects.length,
    Metrics: c.stats.length,
  };

  return (
    <div className="page admin">
      <header className="adm-top">
        <div className="adm-brand">
          <span className="login-mark">root@cms</span>
          <strong>Portfolio Admin</strong>
        </div>
        <div className="row-btns">
          {status && <span className={`toast ${status.kind}`}>{status.msg}</span>}
          {dirty && !status && <span className="toast warn">Unsaved changes</span>}
          <a className="btn ghost" href="/" target="_blank" rel="noreferrer">View site ↗</a>
          <a className="btn ghost" href="/hr" target="_blank" rel="noreferrer">HR page ↗</a>
          <button className="btn primary" onClick={save} disabled={!dirty || saving}>
            {saving ? "Publishing…" : "Publish"}
          </button>
          <button className="btn ghost" onClick={logout}>Log out</button>
        </div>
      </header>

      <div className="adm-body">
        <nav className="adm-tabs">
          {TABS.map((t) => (
            <button key={t} className={t === tab ? "on" : ""} onClick={() => { setTab(t); setStatus(null); }}>
              {t}
              {counts[t] !== undefined && <em>{counts[t]}</em>}
            </button>
          ))}
        </nav>

        <main className="adm-main" onInput={() => setStatus(null)}>
          {tab === "Profile" && (
            <>
              <section className="card">
                <h2>Identity</h2>
                <div className="grid2">
                  <Upload label="Profile photo" value={c.profile.photo} onChange={profile("photo")} accept="image/*" />
                  <Upload label="Résumé (PDF)" value={c.profile.resume} onChange={profile("resume")} accept="application/pdf" />
                  <Field label="Display name" value={c.profile.name} onChange={profile("name")} hint="Shown in the intro and banner (uppercase works best)" />
                  <Field label="Role / headline" value={c.profile.role} onChange={profile("role")} />
                  <Field label="Tagline" value={c.profile.tagline} onChange={profile("tagline")} />
                  <Field label="Location" value={c.profile.location} onChange={profile("location")} />
                  <Field label="Status line" value={c.profile.status} onChange={profile("status")} placeholder="Online — open to new opportunities" />
                  <div className="grid2 tight">
                    <Field label="Terminal user" value={c.profile.handle} onChange={profile("handle")} />
                    <Field label="Terminal host" value={c.profile.host} onChange={profile("host")} />
                  </div>
                </div>
                <Lines label="About (one paragraph per line)" value={c.profile.about} onChange={profile("about")} rows={6} />
              </section>
              <section className="card">
                <h2>Contact</h2>
                <div className="grid2">
                  <Field label="Email" value={c.contact.email} onChange={contact("email")} />
                  <Field label="Phone" value={c.contact.phone} onChange={contact("phone")} />
                  <Field label="Website" value={c.contact.website} onChange={contact("website")} />
                  <Field label="GitHub" value={c.contact.github} onChange={contact("github")} />
                  <Field label="LinkedIn" value={c.contact.linkedin} onChange={contact("linkedin")} />
                </div>
              </section>
            </>
          )}

          {tab === "HR" && (
            <section className="card">
              <h2>Recruiter information</h2>
              <p className="muted small">Shown on the <code>/hr</code> page and the <code>hr</code> terminal command.</p>
              <Area label="Professional summary" value={c.hr.summary} onChange={hr("summary")} rows={4} />
              <div className="grid2">
                <Field label="Availability" value={c.hr.availability} onChange={hr("availability")} placeholder="Open to opportunities" />
                <Field label="Notice period" value={c.hr.noticePeriod} onChange={hr("noticePeriod")} placeholder="30 days" />
                <Field label="Work mode" value={c.hr.workMode} onChange={hr("workMode")} placeholder="Remote · Hybrid · On-site" />
                <Field label="Relocation" value={c.hr.relocation} onChange={hr("relocation")} />
              </div>
              <div className="grid3">
                <Lines label="Target roles" value={c.hr.preferredRoles} onChange={hr("preferredRoles")} />
                <Lines label="Engagement types" value={c.hr.employmentTypes} onChange={hr("employmentTypes")} />
                <Lines label="Languages" value={c.hr.languages} onChange={hr("languages")} />
              </div>
            </section>
          )}

          {tab === "Skills" && (
            <>
              {c.skills.map((g, i) => (
                <Item key={g.id} title={g.category} index={i} total={c.skills.length} onMove={(d) => skills.move(i, d)} onRemove={() => skills.remove(i)}>
                  <Field label="Category" value={g.category} onChange={(v) => skills.patch(i, { category: v })} />
                  <div className="skill-rows">
                    {g.items.map((s, j) => {
                      const setItems = (items: SkillGroup["items"]) => skills.patch(i, { items });
                      return (
                        <div className="skill-row" key={j}>
                          <input value={s.name} placeholder="Skill name" onChange={(e) => setItems(g.items.map((x, k) => (k === j ? { ...x, name: e.target.value } : x)))} />
                          <input type="range" min={0} max={100} value={s.level} onChange={(e) => setItems(g.items.map((x, k) => (k === j ? { ...x, level: +e.target.value } : x)))} />
                          <output>{s.level}%</output>
                          <button type="button" className="btn sm ghost" onClick={() => setItems(g.items.filter((_, k) => k !== j))} aria-label="Remove skill">✕</button>
                        </div>
                      );
                    })}
                  </div>
                  <button type="button" className="btn sm" onClick={() => skills.patch(i, { items: [...g.items, { name: "", level: 75 }] })}>+ Add skill</button>
                </Item>
              ))}
              <button className="btn add" onClick={() => skills.add({ id: newId(), category: "New category", items: [{ name: "", level: 75 }] })}>+ Add skill category</button>
            </>
          )}

          {tab === "Experience" && (
            <>
              {c.experience.map((e, i) => (
                <Item key={e.id} title={`${e.title}${e.org ? " @ " + e.org : ""}`} index={i} total={c.experience.length} onMove={(d) => exp.move(i, d)} onRemove={() => exp.remove(i)}>
                  <div className="grid2">
                    <Field label="Job title" value={e.title} onChange={(v) => exp.patch(i, { title: v })} />
                    <Field label="Company" value={e.org} onChange={(v) => exp.patch(i, { org: v })} />
                    <Field label="Period" value={e.period} onChange={(v) => exp.patch(i, { period: v })} placeholder="Jan 2023 — Present" />
                    <Field label="Location" value={e.location} onChange={(v) => exp.patch(i, { location: v })} />
                  </div>
                  <Lines label="Achievements & responsibilities" value={e.points} onChange={(v) => exp.patch(i, { points: v })} />
                </Item>
              ))}
              <button className="btn add" onClick={() => exp.add({ id: newId(), title: "New role", org: "", period: "", location: "", points: [] })}>+ Add experience</button>
            </>
          )}

          {tab === "Projects" && (
            <>
              {c.projects.map((p, i) => (
                <Item key={i} title={p.name} index={i} total={c.projects.length} onMove={(d) => projects.move(i, d)} onRemove={() => projects.remove(i)}>
                  <div className="grid2">
                    <Field label="Project name" value={p.name} onChange={(v) => projects.patch(i, { name: v })} />
                    <Field label="Terminal id" value={p.id} onChange={(v) => projects.patch(i, { id: slugify(v) })} hint={`Visitors run: project ${p.id || "<id>"}`} />
                    <Field label="Tech stack" value={p.stack} onChange={(v) => projects.patch(i, { stack: v })} placeholder="NestJS · PostgreSQL · Redis" />
                    <Field label="Live URL" value={p.link} onChange={(v) => projects.patch(i, { link: v })} />
                    <Field label="Repository URL" value={p.repo} onChange={(v) => projects.patch(i, { repo: v })} />
                  </div>
                  <Area label="Summary" value={p.summary} onChange={(v) => projects.patch(i, { summary: v })} />
                  <div className="grid2">
                    <Lines label="Key results / highlights" value={p.impact} onChange={(v) => projects.patch(i, { impact: v })} />
                    <Upload label="Screenshot" value={p.image} onChange={(v) => projects.patch(i, { image: v })} accept="image/*" />
                  </div>
                </Item>
              ))}
              <button className="btn add" onClick={() => projects.add({ id: `project-${newId().slice(0, 4)}`, name: "New project", stack: "", summary: "", impact: [], link: "", repo: "", image: "" })}>+ Add project</button>
            </>
          )}

          {tab === "Metrics" && (
            <section className="card">
              <h2>Key metrics</h2>
              <p className="muted small">Headline numbers shown in the terminal side panel and on the HR page.</p>
              {c.stats.map((s, i) => (
                <div className="stat-edit" key={s.id}>
                  <input value={s.value} placeholder="7+" onChange={(e) => stats.patch(i, { value: e.target.value })} />
                  <input value={s.label} placeholder="Projects delivered" onChange={(e) => stats.patch(i, { label: e.target.value })} />
                  <button type="button" className="btn sm ghost" disabled={i === 0} onClick={() => stats.move(i, -1)}>↑</button>
                  <button type="button" className="btn sm ghost" onClick={() => stats.remove(i)}>✕</button>
                </div>
              ))}
              <button className="btn sm" onClick={() => stats.add({ id: newId(), label: "", value: "" })}>+ Add metric</button>
            </section>
          )}
          {tab === "Intro" && (
            <>
              <section className="card">
                <h2>Hacker intro sequence</h2>
                <label className="check">
                  <input type="checkbox" checked={c.intro.enabled} onChange={(e) => intro("enabled")(e.target.checked)} />
                  Play the intro for first-time visitors (boot → laptop → briefing)
                </label>
                <label className="check">
                  <input type="checkbox" checked={c.intro.sound} onChange={(e) => intro("sound")(e.target.checked)} />
                  Sound effects (boot hum, typing clicks, alarm siren). Adds a &quot;press any key&quot; screen, which browsers require before audio can play.
                </label>
                {c.intro.sound && (
                  <div className="alarm-pick">
                    <span className="field-label">Alarm sound (plays with ROOT ACCESS GRANTED)</span>
                    {(Object.entries(ALARM_STYLES) as [AlarmStyle, string][]).map(([k, label]) => (
                      <label key={k} className={`alarm-opt ${c.intro.alarmSound === k ? "on" : ""}`}>
                        <input type="radio" name="alarm" checked={c.intro.alarmSound === k} onChange={() => intro("alarmSound")(k)} />
                        <span>{label}</span>
                        <button
                          type="button"
                          className="btn sm ghost"
                          disabled={k === "custom" && !c.intro.alarmFile}
                          onClick={() => { unlock(); setTimeout(() => sfx.alarm(k, c.intro.alarmFile), 60); }}
                        >
                          ▶ Preview
                        </button>
                      </label>
                    ))}
                    {c.intro.alarmSound === "custom" && (
                      <Upload label="Custom alarm file (MP3, WAV or OGG — first 4 seconds play)" value={c.intro.alarmFile} onChange={intro("alarmFile")} accept="audio/*" />
                    )}
                  </div>
                )}
                <label className="check">
                  <input type="checkbox" checked={c.intro.askName} onChange={(e) => intro("askName")(e.target.checked)} />
                  Ask visitors for their name and greet them personally
                </label>
                <div className="grid2">
                  <Field label="Name prompt" value={c.intro.identify} onChange={intro("identify")} />
                  <Field label="Greeting" value={c.intro.hello} onChange={intro("hello")} hint="Shown on the laptop screen before the welcome headline" />
                </div>
                <p className="muted small">
                  Personal links: share <code>{"yoursite.com/?to=Priya"}</code> and the visitor is greeted by name without being asked.
                </p>
                <p className="muted small">Placeholders: <code>{"{visitor}"}</code> <code>{"{name}"}</code> <code>{"{role}"}</code> <code>{"{handle}"}</code> <code>{"{location}"}</code></p>
              </section>
              <section className="card">
                <h2>1 · Boot log</h2>
                <Area label="Boot lines" rows={9} value={c.intro.bootLines.join("\n")} onChange={(v) => intro("bootLines")(v.split("\n"))}
                  hint="One per line. Start a line with [ok], [warn] or [err] to set its colour." />
                <Field label="Alarm banner" value={c.intro.alarm} onChange={intro("alarm")} hint="Flashes after the last line. Leave empty to skip the alarm." />
              </section>
              <section className="card">
                <h2>2 · Laptop welcome screen</h2>
                <div className="grid2">
                  <Field label="Welcome headline" value={c.intro.welcome} onChange={intro("welcome")} />
                  <Field label="Subtitle" value={c.intro.subtitle} onChange={intro("subtitle")} />
                  <Field label="Button text" value={c.intro.button} onChange={intro("button")} />
                </div>
              </section>
              <section className="card">
                <h2>3 · Mission briefing</h2>
                <Field label="Title" value={c.intro.briefingTitle} onChange={intro("briefingTitle")} />
                <Area label="Briefing lines" rows={10} value={c.intro.briefing.join("\n")} onChange={(v) => intro("briefing")(v.split("\n"))}
                  hint="Typed out line by line. Wrap words in **double asterisks** to highlight them. Empty lines are kept." />
                <button type="button" className="btn sm ghost" onClick={() => confirm("Reset all intro text to defaults?") && setC((s) => ({ ...s, intro: { ...DEFAULT_INTRO, enabled: s.intro.enabled } }))}>
                  Reset intro to defaults
                </button>
              </section>
            </>
          )}

          {tab === "Appearance" && (
            <>
              <section className="card">
                <h2>Colour theme</h2>
                <p className="muted small">Pick a preset, then fine-tune any colour. Applies to the intro, site, terminal, HR page and this admin.</p>
                <div className="presets">
                  {Object.entries(THEMES).map(([name, t]) => {
                    const on = (Object.keys(t) as (keyof Theme)[]).every((k) => t[k] === c.theme[k]);
                    return (
                      <button type="button" key={name} className={`preset ${on ? "on" : ""}`} onClick={() => setC((s) => ({ ...s, theme: { ...t } }))}>
                        <span className="sw" style={{ background: t.bg }}>
                          {[t.accent, t.accent2, t.accent3, t.warm].map((col) => <i key={col} style={{ background: col }} />)}
                        </span>
                        {name}
                      </button>
                    );
                  })}
                </div>
                <div className="colors">
                  {([["bg", "Background"], ["accent", "Primary accent"], ["accent2", "Secondary accent"], ["accent3", "Highlight / glitch"], ["warm", "Warm accent"]] as [keyof Theme, string][]).map(([k, label]) => (
                    <label key={k} className="color">
                      <input type="color" value={c.theme[k]} onChange={(e) => theme(k)(e.target.value)} />
                      <span>{label}<code>{c.theme[k]}</code></span>
                    </label>
                  ))}
                </div>
              </section>
              <section className="card">
                <h2>Site text</h2>
                <div className="grid2">
                  <Field label="Hero badge" value={c.site.heroBadge} onChange={site("heroBadge")} />
                  <Field label="Footer note" value={c.site.footerNote} onChange={site("footerNote")} />
                  <Field label="Contact heading" value={c.site.contactHeading} onChange={site("contactHeading")} />
                  <Field label="Contact text" value={c.site.contactText} onChange={site("contactText")} />
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
