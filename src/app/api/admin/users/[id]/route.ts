import { eq } from "drizzle-orm";
import { z } from "zod";
import { handle } from "@/lib/api";
import { HttpError, requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { db, schema } from "@/db/client";

export const PATCH = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const s = await requireAdmin();
  const { id } = await ctx.params;
  const { role } = z.object({ role: z.enum(["traveler", "operator", "admin"]) }).parse(await req.json());
  if (id === (s.adminId ?? s.uid) && role !== "admin") throw new HttpError(400, "You can't remove your own admin role");
  await db.update(schema.users).set({ role }).where(eq(schema.users.id, id));
  await audit(s, "admin.user.role", "user", id, { role });
  return { ok: true };
});
