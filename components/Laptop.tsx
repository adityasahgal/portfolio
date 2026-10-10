"use client";

import { useEffect, useState } from "react";
import { Content, fill } from "@/lib/content";

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

export default function Laptop({ content, onDone }: { content: Content; onDone: () => void }) {
  const { intro, profile } = content;
  const welcome = fill(intro.welcome, profile);
  const [zoom, setZoom] = useState(false);

  const go = () => {
    if (zoom) return;
    setZoom(true);
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
            <div className="welcome glitch" data-text={welcome}>
              {welcome}
            </div>
            {intro.subtitle && <div className="sub">{fill(intro.subtitle, profile)}</div>}
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
