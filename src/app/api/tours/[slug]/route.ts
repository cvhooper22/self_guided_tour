import { handle } from "@/lib/api";
import { getSession, realAdminId } from "@/lib/auth";
import { getTourBySlug } from "@/lib/tours-repo";

// Full bundle consumed by the client-only player (/play/[slug]).
export const GET = handle(async (_req: Request, ctx: { params: Promise<{ slug: string }> }) => {
  const { slug } = await ctx.params;
  const s = await getSession();
  const bundle = await getTourBySlug(slug, s ? { uid: s.uid, isAdmin: !!realAdminId(s) } : null);
  if (!bundle) return Response.json({ error: "Tour not found" }, { status: 404 });
  return bundle;
});
