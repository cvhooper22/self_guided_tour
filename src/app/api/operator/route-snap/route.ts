import { z } from "zod";
import { handle } from "@/lib/api";
import { HttpError, requireRole } from "@/lib/auth";
import { ORS_MAX_POINTS, SnapError, snapToStreets } from "@/lib/ors";

const body = z.object({
  points: z.array(z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)])).min(2).max(ORS_MAX_POINTS),
  /** Room left in the saved path for the snapped section (a route holds at most 500 points). */
  maxPoints: z.number().int().min(2).max(500).default(400),
});

/** Operator-only proxy so the ORS key never reaches the browser. Nothing is stored here; the editor applies the result. */
export const POST = handle(async (req: Request) => {
  await requireRole("operator", "admin");
  const { points, maxPoints } = body.parse(await req.json());
  try {
    return { path: await snapToStreets(points, { maxPoints }) };
  } catch (e) {
    if (e instanceof SnapError) throw new HttpError(e.status, e.message);
    throw e;
  }
});
