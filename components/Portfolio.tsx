"use client";

import { useCallback, useEffect, useState } from "react";
import type { Content } from "@/lib/content";
import Boot from "./Boot";
import Laptop from "./Laptop";
import Instructions from "./Instructions";
import TerminalWindow from "./terminal/TerminalWindow";
import Landing from "./landing/Landing";

type Stage = "boot" | "laptop" | "instructions" | "site";

export default function Portfolio({ content }: { content: Content }) {
  const [stage, setStage] = useState<Stage>(content.intro.enabled ? "boot" : "site");
  const [term, setTerm] = useState<"closed" | "open" | "min">("closed");

  // Returning visitors in the same tab skip the intro
  useEffect(() => {
    try {
      if (sessionStorage.getItem("intro-seen") === "1") setStage("site");
    } catch {}
  }, []);

  const toLaptop = useCallback(() => setStage("laptop"), []);
  const toInstr = useCallback(() => setStage("instructions"), []);
  const toSite = useCallback(() => {
    try { sessionStorage.setItem("intro-seen", "1"); } catch {}
    setStage("site");
  }, []);
  const replay = useCallback(() => {
    try { sessionStorage.removeItem("intro-seen"); } catch {}
    setTerm("closed");
    setStage("boot");
  }, []);
  const openTerm = useCallback(() => setTerm("open"), []);
  const closeTerm = useCallback(() => setTerm("closed"), []);
  const minTerm = useCallback(() => setTerm("min"), []);

  return (
    <main className={`crt ${stage === "site" && term !== "open" ? "soft" : ""}`}>
      {stage === "boot" && <Boot content={content} onDone={toLaptop} />}
      {stage === "laptop" && <Laptop content={content} onDone={toInstr} />}
      {stage === "instructions" && <Instructions content={content} onDone={toSite} />}
      {stage === "site" && <Landing content={content} onTerminal={openTerm} onReplay={replay} />}

      {term !== "closed" && (
        <TerminalWindow
          content={content}
          minimized={term === "min"}
          onClose={closeTerm}
          onMinimize={minTerm}
          onRestore={openTerm}
        />
      )}

      {stage !== "site" && (
        <button className="skip-btn" onClick={toSite}>
          skip intro »
        </button>
      )}
    </main>
  );
}
