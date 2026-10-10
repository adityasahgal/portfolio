import { NextResponse } from "next/server";
import { COOKIE, authConfigured, checkPassword, cookieOptions, createToken } from "@/lib/auth";

// POST = login, DELETE = logout
export async function POST(req: Request) {
  if (!authConfigured()) {
    return NextResponse.json({ error: "ADMIN_PASSWORD is not set on the server." }, { status: 503 });
  }
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (typeof password !== "string" || !checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 800)); // slow down brute force
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, createToken(), cookieOptions);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return res;
}
