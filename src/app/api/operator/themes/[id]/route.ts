import { eq } from "drizzle-orm";
import { z } from "zod";
import { handle } from "@/lib/api";
import { HttpError, realAdminId, requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { db, schema } from "@/db/client";
import { themeTokensSchema } from "@/lib/themes";

export const PUT = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const s = await requireRole("operator", "admin");
  const [t] = await db.select().from(schema.themes).where(eq(schema.themes.id, id));
  if (!t) throw new HttpError(404, "Theme not found");
  const admin = !!realAdminId(s);
  if (!admin && (t.isPreset || t.ownerId !== s.uid)) throw new HttpError(403, "Presets and other people's themes are read-only; clone it first");
  const b = z.object({ name: z.string().min(1).max(80), tokens: z.record(z.string(), z.unknown()) }).parse(await req.json());
  themeTokensSchema.parse(b.tokens);
  await db.update(schema.themes).set(b).where(eq(schema.themes.id, id));
  await audit(s, "theme.update", "theme", id);
  return { ok: true };
});
