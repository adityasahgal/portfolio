import crypto from "crypto";
import { cookies } from "next/headers";

export const COOKIE = "admin_session";
const TTL = 60 * 60 * 24 * 7; // 7 days

const secret = () => process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "";
const sign = (v: string) => crypto.createHmac("sha256", secret()).update(v).digest("hex");
const sha = (s: string) => crypto.createHash("sha256").update(s).digest();

export const authConfigured = () => Boolean(process.env.ADMIN_PASSWORD);

export function checkPassword(input: string) {
  const pw = process.env.ADMIN_PASSWORD;
  return Boolean(pw) && crypto.timingSafeEqual(sha(input), sha(pw!));
}

export function createToken() {
  const exp = String(Date.now() + TTL * 1000);
  return `${exp}.${sign(exp)}`;
}

function verifyToken(token?: string) {
  if (!token || !secret()) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(exp));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function isAdmin() {
  return verifyToken((await cookies()).get(COOKIE)?.value);
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: TTL,
};
