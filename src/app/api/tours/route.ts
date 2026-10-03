import { handle } from "@/lib/api";
import { listPublishedTours } from "@/lib/tours-repo";

export const GET = handle(async (req: Request) => {
  const u = new URL(req.url);
  const rows = await listPublishedTours(u.searchParams.get("q") ?? undefined, u.searchParams.get("free") === "1", u.searchParams.get("tag") ?? undefined);
  return rows.map(({ tokens: _t, ...t }) => t);
});
