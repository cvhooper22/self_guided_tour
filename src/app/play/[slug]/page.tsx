import Player from "@/components/Player";

export default async function PlayPage({ params, searchParams }: PageProps<"/play/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const stop = typeof sp.stop === "string" ? sp.stop : undefined;
  return <Player slug={slug} initialStopId={stop} />;
}
