/** Read a theme colour token from <html> as an "r,g,b" string for canvas drawing. */
export function themeRgb(name: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  const n = parseInt(v.replace("#", ""), 16);
  return Number.isNaN(n) ? "0,255,136" : `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}
