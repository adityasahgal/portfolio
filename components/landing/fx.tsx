"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const GLYPHS = "!<>-_\\/[]{}=+*^?#$%&01ABCDEF";

/** Text that "decrypts" itself on mount and on hover. */
export function Scramble({ text, delay = 0, className }: { text: string; delay?: number; className?: string }) {
  const [out, setOut] = useState(text);
  const raf = useRef(0);

  const run = useCallback(() => {
    cancelAnimationFrame(raf.current);
    let frame = 0;
    const tick = () => {
      frame++;
      const revealed = Math.floor(frame / 3) - 3;
      setOut(
        text
          .split("")
          .map((ch, i) => (ch === " " || i < revealed ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
          .join("")
      );
      if (revealed < text.length) raf.current = requestAnimationFrame(tick);
      else setOut(text);
    };
    raf.current = requestAnimationFrame(tick);
  }, [text]);

  useEffect(() => {
    const t = setTimeout(run, delay);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf.current);
    };
  }, [run, delay]);

  return (
    <span className={className} data-text={text} onMouseEnter={run}>
      {out}
    </span>
  );
}

/** Types through a list of phrases, deleting and retyping. */
export function Typer({ words }: { words: string[] }) {
  const [i, setI] = useState(0);
  const [n, setN] = useState(0);
  const [del, setDel] = useState(false);
  const word = words.length ? words[i % words.length] : "";

  useEffect(() => {
    if (!word) return;
    let t: ReturnType<typeof setTimeout>;
    if (!del && n < word.length) t = setTimeout(() => setN(n + 1), 55);
    else if (!del) t = setTimeout(() => setDel(true), 1900);
    else if (n > 0) t = setTimeout(() => setN(n - 1), 26);
    else t = setTimeout(() => { setDel(false); setI(i + 1); }, 250);
    return () => clearTimeout(t);
  }, [word, n, del, i]);

  return (
    <>
      {word.slice(0, n)}
      <span className="caret" />
    </>
  );
}

/** Counts the leading number of a value ("20+") up when scrolled into view. */
export function Counter({ value }: { value: string }) {
  const m = /^(\d+)(.*)$/.exec(value);
  const ref = useRef<HTMLSpanElement>(null);
  const [v, setV] = useState(m ? `0${m[2]}` : value);

  useEffect(() => {
    if (!m) return setV(value);
    const target = Number(m[1]);
    const suffix = m[2];
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / 1400);
        setV(Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    io.observe(ref.current!);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span ref={ref}>{v}</span>;
}

/** Mouse handlers that feed --mx/--my (glow) and --rx/--ry (3D tilt) CSS vars. */
export const tilt = {
  onMouseMove(e: React.MouseEvent<HTMLElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    const s = e.currentTarget.style;
    s.setProperty("--mx", `${x * 100}%`);
    s.setProperty("--my", `${y * 100}%`);
    s.setProperty("--rx", `${(0.5 - y) * 7}deg`);
    s.setProperty("--ry", `${(x - 0.5) * 9}deg`);
  },
  onMouseLeave(e: React.MouseEvent<HTMLElement>) {
    e.currentTarget.style.setProperty("--rx", "0deg");
    e.currentTarget.style.setProperty("--ry", "0deg");
  },
};
