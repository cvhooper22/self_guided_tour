import { eq } from "drizzle-orm";
import { z } from "zod";
import { handle } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { db, schema } from "@/db/client";
import { getTourById } from "@/lib/tours-repo";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle(async (_r: Request, ctx: Ctx) => {
  await requireAdmin();
  return (await getTourById((await ctx.params).id)) ?? Response.json({ error: "Not found" }, { status: 404 });
});

// Admin lifecycle actions: unpublish, restore from soft delete, soft delete.
export const POST = handle(async (req: Request, ctx: Ctx) => {
  const s = await requireAdmin();
  const { id } = await ctx.params;
  const { action } = z.object({ action: z.enum(["unpublish", "publish", "delete", "restore"]) }).parse(await req.json());
  const set = {
    unpublish: { status: "draft" as const },
    publish: { status: "published" as const },
    delete: { deletedAt: Date.now(), status: "draft" as const },
    restore: { deletedAt: null },
  }[action];
  await db.update(schema.tours).set(set).where(eq(schema.tours.id, id));
  await audit(s, `admin.tour.${action}`, "tour", id);
  return { ok: true };
});
