import { notFound, redirect } from "next/navigation";
import { canEditTour, getSession } from "@/lib/auth";
import { getTourById, listThemesFor, type TourDoc } from "@/lib/tours-repo";
import { realAdminId } from "@/lib/auth";
import TourEditor from "@/components/editor/TourEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit tour" };

export default async function EditTour({ params }: PageProps<"/operator/tours/[id]">) {
  const { id } = await params;
  const s = await getSession();
  if (!s) redirect(`/login?next=/operator/tours/${id}`);
  if (!(await canEditTour(s, id))) notFound();
  const b = await getTourById(id);
  if (!b) notFound();
  const t = b.tour;
  const doc: TourDoc = {
    tour: { title: t.title, slug: t.slug, summary: t.summary, story: t.story, coverUrl: t.coverUrl, city: t.city, lat: t.lat, lng: t.lng, isFree: t.isFree, themeId: t.themeId, themeOverrides: t.themeOverrides },
    stops: b.stops.map((x) => ({ id: x.id, title: x.title, lat: x.lat, lng: x.lng, radiusM: x.radiusM, story: x.story, sources: x.sources.map(({ id, kind, title, url, description }) => ({ id, kind, title, url, description })) })),
    routes: b.routes.map((r) => ({ id: r.id, name: r.name, description: r.description, stopIds: r.stopIds })),
  };
  const themes = await listThemesFor(s.uid, !!realAdminId(s));
  return <TourEditor tourId={id} initialDoc={doc} status={t.status} deleted={!!t.deletedAt} themes={themes.map((x) => ({ id: x.id, name: x.name, isPreset: x.isPreset, ownerId: x.ownerId, tokens: x.tokens }))} meId={s.uid} isAdmin={!!realAdminId(s)} />;
}
