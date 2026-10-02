import { eq } from "drizzle-orm";
import { z } from "zod";
import { handle } from "@/lib/api";
import { HttpError, canEditTour, requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { db, schema } from "@/db/client";

export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const s = await requireRole("operator", "admin");
  if (!(await canEditTour(s, id))) throw new HttpError(403, "Not your tour");
  const { status } = z.object({ status: z.enum(["draft", "published"]) }).parse(await req.json());
  await db.update(schema.tours).set({ status }).where(eq(schema.tours.id, id));
  await audit(s, `tour.${status === "published" ? "publish" : "unpublish"}`, "tour", id);
  return { ok: true, status };
});
