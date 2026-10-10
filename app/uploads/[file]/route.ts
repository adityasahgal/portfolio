import { promises as fs } from "fs";
import path from "path";
import { UPLOAD_DIR } from "@/lib/store";

// Uploaded files live outside /public so they are served even after `next build`.
const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
};

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const m = /^[a-f0-9]{16}\.(jpg|png|webp|gif|pdf)$/.exec(file);
  if (!m) return new Response("Not found", { status: 404 });
  try {
    const buf = await fs.readFile(path.join(UPLOAD_DIR, file));
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": MIME[m[1]],
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
