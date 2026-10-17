import { distanceM } from "./geo";

export type DeckFact = { id: string; lat: number | null; lng: number | null; radiusM: number; nearStopId: string | null; inPool: boolean };

/**
 * The swipe-through order for the fact card: facts pinned to where the walker is, then facts tied to the stop they're at or heading to,
 * then the tour-wide pool (facts with no location, plus located facts marked `inPool`). A located fact that isn't in the pool only
 * appears in its own area. Within each group unseen facts come first, then seen ones, longest ago first. `first` is moved to the front.
 */
export function buildFactDeck(facts: DeckFact[], o: { pos: { lat: number; lng: number } | null; here: string[]; seen: string[]; first?: string | null }): string[] {
  const pinned = (f: DeckFact) => f.lat !== null && f.lng !== null;
  const nearby = o.pos ? facts.filter((f) => pinned(f) && distanceM(o.pos!, { lat: f.lat!, lng: f.lng! }) <= f.radiusM) : [];
  const scoped = facts.filter((f) => f.nearStopId && o.here.includes(f.nearStopId) && !nearby.includes(f));
  const pool = facts.filter((f) => !nearby.includes(f) && !scoped.includes(f) && (f.inPool || (!pinned(f) && !f.nearStopId)));
  const order = (g: DeckFact[]) => [...g.filter((f) => !o.seen.includes(f.id)), ...g.filter((f) => o.seen.includes(f.id)).sort((a, b) => o.seen.indexOf(a.id) - o.seen.indexOf(b.id))];
  const deck = [...order(nearby), ...order(scoped), ...order(pool)].map((f) => f.id);
  if (o.first && facts.some((f) => f.id === o.first)) return [o.first, ...deck.filter((id) => id !== o.first)];
  return deck;
}
