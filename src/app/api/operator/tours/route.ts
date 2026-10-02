import { z } from "zod";
import { handle } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { createTour, listToursForOwner } from "@/lib/tours-repo";

export const GET = handle(async () => listToursForOwner((await requireRole("operator", "admin")).uid));

export const POST = handle(async (req: Request) => {
  const s = await requireRole("operator", "admin");
  const { title } = z.object({ title: z.string().min(1).max(120) }).parse(await req.json());
  const t = await createTour(s.uid, title);
  await audit(s, "tour.create", "tour", t.id, { title });
  return t;
});
