import { eq } from "drizzle-orm";
import { handle } from "@/lib/api";
import { HttpError, canEditTour, requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getTourById, saveTourDoc, tourDocSchema } from "@/lib/tours-repo";
import { db, schema } from "@/db/client";

type Ctx = { params: Promise<{ id: string }> };

async function authorize(id: string) {
  const s = await requireRole("operator", "admin");
  if (!(await canEditTour(s, id))) throw new HttpError(403, "Not your tour");
  return s;
}

export const GET = handle(async (_r: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  await authorize(id);
  const b = await getTourById(id);
  if (!b) throw new HttpError(404, "Tour not found");
  return b;
});

export const PUT = handle(async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const s = await authorize(id);
  const doc = tourDocSchema.parse(await req.json());
  try {
    await saveTourDoc(id, doc);
  } catch (e) {
    throw new HttpError(400, e instanceof Error ? e.message : "Save failed");
  }
  await audit(s, "tour.save", "tour", id, { stops: doc.stops.length, routes: doc.routes.length });
  return { ok: true };
});

export const DELETE = handle(async (_r: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const s = await authorize(id);
  await db.update(schema.tours).set({ deletedAt: Date.now(), status: "draft" }).where(eq(schema.tours.id, id));
  await audit(s, "tour.delete", "tour", id);
  return { ok: true };
});
