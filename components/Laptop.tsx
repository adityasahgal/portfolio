"use client";

import { useEffect, useRef, useState } from "react";
import { Content, fill } from "@/lib/content";
import { sfx, stopAll } from "@/lib/sfx";

const SKULL = String.raw`
        ______
     .-"      "-.
    /            \
   |              |
   |,  .-.  .-.  ,|
   | )(__/  \__)( |
   |/     /\     \|
   (_     ^^     _)
    \__|IIIIII|__/
     | \IIIIII/ |
     \          /
      '--------'`;

export default function Laptop({ content, vars, onDone }: { content: Content; vars: Record<string, string>; onDone: () => void }) {
  const { intro, profile } = content;
  const welcome = fill(intro.welcome, profile, vars);
  const helloText = fill(intro.hello, profile, vars).toUpperCase();
  // Greet the visitor first (name if known, otherwise time-of-day + "operator"), then the welcome headline
  const [hello, setHello] = useState(Boolean(intro.hello));
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    if (!hello) return;
    const t = setTimeout(() => setHello(false), 4300);
    return () => clearTimeout(t);
  }, [hello]);

  // Scheduled on the audio clock to match the CSS: lid opens 0.4s→2.0s, screen powers on at 1.9s,
  // text is readable once the 0.5s screen-on animation ends (~2.4s)
  useEffect(() => {
    sfx.lid(0.4, 1.6);
    sfx.powerOn(1.9);
    const t = setTimeout(() => (hello ? sfx.granted() : sfx.blip()), 2400);
    return () => {
      clearTimeout(t);
      stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!hello) sfx.blip();
  }, [hello]);

  const go = () => {
    if (zoom) return;
    setZoom(true);
    stopAll(); // cut the lid/power-on sounds if the visitor connects early
    sfx.whoosh();
    setTimeout(onDone, 1050);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") go();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);

  return (
    <div className={`laptop-stage ${zoom ? "zoom" : ""}`}>
      <div className="laptop">
        <div className="lid">
          <div className="screen">
            <pre className="skull">{SKULL}</pre>
            {hello ? (
              <div key="hello" className="welcome glitch swap" data-text={helloText}>
                {helloText}
              </div>
            ) : (
              <div key="welcome" className="swap">
                <div className="welcome glitch" data-text={welcome}>
                  {welcome}
                </div>
                {intro.subtitle && <div className="sub">{fill(intro.subtitle, profile, vars)}</div>}
              </div>
            )}
            <button className="enter" onClick={go}>
              {intro.button || "[ ENTER ]"}
            </button>
          </div>
        </div>
        <div className="base" />
      </div>
    </div>
  );
}
