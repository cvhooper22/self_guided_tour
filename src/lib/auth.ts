import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT } from "jose";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import type { Role } from "@/db/schema";

// Mock auth: sign in by email. Everything goes through this module so real auth can replace it.
import { COOKIE, verifySession as verifyToken } from "./auth-edge";
export { COOKIE };
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET ?? "dev-only-secret-change-me-please-32chars");

export type Session = {
  uid: string;
  name: string;
  role: Role;
  /** Set when an admin is viewing the app as another user. */
  adminId?: string;
};

export async function signSession(s: Session): Promise<string> {
  return new SignJWT({ ...s }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(secret());
}

export const verifySession = verifyToken as (token?: string) => Promise<Session | null>;

export async function getSession(): Promise<Session | null> {
  return verifySession((await cookies()).get(COOKIE)?.value);
}

export async function setSession(s: Session) {
  (await cookies()).set(COOKIE, await signSession(s), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

/** Real admin identity, even while impersonating. */
export const realAdminId = (s: Session | null) => (s?.adminId ?? (s?.role === "admin" ? s.uid : null));

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function requireRole(...roles: Role[]): Promise<Session> {
  const s = await getSession();
  if (!s) throw new HttpError(401, "Sign in required");
  const isRealAdmin = !!realAdminId(s);
  if (roles.includes(s.role) || (roles.includes("admin") && isRealAdmin)) return s;
  throw new HttpError(403, "Forbidden");
}

export async function requireAdmin(): Promise<Session> {
  const s = await getSession();
  if (!s) throw new HttpError(401, "Sign in required");
  if (!realAdminId(s)) throw new HttpError(403, "Forbidden");
  return s;
}

/** Operators may edit own tours; admins (even when impersonating) may edit anything. */
export async function canEditTour(s: Session, tourId: string): Promise<boolean> {
  if (realAdminId(s)) return true;
  const [t] = await db.select({ ownerId: schema.tours.ownerId }).from(schema.tours).where(eq(schema.tours.id, tourId));
  return !!t && t.ownerId === s.uid && s.role === "operator";
}

/** Passcode gate so mock login can't hand out operator/admin on a public deployment. */
export function passcodeOk(role: Role, passcode?: string): boolean {
  if (role === "traveler" || process.env.NODE_ENV !== "production") return true;
  return !!process.env.ADMIN_PASSCODE && passcode === process.env.ADMIN_PASSCODE;
}

/** For server components: bounce non-admins. Don't rely on layouts for this; call it in each admin page. */
export async function assertAdminPage(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/login?next=/admin");
  if (!realAdminId(s)) redirect("/");
  return s;
}
