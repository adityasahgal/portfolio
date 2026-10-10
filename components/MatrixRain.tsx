"use client";

import { useEffect, useRef } from "react";
import { themeRgb } from "./landing/themeColor";

export default function MatrixRain() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const A = themeRgb("--acc", "#3d8bff");
    const BG = themeRgb("--bg", "#070b1f");
    const chars = "アカサタナハマヤラワ01ABCDEF<>/{}[]$#@%&*ガザダバパ";
    const size = 16;
    let cols = 0;
    let drops: number[] = [];
    let raf = 0;
    let last = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      cols = Math.ceil(canvas.width / size);
      drops = Array.from({ length: cols }, () => Math.random() * -50);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = (ts: number) => {
      raf = requestAnimationFrame(draw);
      if (ts - last < 50) return;
      last = ts;
      ctx.fillStyle = `rgba(${BG},0.12)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${size}px monospace`;
      for (let i = 0; i < cols; i++) {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        const y = drops[i] * size;
        ctx.fillStyle = Math.random() > 0.975 ? "#f3f6ff" : `rgb(${A})`;
        ctx.fillText(ch, i * size, y);
        if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="matrix" aria-hidden />;
}
