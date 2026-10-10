"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Content } from "@/lib/content";
import { sfx, stopAll } from "@/lib/sfx";
import { fingerprint, readVisitor, saveVisitor } from "@/lib/visitor";
import Boot from "./Boot";
import Gate from "./Gate";
import SoundToggle from "./SoundToggle";
import Identify from "./Identify";
import Laptop from "./Laptop";
import Instructions from "./Instructions";
import TerminalWindow from "./terminal/TerminalWindow";
import Landing from "./landing/Landing";

type Stage = "gate" | "boot" | "identify" | "laptop" | "instructions" | "site";

export default function Portfolio({ content }: { content: Content }) {
  const [stage, setStage] = useState<Stage>(!content.intro.enabled ? "site" : content.intro.sound ? "gate" : "boot");
  const [term, setTerm] = useState<"closed" | "open" | "min">("closed");
  const [visitor, setVisitor] = useState<string | null>(null); // null = not asked yet
  const [fp, setFp] = useState<Record<string, string>>({});
  const vars = useMemo(() => ({ ...fp, visitor: visitor ?? "" }), [fp, visitor]);

  // Returning visitors in the same tab skip the intro
  useEffect(() => {
    setVisitor(readVisitor());
    setFp(fingerprint());
    try {
      if (sessionStorage.getItem("intro-seen") === "1") setStage("site");
    } catch {}
  }, []);

  const toBoot = useCallback(() => setStage("boot"), []);
  const afterBoot = useCallback(
    () => setStage(content.intro.askName && visitor === null ? "identify" : "laptop"),
    [content.intro.askName, visitor]
  );
  const identified = useCallback((name: string) => {
    saveVisitor(name);
    setVisitor(name);
    setStage("laptop");
  }, []);
  const toInstr = useCallback(() => setStage("instructions"), []);
  const toSite = useCallback(() => {
    stopAll(); // leaving (or skipping) the intro silences anything still playing from it
    try { sessionStorage.setItem("intro-seen", "1"); } catch {}
    setStage("site");
  }, []);
  const replay = useCallback(() => {
    try { sessionStorage.removeItem("intro-seen"); } catch {}
    setTerm("closed");
    stopAll();
    setStage("boot");
    sfx.boot();
  }, []);
  const termRef = useRef(term);
  termRef.current = term;
  const openTerm = useCallback(() => {
    if (termRef.current === "min") sfx.restore();
    else if (termRef.current === "closed") sfx.open();
    setTerm("open");
  }, []);
  const closeTerm = useCallback(() => setTerm("closed"), []);
  const minTerm = useCallback(() => {
    if (termRef.current === "open") sfx.minimize();
    setTerm("min");
  }, []);

  return (
    <main className={`crt ${stage === "site" && term !== "open" ? "soft" : ""}`}>
      {stage === "gate" && <Gate onDone={toBoot} />}
      {stage === "boot" && <Boot content={content} vars={vars} onDone={afterBoot} />}
      {stage === "identify" && <Identify content={content} onDone={identified} />}
      {stage === "laptop" && <Laptop content={content} vars={vars} onDone={toInstr} />}
      {stage === "instructions" && <Instructions content={content} vars={vars} onDone={toSite} />}
      {stage === "site" && <Landing content={content} visitor={visitor ?? ""} onTerminal={openTerm} onReplay={replay} />}

      {term !== "closed" && (
        <TerminalWindow
          content={content}
          visitor={visitor ?? ""}
          minimized={term === "min"}
          onClose={closeTerm}
          onMinimize={minTerm}
          onRestore={openTerm}
        />
      )}

      {content.intro.sound && stage !== "gate" && <SoundToggle />}

      {stage !== "site" && (
        <button className="skip-btn" onClick={toSite}>
          skip intro »
        </button>
      )}
    </main>
  );
}
