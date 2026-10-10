"use client";

import { useEffect, useState } from "react";
import { isMuted, setMuted } from "@/lib/sfx";

export default function SoundToggle() {
  const [muted, set] = useState(false);
  useEffect(() => set(isMuted()), []);

  return (
    <button
      className="sound-btn"
      onClick={(e) => {
        e.stopPropagation();
        setMuted(!muted);
        set(!muted);
      }}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label={muted ? "Unmute sound" : "Mute sound"}
      title={muted ? "Sound off" : "Sound on"}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
