"use client";

import { useEffect, useMemo, useState } from "react";
import { Content, fill } from "@/lib/content";
import { ALARM_PATTERN, AlarmStyle, preloadAlarm, sfx, stopAll } from "@/lib/sfx";

type L = { t: string; c: "ok" | "warn" | "err" };

/** Lines may start with [ok] / [warn] / [err] to pick their colour (default ok). */
const parse = (raw: string, p: Content["profile"], vars: Record<string, string>): L => {
  const m = /^\[(ok|warn|err)\]\s?/i.exec(raw);
  return { t: fill(m ? raw.slice(m[0].length) : raw, p, vars), c: (m?.[1].toLowerCase() as L["c"]) ?? "ok" };
};

export default function Boot({ content, vars, onDone }: { content: Content; vars: Record<string, string>; onDone: () => void }) {
  const { intro, profile } = content;
  const LINES = useMemo(() => intro.bootLines.map((l) => parse(l, profile, vars)), [intro.bootLines, profile, vars]);
  const [count, setCount] = useState(0);
  const [alarm, setAlarm] = useState(false);
  const [flash, setFlash] = useState(false);
  const banner = fill(intro.alarm, profile, vars);
  const style = intro.alarmSound as AlarmStyle;
  // On/off windows for the red flash: the sound pattern itself, or a steady pulse for custom files
  const windows: [number, number][] =
    style === "custom" ? Array.from({ length: 6 }, (_, i) => [i * 0.35, i * 0.35 + 0.175]) : ALARM_PATTERN[style];
  const alarmEnd = windows[windows.length - 1][1];

  useEffect(() => {
    if (style === "custom") preloadAlarm(intro.alarmFile); // decode while the log scrolls
  }, [style, intro.alarmFile]);

  // beep + key clicks as each log line lands, siren when access is granted
  useEffect(() => {
    if (count > 0) sfx.line(LINES[count - 1].c);
  }, [count, LINES]);
  // Siren and red flash start together and follow the same on/off windows
  useEffect(() => {
    if (!alarm || !banner) return;
    sfx.alarm(style, intro.alarmFile);
    const timers = windows.flatMap(([a, b]) => [
      setTimeout(() => setFlash(true), a * 1000),
      setTimeout(() => setFlash(false), b * 1000),
    ]);
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alarm, banner]);

  useEffect(() => {
    if (count < LINES.length) {
      const id = setTimeout(() => setCount((c) => c + 1), 230 + Math.random() * 180);
      return () => clearTimeout(id);
    }
    setAlarm(true);
    const id = setTimeout(() => {
      stopAll(); // a long custom file never bleeds into the next scene
      onDone();
    }, banner ? (Math.max(alarmEnd, 1.5) + 0.6) * 1000 : 400);
    return () => clearTimeout(id);
  }, [count, onDone, LINES.length, banner, alarmEnd]);

  return (
    <div className={`boot ${flash ? "flash" : ""}`}>
      {LINES.slice(0, count).map((l, i) => (
        <div key={i} className={`line ${l.c}`}>
          {l.t}
        </div>
      ))}
      {count < LINES.length && <span className="cursor" />}
      {alarm && banner && (
        <div className="breach-banner glitch" data-text={banner}>
          {banner}
        </div>
      )}
    </div>
  );
}
