// Edge-safe subset of auth (no next/headers, no DB) for use in proxy.ts.
import { jwtVerify } from "jose";

export const COOKIE = "tour_session";
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET ?? "dev-only-secret-change-me-please-32chars");

export async function verifySession(token?: string): Promise<{ uid: string; role: string; adminId?: string } | null> {
  if (!token) return null;
  try {
    return (await jwtVerify(token, secret())).payload as never;
  } catch {
    return null;
  }
}
