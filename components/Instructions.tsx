"use client";

import { useEffect, useMemo, useState } from "react";
import { Content, fill } from "@/lib/content";

type Seg = { t: string; c?: string };
type Line = Seg[];

/** **text** in a briefing line is highlighted as a key. */
const parseLine = (raw: string): Line =>
  raw.split("**").map((t, i) => ({ t, c: i % 2 ? "t-key" : undefined })).filter((s) => s.t);

const script = ({ intro, profile }: Content): Line[] => {
  const lines = intro.briefing.map((l) => {
    const parsed = parseLine(fill(l, profile));
    return parsed.length ? parsed : [{ t: "" }];
  });
  // Dim the line right after the title and the final line, like a classified memo
  if (lines[1]?.length === 1) lines[1][0].c = lines[1][0].c ?? "t-dim";
  const last = lines[lines.length - 1];
  if (last?.length === 1) last[0].c = last[0].c ?? "t-dim";
  return [[{ t: fill(intro.briefingTitle, profile), c: "t-title" }], ...lines];
};

export default function Instructions({ content, onDone }: { content: Content; onDone: () => void }) {
  const SCRIPT = useMemo(() => script(content), [content]);
  const [line, setLine] = useState(0);
  const [chars, setChars] = useState(0);

  const lineText = (l: Line) => l.map((s) => s.t).join("");
  const finished = line >= SCRIPT.length;

  useEffect(() => {
    if (finished) return;
    const full = lineText(SCRIPT[line]).length;
    if (chars < full) {
      const id = setTimeout(() => setChars((c) => c + 2), 14);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => {
      setLine((l) => l + 1);
      setChars(0);
    }, 160);
    return () => clearTimeout(id);
  }, [line, chars, finished, SCRIPT]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      if (finished) onDone();
      else {
        setLine(SCRIPT.length);
        setChars(0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finished, onDone, SCRIPT.length]);

  const renderLine = (l: Line, limit: number) => {
    let left = limit;
    return l.map((s, i) => {
      const part = s.t.slice(0, Math.max(0, left));
      left -= s.t.length;
      return (
        <span key={i} className={s.c}>
          {part}
        </span>
      );
    });
  };

  return (
    <div className="instr">
      <div className="instr-box">
        <div className="instr-head">
          <span>briefing.txt — encrypted</span>
          <span className="red">● REC</span>
        </div>
        <div className="instr-body">
          {SCRIPT.map((l, i) => {
            if (i > line) return null;
            const limit = i < line ? Infinity : chars;
            return (
              <div key={i}>
                {renderLine(l, limit)}
                {i === line && !finished && <span className="cursor" />}
                {lineText(l) === "" && " "}
              </div>
            );
          })}
          {finished && (
            <button className="instr-proceed" onClick={onDone}>
              [ PRESS ENTER TO ACCESS THE SYSTEM ]
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
