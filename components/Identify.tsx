"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Content, fill } from "@/lib/content";
import { sfx } from "@/lib/sfx";
import { cleanName } from "@/lib/visitor";

/** Hacker-style "identify yourself" prompt that asks the visitor for their name. */
export default function Identify({ content, onDone }: { content: Content; onDone: (name: string) => void }) {
  const { intro, profile } = content;
  const [name, setName] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const inRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  const finish = (raw: string) => {
    if (result !== null) return;
    const n = cleanName(raw);
    setResult(n);
    if (n) sfx.granted();
    else sfx.line("warn");
    setTimeout(() => onDone(n), n ? 1300 : 900);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    finish(name);
  };

  return (
    <div className="boot identify">
      <div className="line warn">[ 0.081204] Unknown operator detected on tty1</div>
      <div className="line ok">[ 0.082913] Biometric scan .......................... SKIPPED</div>
      <form className="id-prompt" onSubmit={submit}>
        <span className="id-label">&gt; {fill(intro.identify, profile)}:</span>
        <input
          ref={inRef}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            sfx.key();
          }}
          maxLength={24}
          disabled={result !== null}
          autoComplete="given-name"
          spellCheck={false}
          aria-label="Your name"
          placeholder="type your name"
        />
      </form>
      {result === null && (
        <div className="id-hint">
          press <b>ENTER</b> to continue ·{" "}
          <button type="button" onClick={() => finish("")}>stay anonymous</button>
        </div>
      )}
      {result !== null && (
        <div className={`line ${result ? "ok" : "warn"}`}>
          {result ? `[ 0.090017] Identity confirmed: ${result.toUpperCase()} ✓` : "[ 0.090017] Anonymous session — access level: GUEST"}
        </div>
      )}
    </div>
  );
}
