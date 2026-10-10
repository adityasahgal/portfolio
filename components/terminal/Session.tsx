"use client";

import { ReactNode, forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { Content } from "@/lib/content";

type Entry = { id: number; node: ReactNode };
export type SessionHandle = { run: (cmd: string) => void };

const BANNER = String.raw`
    ___    ____  ________  ______  ___
   /   |  / __ \/  _/_  __/\ \/ /  /   |
  / /| | / / / // /  / /    \  /  / /| |
 / ___ |/ /_/ // /  / /     / /  / ___ |
/_/  |_/_____/___/ /_/     /_/  /_/  |_|
`;

const COMMANDS: Record<string, string> = {
  help: "List all commands",
  about: "Who I am",
  skills: "Technical skills & proficiency",
  projects: "Selected work",
  experience: "Professional experience",
  hr: "Recruiter summary — availability, roles, notice period",
  resume: "Download résumé",
  contact: "Get in touch",
  banner: "Show the banner again",
  history: "Your command history",
  clear: "Clear the screen",
  exit: "Close this tab",
};
const HIDDEN = ["sudo", "hack", "whoami", "ls", "date", "echo", "matrix", "rm", "coffee", "open"];
export const QUICK_CMDS = ["about", "skills", "projects", "experience", "hr", "contact", "clear"];

let uid = 0;
const nid = () => ++uid;

const meter = (level: number, width = 20) => {
  const filled = Math.round((level / 100) * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
};

type Props = {
  content: Content;
  active: boolean;
  onExit: () => void;
  onTitle: (title: string) => void;
};

/** One shell session — each terminal tab owns its own output, history and input. */
const Session = forwardRef<SessionHandle, Props>(function Session({ content, active, onExit, onTitle }, ref) {
  const { profile, contact, hr, skills, experience, projects } = content;
  const links = Object.fromEntries(Object.entries(contact).filter(([, v]) => v)) as Record<string, string>;
  const href = (k: string, v: string) => (k === "email" ? `mailto:${v}` : k === "phone" ? `tel:${v}` : v);

  const [entries, setEntries] = useState<Entry[]>([]);
  const [input, setInput] = useState("");
  const [hist, setHist] = useState<string[]>([]);
  const [hIdx, setHIdx] = useState<number>(-1);
  const [busy, setBusy] = useState(false);
  const outRef = useRef<HTMLDivElement>(null);
  const inRef = useRef<HTMLInputElement>(null);

  const push = useCallback((...nodes: ReactNode[]) => {
    setEntries((e) => [...e, ...nodes.map((node) => ({ id: nid(), node }))]);
  }, []);

  const Prompt = ({ cmd }: { cmd: string }) => (
    <div className="row">
      <span className="c-green">{profile.handle}</span>
      <span className="c-muted">@</span>
      <span className="c-cyan">{profile.host}</span>
      <span className="c-muted">:~$ </span>
      <span className="c-bold">{cmd}</span>
    </div>
  );

  const showBanner = useCallback(() => {
    push(
      <pre className="ascii">{BANNER}</pre>,
      <div className="row">
        <span className="c-bold">{profile.role}</span>
        <span className="c-muted"> — {profile.tagline}</span>
      </div>,
      <div className="row c-muted">
        Type <span className="c-green">help</span> to list commands, or{" "}
        <span className="c-green">hr</span> for the recruiter summary. Access level:{" "}
        <span className="c-red">GUEST</span>
      </div>,
      <div className="row">&nbsp;</div>
    );
  }, [push, profile.role, profile.tagline]);

  // Guard: React StrictMode runs effects twice in dev, which printed the banner twice
  const bannerShown = useRef(false);
  useEffect(() => {
    if (bannerShown.current) return;
    bannerShown.current = true;
    showBanner();
  }, [showBanner]);

  useEffect(() => {
    if (active) inRef.current?.focus();
  }, [active]);

  useEffect(() => {
    outRef.current?.scrollTo({ top: outRef.current.scrollHeight, behavior: "smooth" });
  }, [entries]);

  const runHack = () => {
    setBusy(true);
    const steps = [
      "Bypassing mainframe firewall...",
      "Injecting payload into port 1337...",
      "Decrypting RSA-4096 keys...",
      "Rerouting through 7 proxies...",
      "Exfiltrating résumé...",
    ];
    steps.forEach((s, i) =>
      setTimeout(() => {
        const pct = Math.round(((i + 1) / steps.length) * 100);
        push(
          <div className="row">
            <span className="c-amber">[{meter(pct)}]</span> <span className="c-muted">{pct}%</span> {s}
          </div>
        );
      }, (i + 1) * 450)
    );
    setTimeout(() => {
      push(<div className="row c-red">ACCESS GRANTED... just kidding. The easier way in is to hire me → type contact</div>);
      setBusy(false);
    }, steps.length * 450 + 500);
  };

  const kv = (k: string, v: ReactNode) => (
    <div className="row" key={k}>
      <span className="c-amber">{k.padEnd(16, " ")}</span>
      {v}
    </div>
  );

  const exec = (raw: string) => {
    const cmdLine = raw.trim();
    push(<Prompt cmd={cmdLine} />);
    if (!cmdLine) return;
    setHist((h) => [...h, cmdLine]);
    setHIdx(-1);

    const [cmd, ...args] = cmdLine.split(/\s+/);
    const c = cmd.toLowerCase();
    onTitle(c === "clear" ? "zsh" : c);

    switch (c) {
      case "help":
        push(
          <div className="row c-muted">Available commands:</div>,
          ...Object.entries(COMMANDS).map(([k, v]) => (
            <div className="row" key={k}>
              {"  "}
              <span className="c-green">{k.padEnd(14, " ")}</span>
              <span className="c-muted">{v}</span>
            </div>
          )),
          <div className="row c-muted">
            {"  "}
            <span className="c-cyan">{"project <id>".padEnd(14, " ")}</span>Details for a single project
          </div>,
          <div className="row c-muted">&nbsp;&nbsp;Use the + button for a new tab. A few commands are undocumented.</div>
        );
        break;

      case "about":
      case "whoami":
        if (c === "whoami" && !args.length) {
          push(<div className="row">{profile.handle} — the better question is <span className="c-green">who is {profile.name.toLowerCase()}?</span> → type about</div>);
          break;
        }
        push(
          <div className="row c-green">// {profile.name} — {profile.role}</div>,
          ...profile.about.map((a, i) => (
            <div className="row" key={i}>
              <span className="c-muted">&gt; </span>
              {a}
            </div>
          )),
          profile.location && <div className="row c-muted">&gt; location: {profile.location}</div>
        );
        break;

      case "skills":
        push(
          ...skills.flatMap((g) => [
            <div className="row c-amber" key={g.id}>[{g.category}]</div>,
            ...g.items.map((s) => (
              <div className="row" key={g.id + s.name}>
                {"  "}
                <span className="c-green">{s.name.padEnd(20, " ")}</span>
                <span className="c-cyan">{meter(s.level)}</span>
                <span className="c-muted"> {String(s.level).padStart(3)}%</span>
              </div>
            )),
          ])
        );
        break;

      case "projects":
      case "ls":
        if (c === "ls" && args[0] !== "projects") {
          push(<div className="row"><span className="c-cyan">projects/</span>  <span className="c-cyan">skills/</span>  about.txt  contact.txt  hr.pdf  <span className="c-red">secrets.enc</span></div>);
          break;
        }
        push(
          <div className="row c-muted">{projects.length} projects found. Run project &lt;id&gt; for details.</div>,
          ...projects.map((p) => (
            <div className="proj" key={p.id}>
              <div>
                <span className="pn">{p.name}</span> <span className="c-muted">[{p.id}]</span>
              </div>
              <div className="ps">{p.stack}</div>
            </div>
          ))
        );
        break;

      case "project": {
        const p = projects.find((x) => x.id === (args[0] || "").toLowerCase());
        if (!p) {
          push(<div className="row c-red">Project not found. Valid ids: {projects.map((x) => x.id).join(", ")}</div>);
          break;
        }
        push(
          <div className="proj">
            <div className="pn">▸ {p.name}</div>
            <div className="ps">{p.stack}</div>
            {p.image && <img className="proj-img" src={p.image} alt={p.name} />}
            <div>{p.summary}</div>
            {p.impact.map((x, i) => (
              <div key={i} className="c-muted">  ✓ {x}</div>
            ))}
            {p.link && <div>live → <a href={p.link} target="_blank" rel="noreferrer">{p.link.replace(/^https?:\/\//, "")}</a></div>}
            {p.repo && <div>repo → <a href={p.repo} target="_blank" rel="noreferrer">{p.repo.replace(/^https?:\/\//, "")}</a></div>}
          </div>
        );
        break;
      }

      case "experience":
        push(
          ...experience.map((e) => (
            <div className="proj" key={e.id}>
              <div>
                <span className="pn">{e.title}</span> <span className="c-muted">@</span>{" "}
                <span className="c-cyan">{e.org}</span>{" "}
                <span className="c-muted">({[e.period, e.location].filter(Boolean).join(" · ")})</span>
              </div>
              {e.points.map((pt, j) => (
                <div key={j} className="c-muted">- {pt}</div>
              ))}
            </div>
          ))
        );
        break;

      case "hr":
        push(
          <div className="row c-green">// RECRUITER BRIEF — {profile.name}</div>,
          hr.summary && <div className="row">{hr.summary}</div>,
          <div className="row">&nbsp;</div>,
          kv("role", profile.role),
          hr.availability && kv("availability", <span className="c-green">{hr.availability}</span>),
          hr.noticePeriod && kv("notice period", hr.noticePeriod),
          hr.workMode && kv("work mode", hr.workMode),
          profile.location && kv("location", profile.location),
          hr.relocation && kv("relocation", hr.relocation),
          hr.employmentTypes.length > 0 && kv("engagement", hr.employmentTypes.join(" · ")),
          hr.preferredRoles.length > 0 && kv("target roles", hr.preferredRoles.join(" · ")),
          hr.languages.length > 0 && kv("languages", hr.languages.join(" · ")),
          <div className="row">&nbsp;</div>,
          <div className="row">
            <span className="c-muted">Full one-page profile → </span>
            <a href="/hr" target="_blank" rel="noreferrer">/hr</a>
            {profile.resume && (
              <>
                <span className="c-muted">   résumé → </span>
                <a href={profile.resume} download>download</a>
              </>
            )}
          </div>
        );
        break;

      case "resume":
      case "cv":
        if (profile.resume) {
          window.open(profile.resume, "_blank");
          push(<div className="row c-green">Opening résumé...</div>);
        } else push(<div className="row c-muted">Résumé not published yet — try hr or contact.</div>);
        break;

      case "contact":
        push(
          <div className="row c-green">// Secure channels open:</div>,
          ...Object.entries(links).map(([k, v]) => (
            <div className="row" key={k}>
              <span className="c-amber">{k.padEnd(10, " ")}</span>
              <a href={href(k, v)} target="_blank" rel="noreferrer">
                {v.replace(/^https?:\/\//, "")}
              </a>
            </div>
          ))
        );
        break;

      case "open": {
        const k = (args[0] || "").toLowerCase();
        if (links[k]) {
          window.open(href(k, links[k]), "_blank");
          push(<div className="row c-green">Opening {k}...</div>);
        } else push(<div className="row c-red">usage: open {Object.keys(links).join("|")}</div>);
        break;
      }

      case "banner":
        showBanner();
        break;

      case "history":
        push(...hist.map((h, i) => <div className="row c-muted" key={i}>{String(i + 1).padStart(3)}  {h}</div>));
        break;

      case "clear":
        setEntries([]);
        break;

      case "date":
        push(<div className="row">{new Date().toString()}</div>);
        break;

      case "echo":
        push(<div className="row">{args.join(" ")}</div>);
        break;

      case "sudo":
        push(
          <div className="row c-red">[sudo] password for {profile.handle}: ********</div>,
          <div className="row c-red">{profile.handle} is not in the sudoers file. This incident will be reported.</div>
        );
        break;

      case "rm":
        push(<div className="row c-red">Permission denied: this system is protected by {profile.name}.</div>);
        break;

      case "coffee":
        push(<div className="row c-amber">☕ Brewing... developer fuel at 100%. Shall we talk business? → contact</div>);
        break;

      case "matrix":
        push(<div className="row c-green">Wake up, Neo... 🐇 (look behind the window — it&apos;s already running)</div>);
        break;

      case "hack":
        runHack();
        break;

      case "exit":
        push(<div className="row c-red">[Process completed]</div>);
        setTimeout(onExit, 450);
        break;

      default:
        push(
          <div className="row">
            <span className="c-red">command not found: {cmd}</span>
            <span className="c-muted"> — type help</span>
          </div>
        );
    }
  };

  useImperativeHandle(ref, () => ({
    run: (cmd: string) => {
      if (busy) return;
      exec(cmd);
      inRef.current?.focus();
    },
  }));

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (busy) return;
      exec(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!hist.length) return;
      const n = hIdx === -1 ? hist.length - 1 : Math.max(0, hIdx - 1);
      setHIdx(n);
      setInput(hist[n]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (hIdx === -1) return;
      const n = hIdx + 1;
      if (n >= hist.length) {
        setHIdx(-1);
        setInput("");
      } else {
        setHIdx(n);
        setInput(hist[n]);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const all = [...Object.keys(COMMANDS), "project", ...HIDDEN];
      const parts = input.split(" ");
      if (parts.length === 2 && parts[0] === "project") {
        const m = projects.filter((p) => p.id.startsWith(parts[1]));
        if (m.length === 1) setInput(`project ${m[0].id}`);
        return;
      }
      const m = all.filter((c) => c.startsWith(input.toLowerCase()));
      if (m.length === 1) setInput(m[0]);
      else if (m.length > 1) push(<Prompt cmd={input} />, <div className="row c-muted">{m.join("   ")}</div>);
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setEntries([]);
    }
  };

  return (
    <div className="sess term" hidden={!active} onClick={() => inRef.current?.focus()}>
      <div className="term-out" ref={outRef}>
        {entries.map((e) => (
          <div key={e.id}>{e.node}</div>
        ))}
      </div>
      <div className="mobile-chips">
        {QUICK_CMDS.map((c) => (
          <button key={c} onClick={() => !busy && exec(c)}>{c}</button>
        ))}
      </div>
      <div className="prompt-line">
        <span className="prompt-label">
          <span className="u">{profile.handle}</span>
          <span className="c-muted">@</span>
          <span className="h">{profile.host}</span>
          <span className="path c-muted">:~</span>
          <span className="c-muted">$</span>
        </span>
        <input
          ref={inRef}
          className="prompt-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label="Terminal input"
          placeholder={busy ? "running..." : ""}
        />
      </div>
    </div>
  );
});

export default Session;
