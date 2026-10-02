import { eq } from "drizzle-orm";
import { z } from "zod";
import { handle } from "@/lib/api";
import { HttpError, getSession, requireAdmin, setSession } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { db, schema } from "@/db/client";

// "View as": the session keeps adminId so admin powers and the audit trail survive.
export const POST = handle(async (req: Request) => {
  const s = await requireAdmin();
  const { userId } = z.object({ userId: z.string() }).parse(await req.json());
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
  if (!u) throw new HttpError(404, "User not found");
  const adminId = s.adminId ?? s.uid;
  await setSession({ uid: u.id, name: u.name, role: u.role, adminId });
  await audit(s, "admin.impersonate.start", "user", u.id);
  return { ok: true };
});

export const DELETE = handle(async () => {
  const s = await getSession();
  if (!s?.adminId) throw new HttpError(400, "Not impersonating");
  const [a] = await db.select().from(schema.users).where(eq(schema.users.id, s.adminId));
  await setSession({ uid: a.id, name: a.name, role: a.role });
  await audit({ ...s, adminId: undefined, uid: a.id }, "admin.impersonate.stop", "user", s.uid);
  return { ok: true };
});
