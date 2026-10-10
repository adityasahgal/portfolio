import type { Metadata, Viewport } from "next";
import { onColor } from "@/lib/content";
import { getContent } from "@/lib/store";
import "./globals.css";
import "./landing.css";

export async function generateMetadata(): Promise<Metadata> {
  const { profile } = await getContent();
  const name = profile.name.charAt(0) + profile.name.slice(1).toLowerCase();
  return { title: `${name} — ${profile.role}`, description: profile.tagline };
}

export async function generateViewport(): Promise<Viewport> {
  return { themeColor: (await getContent()).theme.bg };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { theme } = await getContent();
  // Theme colours come from the CMS and drive every colour token in the CSS
  const vars = {
    "--bg": theme.bg,
    "--acc": theme.accent,
    "--acc2": theme.accent2,
    "--acc3": theme.accent3,
    "--warm": theme.warm,
    "--on-acc": onColor(theme.accent),
  } as React.CSSProperties;

  return (
    <html lang="en" style={vars}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;700&family=VT323&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
