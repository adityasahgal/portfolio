"use client";

import { useEffect, useState } from "react";
import { sfx, unlock } from "@/lib/sfx";

/** "Press any key" screen — the user gesture browsers require before audio can play. */
export default function Gate({ onDone }: { onDone: () => void }) {
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const go = () => {
      if (gone) return;
      setGone(true);
      unlock();
      // give the AudioContext a tick to resume before the first sound
      setTimeout(() => {
        sfx.boot();
        onDone();
      }, 60);
    };
    window.addEventListener("keydown", go);
    window.addEventListener("pointerdown", go);
    return () => {
      window.removeEventListener("keydown", go);
      window.removeEventListener("pointerdown", go);
    };
  }, [gone, onDone]);

  return (
    <div className="gate">
      <div className="gate-box">
        <div className="gate-title">SECURE TERMINAL v4.2</div>
        <div className="gate-press">[ PRESS ANY KEY OR CLICK TO INITIALIZE ]</div>
        <div className="gate-hint">🔊 best experienced with sound on</div>
      </div>
    </div>
  );
}
