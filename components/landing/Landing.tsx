"use client";

import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import type { Content, Project } from "@/lib/content";
import HexPhoto from "./HexPhoto";
import NetworkCanvas from "./NetworkCanvas";
import { Counter, Scramble, Typer, tilt } from "./fx";

const NAV = [
  ["about", "About"],
  ["arsenal", "Arsenal"],
  ["operations", "Operations"],
  ["timeline", "Timeline"],
  ["contact", "Contact"],
] as const;

const TINTS = ["var(--acc)", "var(--acc2)", "var(--acc3)", "var(--warm)"];
const tint = (i: number) => TINTS[i % TINTS.length];
const hexId = (s: string) => [...s].reduce((h, c) => (h * 33 + c.charCodeAt(0)) >>> 0, 5381).toString(16).toUpperCase().slice(0, 6);
const bare = (u: string) => u.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "");
const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export default function Landing({ content, visitor, onTerminal, onReplay }: {
  content: Content;
  visitor: string;
  onTerminal: () => void;
  onReplay: () => void;
}) {
  const { profile, contact, hr, stats, skills, experience, projects, site } = content;
  const root = useRef<HTMLDivElement>(null);
  const [section, setSection] = useState("top");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState<Project | null>(null);
  const [copied, setCopied] = useState(false);

  const roles = useMemo(() => [profile.role, ...hr.preferredRoles].filter(Boolean), [profile.role, hr.preferredRoles]);
  const allSkills = useMemo(() => skills.flatMap((g) => g.items), [skills]);
  const topSkills = useMemo(() => [...allSkills].sort((a, b) => b.level - a.level).slice(0, 5), [allSkills]);
  const channels = (
    [
      ["email", contact.email, `mailto:${contact.email}`],
      ["linkedin", contact.linkedin, contact.linkedin],
      ["github", contact.github, contact.github],
      ["website", contact.website, contact.website],
      ["phone", contact.phone, `tel:${contact.phone}`],
    ] as const
  ).filter(([, v]) => v);

  // Scroll reveal + active-section tracking
  useEffect(() => {
    const el = root.current!;
    const reveal = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), reveal.unobserve(e.target))),
      { root: el, threshold: 0.12 }
    );
    el.querySelectorAll(".reveal").forEach((n) => reveal.observe(n));
    const spy = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setSection(e.target.id)),
      { root: el, rootMargin: "-45% 0px -50% 0px" }
    );
    el.querySelectorAll("[data-spy]").forEach((n) => spy.observe(n));
    return () => {
      reveal.disconnect();
      spy.disconnect();
    };
  }, []);

  // Keyboard: ` or Ctrl+K opens terminal, Esc closes the project dossier
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      const typing = (e.target as HTMLElement)?.closest("input, textarea");
      if (!typing && (e.key === "`" || (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)))) {
        e.preventDefault();
        onTerminal();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onTerminal]);

  const onMove = (e: React.MouseEvent) => {
    root.current?.style.setProperty("--cx", `${e.clientX}px`);
    root.current?.style.setProperty("--cy", `${e.clientY}px`);
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(contact.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <div className="cc" ref={root} onMouseMove={onMove} onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 24)}>
      <div className="spot" aria-hidden />

      {/* ---------- NAV ---------- */}
      <header className={`nav ${scrolled ? "solid" : ""}`}>
        <a href="#top" className="logo">
          <span className="g">{profile.handle}</span>@<span className="c">{profile.host}</span>:~$<span className="caret" />
        </a>
        <nav>
          {NAV.map(([id, label]) => (
            <a key={id} href={`#${id}`} className={section === id ? "on" : ""}>{label}</a>
          ))}
        </nav>
        <button className="term-btn" onClick={onTerminal}>
          <span>&gt;_</span> Terminal <kbd>`</kbd>
        </button>
      </header>

      {/* ---------- HERO ---------- */}
      <section className="hero-shell" id="top" data-spy>
        <NetworkCanvas />
        <div className="floor" aria-hidden />
        <div className="blob b1" aria-hidden />
        <div className="blob b2" aria-hidden />

        <div className="hero">
          <div className="hero-copy">
            <div className="pill reveal" style={d(0)}>
              <i /> {site.heroBadge}
            </div>
            <div className="whoami reveal" style={d(100)}>
              // {visitor ? <><span className="c">hello, {visitor}</span> · </> : null}whoami
            </div>
            <h1 className="hero-name glitch reveal" style={d(150)} data-text={profile.name}>
              <Scramble text={profile.name} delay={350} />
            </h1>
            <div className="hero-role reveal" style={d(250)}>
              <span className="c">&gt;</span> <Typer words={roles} />
            </div>
            <p className="hero-tag reveal" style={d(350)}>{profile.tagline}</p>
            <div className="hero-cta reveal" style={d(450)}>
              <a href="#operations" className="nbtn primary">View operations <span>→</span></a>
              {profile.resume && <a href={profile.resume} download className="nbtn">Download résumé ↓</a>}
              <button className="nbtn ghost" onClick={onTerminal}>&gt;_ Open terminal</button>
            </div>
            {stats.length > 0 && (
              <div className="hero-stats reveal" style={d(550)}>
                {stats.map((s) => (
                  <div key={s.id}>
                    <b><Counter value={s.value} /></b>
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="holo reveal" style={d(300)}>
            <div className="holo-frame">
              <div className="holo-img">
                {profile.photo ? <HexPhoto src={profile.photo} alt={profile.name} /> : <span className="holo-ph">{profile.name.slice(0, 2)}</span>}
                <i className="holo-scan" />
              </div>
            </div>
            <span className="br tl" /><span className="br tr" /><span className="br bl" /><span className="br br2" />
            <div className="hud h1">ID // 0x{hexId(profile.name)}</div>
            <div className="hud h2">CLEARANCE // <b>ROOT</b></div>
            {profile.location && <div className="hud h3">LOC // {profile.location}</div>}
            <div className="hud h4"><i /> {hr.availability || "ONLINE"}</div>
            {topSkills.map((s, i) => (
              <span key={s.name} className={`orb o${i}`}>{s.name}</span>
            ))}
          </div>
        </div>

        <a href="#about" className="scroll-cue" aria-label="Scroll down">
          <span>scroll</span><i />
        </a>
      </section>

      {/* ---------- MARQUEE ---------- */}
      {allSkills.length > 0 && (
        <div className="marquee" aria-hidden>
          {[0, 1].map((row) => (
            <div key={row} className={`track ${row ? "rev" : ""}`}>
              {[...allSkills, ...allSkills].map((s, i) => (
                <span key={i}>{s.name}<i>◆</i></span>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ---------- ABOUT ---------- */}
      <section className="sec" id="about" data-spy>
        <SecHead idx="01" title="About" kicker="cat ~/about.txt" />
        <div className="about-grid">
          <div className="win glow reveal" {...tilt}>
            <div className="win-bar"><span /><span /><span /><em>about.txt — {profile.handle}@{profile.host}</em></div>
            <div className="win-body">
              {profile.about.map((p, i) => (
                <p key={i}><span className="c">&gt;</span> {p}</p>
              ))}
            </div>
          </div>
          <div className="snap glow reveal" style={d(120)} {...tilt}>
            <h3>Hiring snapshot</h3>
            <dl>
              {(
                [
                  ["Status", hr.availability],
                  ["Notice", hr.noticePeriod],
                  ["Mode", hr.workMode],
                  ["Base", profile.location],
                  ["Open to", hr.employmentTypes.join(" · ")],
                ] as const
              )
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
                ))}
            </dl>
            <div className="snap-cta">
              <a href="/hr" target="_blank" rel="noreferrer" className="nbtn primary sm">Recruiter view →</a>
              {profile.resume && <a href={profile.resume} download className="nbtn sm">Résumé ↓</a>}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- ARSENAL ---------- */}
      <section className="sec" id="arsenal" data-spy>
        <SecHead idx="02" title="Arsenal" kicker="ls ~/skills --proficiency" />
        <div className="skill-grid">
          {skills.map((g, gi) => {
            const avg = Math.round(g.items.reduce((n, s) => n + s.level, 0) / g.items.length);
            const C = 2 * Math.PI * 30;
            return (
              <div key={g.id} className="sk glow reveal" style={d(gi * 80)} {...tilt}>
                <div className="sk-head">
                  <svg viewBox="0 0 72 72" className="gauge" style={{ "--off": C - (C * avg) / 100, "--c": C } as CSSProperties}>
                    <circle cx="36" cy="36" r="30" className="g-bg" />
                    <circle cx="36" cy="36" r="30" className="g-fg" />
                  </svg>
                  <b className="gauge-n">{avg}<small>%</small></b>
                  <div>
                    <h3>{g.category}</h3>
                    <span>{g.items.length} modules loaded</span>
                  </div>
                </div>
                <ul>
                  {g.items.map((s, i) => (
                    <li key={s.name}>
                      <div className="sk-row"><span>{s.name}</span><em>{s.level}%</em></div>
                      <div className="sk-bar"><i style={{ "--w": `${s.level}%`, "--d": `${200 + i * 70}ms` } as CSSProperties} /></div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------- OPERATIONS ---------- */}
      <section className="sec" id="operations" data-spy>
        <SecHead idx="03" title="Operations" kicker="ls ~/projects --classified" />
        <div className="ops">
          {projects.map((p, i) => (
            <button key={p.id} className="op glow reveal" style={{ ...d((i % 3) * 90), "--pc": tint(i) } as CSSProperties} onClick={() => setOpen(p)} {...tilt}>
              <div className="op-cover">
                {p.image ? (
                  <img src={p.image} alt="" />
                ) : (
                  <div className="op-art">
                    <span className="op-hex">0x{hexId(p.name)}</span>
                    <b>{p.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 3)}</b>
                  </div>
                )}
              </div>
              <div className="op-body">
                <span className="op-no">CASE FILE // {String(i + 1).padStart(2, "0")}</span>
                <h3>{p.name}</h3>
                <p>{p.summary}</p>
                <div className="chips">
                  {p.stack.split(/\s*[·,|]\s*/).filter(Boolean).slice(0, 4).map((t) => <span key={t}>{t}</span>)}
                </div>
                <span className="op-open">Open dossier →</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ---------- TIMELINE ---------- */}
      {experience.length > 0 && (
        <section className="sec" id="timeline" data-spy>
          <SecHead idx="04" title="Timeline" kicker="git log --author=me" />
          <ol className="tl">
            {experience.map((e, i) => (
              <li key={e.id} className="reveal" style={d(i * 100)}>
                <i className="tl-dot" />
                <div className="tl-card glow" {...tilt}>
                  <span className="tl-when">{[e.period, e.location].filter(Boolean).join(" · ")}</span>
                  <h3>{e.title} <span className="c">@ {e.org}</span></h3>
                  <ul>{e.points.map((p, j) => <li key={j}>{p}</li>)}</ul>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ---------- CONTACT ---------- */}
      <section className="sec contact" id="contact" data-spy>
        <div className="reveal">
          <div className="whoami">// establish connection</div>
          <h2 className="big glitch" data-text={site.contactHeading}>{site.contactHeading}</h2>
          {site.contactText && <p className="hero-tag">{site.contactText}</p>}
        </div>
        <div className="win contact-win reveal" style={d(150)}>
          <div className="win-bar"><span /><span /><span /><em>./connect --secure</em></div>
          <div className="win-body">
            {channels.map(([k, v, h]) => (
              <div className="ch" key={k}>
                <span className="ch-k">{k}</span>
                <a href={h} target="_blank" rel="noreferrer">{bare(v)}</a>
                {k === "email" && (
                  <button onClick={copyEmail} className="copy">{copied ? "copied ✓" : "copy"}</button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="hero-cta center reveal" style={d(250)}>
          {contact.email && <a href={`mailto:${contact.email}`} className="nbtn primary">Send a message →</a>}
          {profile.resume && <a href={profile.resume} download className="nbtn">Download résumé ↓</a>}
        </div>
      </section>

      <footer className="foot">
        <span>© {new Date().getFullYear()} {profile.name.charAt(0) + profile.name.slice(1).toLowerCase()} {site.footerNote && ` · ${site.footerNote}`}</span>
        <span>
          <a href="/hr">Recruiter view</a> · <button onClick={onReplay}>Replay intro</button> · <button onClick={onTerminal}>Terminal</button>
        </span>
      </footer>

      {/* ---------- PROJECT DOSSIER ---------- */}
      {open && (
        <div className="modal-bg" onClick={() => setOpen(null)}>
          <div className="modal" style={{ "--pc": tint(projects.indexOf(open)) } as CSSProperties} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal>
            <div className="win-bar">
              <span onClick={() => setOpen(null)} /><span /><span />
              <em>dossier://{open.id}</em>
              <button className="x" onClick={() => setOpen(null)} aria-label="Close">✕</button>
            </div>
            {open.image && <img src={open.image} alt="" className="modal-img" />}
            <div className="modal-body">
              <span className="op-no">CLASSIFIED · CASE {open.id.toUpperCase()}</span>
              <h3>{open.name}</h3>
              <div className="chips">{open.stack.split(/\s*[·,|]\s*/).filter(Boolean).map((t) => <span key={t}>{t}</span>)}</div>
              <p>{open.summary}</p>
              {open.impact.length > 0 && (
                <>
                  <h4>Key results</h4>
                  <ul className="checks">{open.impact.map((x, i) => <li key={i}>{x}</li>)}</ul>
                </>
              )}
              <div className="hero-cta">
                {open.link && <a href={open.link} target="_blank" rel="noreferrer" className="nbtn primary sm">Live ↗</a>}
                {open.repo && <a href={open.repo} target="_blank" rel="noreferrer" className="nbtn sm">Source ↗</a>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SecHead({ idx, title, kicker }: { idx: string; title: string; kicker: string }) {
  return (
    <div className="sec-head reveal">
      <span className="sec-idx">{idx}</span>
      <div>
        <span className="sec-kick">$ {kicker}</span>
        <h2 className="sec-title"><Scramble text={title} /></h2>
      </div>
      <i className="sec-line" />
    </div>
  );
}
