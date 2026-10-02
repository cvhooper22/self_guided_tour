import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { handle } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { db, schema } from "@/db/client";

export const GET = handle(async (req: Request) => {
  const s = await getSession();
  const tourId = new URL(req.url).searchParams.get("tourId");
  if (!s || !tourId) return { visitedStopIds: [] };
  const [p] = await db.select().from(schema.progress).where(and(eq(schema.progress.userId, s.uid), eq(schema.progress.tourId, tourId)));
  return { visitedStopIds: p?.visitedStopIds ?? [] };
});

export const PUT = handle(async (req: Request) => {
  const s = await getSession();
  if (!s) return { ok: false };
  const b = z.object({ tourId: z.string(), visitedStopIds: z.array(z.string()) }).parse(await req.json());
  await db.insert(schema.progress).values({ userId: s.uid, ...b }).onConflictDoUpdate({ target: [schema.progress.userId, schema.progress.tourId], set: { visitedStopIds: b.visitedStopIds } });
  return { ok: true };
});
