"use client";

import { useEffect, useRef, useState } from "react";
import type { Content } from "@/lib/content";
import MatrixRain from "../MatrixRain";
import HexPhoto from "../landing/HexPhoto";
import { sfx } from "@/lib/sfx";
import { visitorHandle } from "@/lib/visitor";
import Session, { QUICK_CMDS, SessionHandle } from "./Session";

type Tab = { id: number; title: string };
const MAX_TABS = 8;
let tabSeq = 0;

/**
 * macOS-style terminal window: traffic lights (close / minimise / zoom),
 * multiple independent tabs, drag by the title bar, double-click to zoom.
 */
export default function TerminalWindow({ content, visitor, minimized, onClose, onMinimize, onRestore }: {
  content: Content;
  visitor: string;
  minimized: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onRestore: () => void;
}) {
  const { profile, stats } = content;
  const user = visitorHandle(visitor) || profile.handle;
  const [tabs, setTabs] = useState<Tab[]>(() => [{ id: ++tabSeq, title: "zsh" }]);
  const [active, setActive] = useState(tabs[0].id);
  const [zoomed, setZoomed] = useState(false);
  const [closing, setClosing] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [uptime, setUptime] = useState(0);
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const sessions = useRef(new Map<number, SessionHandle>());

  useEffect(() => {
    const t = setInterval(() => setUptime((u) => u + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Esc minimises (closing would lose every tab's state)
  useEffect(() => {
    if (minimized) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onMinimize();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [minimized, onMinimize]);

  const closeWindow = () => {
    sfx.close();
    setClosing(true);
    setTimeout(onClose, 180);
  };

  const newTab = () => {
    if (tabs.length >= MAX_TABS) return;
    const t = { id: ++tabSeq, title: "zsh" };
    sfx.tab();
    setTabs((ts) => [...ts, t]);
    setActive(t.id);
  };

  // `exit` fires from a timeout, so read the live tab list rather than a stale closure
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;
  const closeTab = (id: number) => {
    const cur = tabsRef.current;
    const i = cur.findIndex((t) => t.id === id);
    if (i === -1) return;
    const rest = cur.filter((t) => t.id !== id);
    sessions.current.delete(id);
    if (!rest.length) return closeWindow();
    sfx.tab();
    setTabs(rest);
    setActive((a) => (a === id ? rest[Math.min(i, rest.length - 1)].id : a));
  };

  const setTitle = (id: number, title: string) =>
    setTabs((ts) => ts.map((t) => (t.id === id ? { ...t, title } : t)));

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (zoomed || (e.target as HTMLElement).closest("button")) return;
    drag.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    setPos({
      x: Math.max(-innerWidth / 2, Math.min(innerWidth / 2, d.ox + e.clientX - d.sx)),
      y: Math.max(-innerHeight / 2 + 40, Math.min(innerHeight / 2 - 40, d.oy + e.clientY - d.sy)),
    });
  };
  const endDrag = () => { drag.current = null; };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const activeTab = tabs.find((t) => t.id === active);
  const initials = profile.name.slice(0, 2).toUpperCase();

  return (
    <>
      <div className={`term-overlay ${minimized ? "min" : ""} ${closing ? "closing" : ""}`}>
        <MatrixRain />
        <div
          className={`tw ${zoomed ? "zoomed" : ""}`}
          style={{ "--tx": `${pos.x}px`, "--ty": `${pos.y}px` } as React.CSSProperties}
          role="dialog"
          aria-label="Terminal"
        >
          {/* title bar */}
          <div
            className="tw-title"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onDoubleClick={(e) => !(e.target as HTMLElement).closest("button") && setZoomed((z) => !z)}
          >
            <div className="lights">
              <button className="l-close" onClick={closeWindow} aria-label="Close window"><span>×</span></button>
              <button className="l-min" onClick={onMinimize} aria-label="Minimise window"><span>−</span></button>
              <button className="l-zoom" onClick={() => setZoomed((z) => !z)} aria-label={zoomed ? "Restore size" : "Maximise window"}><span>{zoomed ? "↙" : "+"}</span></button>
            </div>
            <div className="tw-name">
              <b>{user}@{profile.host}</b> — {activeTab?.title} — {fmt(uptime)}
            </div>
          </div>

          {/* tabs */}
          <div className="tw-tabs" role="tablist">
            {tabs.map((t) => (
              <div
                key={t.id}
                role="tab"
                aria-selected={t.id === active}
                className={`tw-tab ${t.id === active ? "on" : ""}`}
                onClick={() => setActive(t.id)}
                onAuxClick={(e) => e.button === 1 && closeTab(t.id)}
              >
                <button className="tab-x" onClick={(e) => { e.stopPropagation(); closeTab(t.id); }} aria-label="Close tab">×</button>
                <span>{t.title}</span>
              </div>
            ))}
            <button className="tab-new" onClick={newTab} disabled={tabs.length >= MAX_TABS} aria-label="New tab" title="New tab">+</button>
          </div>

          {/* body */}
          <div className="tw-body">
            <aside className="side">
              <div className="side-id">
                <div className="side-photo">
                  {profile.photo ? <HexPhoto src={profile.photo} alt={profile.name} /> : <span>{initials}</span>}
                  <i className="scan" />
                </div>
                <div className="nm glitch" data-text={profile.name}>{profile.name}</div>
                <div className="rl">{profile.role}</div>
                {profile.status && <div className="st">{profile.status}</div>}
                <div className="side-actions">
                  <a href="/hr" target="_blank" rel="noreferrer">Recruiter view</a>
                  {profile.resume && <a href={profile.resume} download>Résumé ↓</a>}
                </div>
              </div>
              <div className="side-sec">
                <h4>QUICK EXEC</h4>
                {QUICK_CMDS.map((c) => (
                  <button key={c} className="chip" onClick={() => sessions.current.get(active)?.run(c)}>{c}</button>
                ))}
              </div>
              <div className="side-sec">
                <h4>METRICS</h4>
                {stats.map((s) => (
                  <div className="stat-row" key={s.id}><span>{s.label}</span><b>{s.value}</b></div>
                ))}
                <div className="stat-row"><span>open tabs</span><b>{tabs.length}</b></div>
                <div className="stat-row"><span>session</span><b>{fmt(uptime)}</b></div>
                <div className="stat-row"><span>cpu</span></div>
                <div className="bar"><i /></div>
              </div>
            </aside>

            <div className="tw-sessions">
              {tabs.map((t) => (
                <Session
                  key={t.id}
                  ref={(h) => { if (h) sessions.current.set(t.id, h); }}
                  content={content}
                  user={user}
                  visitor={visitor}
                  active={t.id === active && !minimized}
                  onExit={() => closeTab(t.id)}
                  onTitle={(title) => setTitle(t.id, title)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {minimized && (
        <div className="dock">
          <button className="dock-item" onClick={onRestore} title="Restore terminal">
            <span className="dock-ico">&gt;_</span>
            <span className="dock-label">Terminal · {tabs.length} tab{tabs.length > 1 ? "s" : ""}</span>
            <i className="dock-dot" />
          </button>
        </div>
      )}
    </>
  );
}
