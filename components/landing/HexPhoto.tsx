"use client";

import { useEffect, useRef, useState } from "react";
import { themeRgb } from "./themeColor";

const HEX = "0123456789ABCDEF";
const CELL = 8; // px per hex glyph

/**
 * Renders the photo only as a live grid of hex digits (brightness → glyph opacity).
 * The real image is never placed in the page.
 */
export default function HexPhoto({ src, alt }: { src: string; alt: string }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [hexOk, setHexOk] = useState(true);

  useEffect(() => {
    const canvas = cv.current!;
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.crossOrigin = "anonymous";
    let lum: Float32Array | null = null;
    let cols = 0, rows = 0, w = 0, h = 0, timer = 0;
    const A = themeRgb("--acc", "#2bd67b");

    const sample = () => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !img.naturalWidth) return;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / CELL); rows = Math.ceil(h / CELL);
      // cover-fit the image into a cols×rows buffer, one pixel per glyph
      const off = document.createElement("canvas");
      off.width = cols; off.height = rows;
      const o = off.getContext("2d")!;
      const s = Math.max(cols / img.naturalWidth, rows / img.naturalHeight);
      const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
      o.drawImage(img, (cols - dw) / 2, (rows - dh) * 0.2, dw, dh);
      try {
        const d = o.getImageData(0, 0, cols, rows).data;
        lum = new Float32Array(cols * rows);
        let lo = 1, hi = 0;
        for (let i = 0; i < lum.length; i++) {
          const v = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255;
          lum[i] = v;
          lo = Math.min(lo, v);
          hi = Math.max(hi, v);
        }
        // stretch contrast so the face reads clearly in glyphs
        const span = Math.max(0.05, hi - lo);
        for (let i = 0; i < lum.length; i++) lum[i] = (lum[i] - lo) / span;
      } catch {
        setHexOk(false); // cross-origin image without CORS — show a placeholder, never the photo
      }
    };

    const draw = () => {
      if (!lum) return;
      ctx.clearRect(0, 0, w, h);
      ctx.font = `bold ${CELL + 1}px "JetBrains Mono", monospace`;
      ctx.textBaseline = "top";
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const l = lum[y * cols + x];
          if (l < 0.06) continue;
          ctx.fillStyle = `rgba(${A},${Math.min(1, 0.15 + l * 1.05)})`;
          ctx.fillText(HEX[(Math.random() * 16) | 0], x * CELL, y * CELL);
        }
      }
    };

    img.onload = () => {
      sample();
      draw();
      timer = window.setInterval(draw, 140);
    };
    img.onerror = () => setHexOk(false);
    img.src = src;

    const ro = new ResizeObserver(() => { sample(); draw(); });
    ro.observe(canvas);
    return () => {
      clearInterval(timer);
      ro.disconnect();
    };
  }, [src]);

  return (
    <div className="hexphoto" role="img" aria-label={alt}>
      {hexOk ? <canvas ref={cv} className="hexcv" /> : <span className="hex-fail">0x{"█".repeat(6)}</span>}
      <span className="hex-tag">ENCRYPTED</span>
    </div>
  );
}
