"use client";

import { useEffect, useMemo, useState } from "react";
import { Content, fill } from "@/lib/content";

type L = { t: string; c: "ok" | "warn" | "err" };

/** Lines may start with [ok] / [warn] / [err] to pick their colour (default ok). */
const parse = (raw: string, p: Content["profile"]): L => {
  const m = /^\[(ok|warn|err)\]\s?/i.exec(raw);
  return { t: fill(m ? raw.slice(m[0].length) : raw, p), c: (m?.[1].toLowerCase() as L["c"]) ?? "ok" };
};

export default function Boot({ content, onDone }: { content: Content; onDone: () => void }) {
  const { intro, profile } = content;
  const LINES = useMemo(() => intro.bootLines.map((l) => parse(l, profile)), [intro.bootLines, profile]);
  const [count, setCount] = useState(0);
  const [alarm, setAlarm] = useState(false);
  const banner = fill(intro.alarm, profile);

  useEffect(() => {
    if (count < LINES.length) {
      const id = setTimeout(() => setCount((c) => c + 1), 230 + Math.random() * 180);
      return () => clearTimeout(id);
    }
    setAlarm(true);
    const id = setTimeout(onDone, banner ? 2100 : 400);
    return () => clearTimeout(id);
  }, [count, onDone, LINES.length, banner]);

  return (
    <div className={`boot ${alarm && banner ? "alarm" : ""}`}>
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
