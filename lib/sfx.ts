// Synthesised sound effects (Web Audio API — no audio files).
// Browsers only allow audio after a user gesture, so call unlock() from a click/keypress first.

const MUTE_KEY = "sfx-muted";
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let muted = false;
let lastKey = 0;
// Every scheduled sound, so it can be cut the moment its on-screen event ends
const live = new Set<AudioScheduledSourceNode>();
const track = (n: AudioScheduledSourceNode) => {
  live.add(n);
  n.onended = () => live.delete(n);
};

try {
  muted = typeof localStorage !== "undefined" && localStorage.getItem(MUTE_KEY) === "1";
} catch {}

const ready = () => Boolean(ctx && master && !muted && ctx.state === "running");

export function unlock() {
  if (typeof window === "undefined") return;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // Pause audio while the tab is hidden so sounds never play detached from the visuals
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopAll();
      void (document.hidden ? ctx!.suspend() : ctx!.resume());
    });
  }
  if (ctx.state === "suspended") void ctx.resume();
}

/** Cut every sound that is playing or scheduled. */
export function stopAll() {
  live.forEach((n) => { try { n.stop(); } catch {} });
  live.clear();
}

export const isMuted = () => muted;
export function setMuted(m: boolean) {
  muted = m;
  if (m) stopAll();
  try { localStorage.setItem(MUTE_KEY, m ? "1" : "0"); } catch {}
  if (!m) unlock();
}

function tone(freq: number, dur: number, type: OscillatorType = "square", vol = 0.12, at = 0, slideTo?: number) {
  if (!ready()) return;
  const t = ctx!.currentTime + at;
  const o = ctx!.createOscillator();
  const g = ctx!.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master!);
  track(o);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function burst(dur: number, vol: number, hp: number, at = 0) {
  if (!ready() || !noise) return;
  const t = ctx!.currentTime + at;
  const src = ctx!.createBufferSource();
  src.buffer = noise;
  const f = ctx!.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = hp;
  const g = ctx!.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master!);
  track(src);
  src.start(t, Math.random() * 0.5, dur + 0.02);
}

let drive: Float32Array | null = null;

type Pitch = (p: AudioParam, base: number, t: number, dur: number) => void;

/** One overdriven siren voice-stack. `pitch` shapes how each voice moves over the blast. */
function siren(at: number, dur: number, voices: [number, OscillatorType][], pitch: Pitch, vol = 0.16, cutoff = 2400) {
  if (!ready()) return;
  const c = ctx!;
  const t = c.currentTime + at;
  if (!drive) {
    drive = new Float32Array(1024);
    for (let i = 0; i < drive.length; i++) {
      const x = (i / (drive.length - 1)) * 2 - 1;
      drive[i] = Math.tanh(x * 6);
    }
  }
  const shaper = c.createWaveShaper();
  shaper.curve = drive as Float32Array<ArrayBuffer>;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = cutoff;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.setValueAtTime(vol, t + dur - 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  shaper.connect(lp).connect(g).connect(master!);
  voices.forEach(([f, type]) => {
    const osc = c.createOscillator();
    osc.type = type;
    pitch(osc.frequency, f, t, dur);
    osc.connect(shaper);
    track(osc);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  });
}

// Pitch shapes
const sag: Pitch = (p, f, t, d) => {
  p.setValueAtTime(f, t);
  p.setValueAtTime(f, t + d * 0.75);
  p.exponentialRampToValueAtTime(f * 0.86, t + d);
};
const whoop: Pitch = (p, f, t, d) => {
  p.setValueAtTime(f, t);
  p.exponentialRampToValueAtTime(f * 2.6, t + d);
};
const wail: Pitch = (p, f, t, d) => {
  p.setValueAtTime(f, t);
  p.exponentialRampToValueAtTime(f * 3.2, t + d * 0.5);
  p.exponentialRampToValueAtTime(f * 1.1, t + d);
};
const flat: Pitch = (p, f, t) => p.setValueAtTime(f, t);

export const ALARM_STYLES = {
  klaxon: "Klaxon — TOON · TOOOON · TOON",
  redalert: "Red Alert — rising WOOP WOOP",
  airraid: "Air-Raid Siren — long rise and fall",
  beeper: "Breach Beeper — fast high-tech beeps",
  custom: "Custom — your uploaded sound",
} as const;
export type AlarmStyle = keyof typeof ALARM_STYLES;

/** On/off windows (seconds) for each style — the red flash in Boot follows these exactly. */
export const ALARM_PATTERN: Record<Exclude<AlarmStyle, "custom">, [number, number][]> = {
  klaxon: [[0, 0.28], [0.4, 1.1], [1.22, 1.5]],
  redalert: [[0, 0.45], [0.55, 1.0], [1.1, 1.55]],
  airraid: [[0, 2.0]],
  beeper: Array.from({ length: 8 }, (_, i) => [i * 0.18, i * 0.18 + 0.09] as [number, number]),
};

const customBuffers = new Map<string, Promise<AudioBuffer | null>>();
/** Fetch + decode an uploaded alarm ahead of time so it fires exactly on cue. */
export function preloadAlarm(url: string) {
  if (!url || !ctx || customBuffers.has(url)) return;
  customBuffers.set(
    url,
    fetch(url)
      .then((r) => r.arrayBuffer())
      .then((b) => ctx!.decodeAudioData(b))
      .catch(() => null)
  );
}

export const sfx = {
  /** Power-up hum when the system boots. */
  boot() {
    tone(55, 1.4, "sawtooth", 0.08, 0, 220);
    tone(110, 1.2, "sine", 0.1, 0.05, 440);
    burst(0.6, 0.05, 400);
  },
  /** Short status beep for a log line; tone depends on severity. */
  line(kind: "ok" | "warn" | "err" = "ok") {
    const f = kind === "err" ? 220 : kind === "warn" ? 520 : 980;
    tone(f, 0.06, "square", 0.06);
    for (let i = 0; i < 3; i++) burst(0.018, 0.08, 2500, 0.02 + i * 0.035);
  },
  /** Mechanical keyboard click; rate-limited so fast typing doesn't turn into noise. */
  key() {
    const now = performance.now();
    if (now - lastKey < 55) return;
    lastKey = now;
    burst(0.022 + Math.random() * 0.012, 0.1 + Math.random() * 0.05, 1800 + Math.random() * 1600);
  },
  /** Access-granted alarm in the chosen style; custom plays an uploaded file (max 4s). */
  alarm(style: AlarmStyle = "klaxon", file = "") {
    if (style === "custom") {
      if (!file || !ready()) return;
      preloadAlarm(file);
      void customBuffers.get(file)!.then((buf) => {
        if (!buf || !ready()) return;
        const src = ctx!.createBufferSource();
        src.buffer = buf;
        const g = ctx!.createGain();
        g.gain.value = 0.9;
        src.connect(g).connect(master!);
        track(src);
        src.start(0, 0, Math.min(buf.duration, 4));
      });
      return;
    }
    const W = ALARM_PATTERN[style];
    if (style === "klaxon") W.forEach(([a, b]) => siren(a, b - a, [[392, "sawtooth"], [415, "sawtooth"], [196, "square"]], sag));
    if (style === "redalert") W.forEach(([a, b]) => siren(a, b - a, [[340, "sawtooth"], [345, "square"]], whoop, 0.14, 3200));
    if (style === "airraid") W.forEach(([a, b]) => siren(a, b - a, [[220, "sawtooth"], [222, "triangle"], [110, "square"]], wail, 0.13, 2600));
    if (style === "beeper") W.forEach(([a, b], i) => siren(a, b - a, [[i % 2 ? 1480 : 1860, "square"]], flat, 0.08, 5000));
  },
  /** Rising chime for "access granted" / identity confirmed. */
  granted() {
    tone(660, 0.1, "square", 0.07, 0);
    tone(990, 0.1, "square", 0.07, 0.1);
    tone(1320, 0.22, "square", 0.07, 0.2);
  },
  blip() {
    tone(1200, 0.05, "sine", 0.08);
  },
  /** Swoosh for zoom transitions. */
  whoosh() {
    if (!ready() || !noise) return;
    const t = ctx!.currentTime;
    const src = ctx!.createBufferSource();
    src.buffer = noise;
    const f = ctx!.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.setValueAtTime(300, t);
    f.frequency.exponentialRampToValueAtTime(3000, t + 0.9);
    const g = ctx!.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1);
    src.connect(f).connect(g).connect(master!);
    track(src);
    src.start(t, 0, 1.05);
  },
  /** Hinge servo while the laptop lid opens (matches the 1.6s lid animation after its 0.4s delay). */
  lid(at = 0.4, dur = 1.6) {
    tone(70, dur, "sawtooth", 0.035, at, 140);
    tone(140, dur * 0.8, "triangle", 0.03, at, 260);
    burst(0.05, 0.12, 900, at + dur - 0.05); // latch click as the lid settles
  },
  /** CRT power-on: thump + rising whine, timed to the screen switching on. */
  powerOn(at = 0) {
    tone(48, 0.35, "sine", 0.22, at, 30);
    burst(0.12, 0.09, 300, at);
    tone(3800, 0.5, "sine", 0.02, at + 0.05, 5200);
  },
  /** Typewriter carriage-return bell at the end of a typed line. */
  ding() {
    tone(1568, 0.25, "sine", 0.05);
    tone(2349, 0.18, "sine", 0.025, 0.01);
  },
  /** One progress step (hack command). */
  step(i: number) {
    tone(400 + i * 120, 0.08, "square", 0.06);
    burst(0.02, 0.08, 2500, 0.03);
  },
  // Terminal window events
  open() {
    tone(520, 0.08, "sine", 0.08);
    tone(880, 0.12, "sine", 0.08, 0.07);
  },
  close() {
    tone(880, 0.08, "sine", 0.07);
    tone(440, 0.14, "sine", 0.07, 0.07);
  },
  minimize() {
    tone(900, 0.3, "sine", 0.06, 0, 220);
  },
  restore() {
    tone(220, 0.3, "sine", 0.06, 0, 900);
  },
  tab() {
    tone(1400, 0.04, "square", 0.04);
  },
};
