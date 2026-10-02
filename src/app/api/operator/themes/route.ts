import { z } from "zod";
import { handle } from "@/lib/api";
import { requireRole, realAdminId } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { listThemesFor } from "@/lib/tours-repo";
import { db, schema } from "@/db/client";
import { THEME_SCHEMA_VERSION, themeTokensSchema } from "@/lib/themes";

export const GET = handle(async () => {
  const s = await requireRole("operator", "admin");
  return listThemesFor(s.uid, !!realAdminId(s));
});

export const POST = handle(async (req: Request) => {
  const s = await requireRole("operator", "admin");
  const b = z.object({ name: z.string().min(1).max(80), tokens: z.record(z.string(), z.unknown()) }).parse(await req.json());
  themeTokensSchema.parse(b.tokens); // reject malformed values, but store the author's raw tokens
  const [t] = await db.insert(schema.themes).values({ ownerId: s.uid, name: b.name, tokens: b.tokens, schemaVersion: THEME_SCHEMA_VERSION }).returning();
  await audit(s, "theme.create", "theme", t.id, { name: b.name });
  return t;
});
