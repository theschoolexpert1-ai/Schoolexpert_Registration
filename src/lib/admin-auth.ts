import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "school-expert-admin";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("ADMIN_SESSION_SECRET must be at least 32 characters.");
  return value;
}

function sign(value: string) {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

export function createAdminToken() {
  const issued = Math.floor(Date.now() / 1000).toString();
  return `${issued}.${sign(issued)}`;
}

export function isValidAdminToken(token: string | undefined) {
  if (!token) return false;
  const [issued, signature] = token.split(".");
  if (!issued || !signature || !/^\d+$/.test(issued)) return false;
  const age = Math.floor(Date.now() / 1000) - Number(issued);
  if (age < 0 || age > SESSION_TTL_SECONDS) return false;
  const expected = sign(issued);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function verifyAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD is not configured.");
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function isAdminAuthenticated() {
  const store = await cookies();
  return isValidAdminToken(store.get(COOKIE_NAME)?.value);
}

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) throw new Error("ADMIN_UNAUTHORIZED");
}

export function adminCookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export { COOKIE_NAME };
