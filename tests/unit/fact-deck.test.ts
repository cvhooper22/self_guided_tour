import { describe, expect, it } from "vitest";
import { buildFactDeck, type DeckFact } from "@/lib/fact-deck";

const f = (id: string, p: Partial<DeckFact> = {}): DeckFact => ({ id, lat: null, lng: null, radiusM: 60, nearStopId: null, inPool: false, ...p });
const base = { pos: null, here: [] as string[], seen: [] as string[] };

describe("buildFactDeck", () => {
  it("puts tour-wide facts in the deck and keeps local-only facts out of it", () => {
    const facts = [f("wide"), f("local", { nearStopId: "s1" }), f("pin", { lat: 1, lng: 1 })];
    expect(buildFactDeck(facts, base)).toEqual(["wide"]);
  });
  it("lists local facts first when the walker is in their area", () => {
    const facts = [f("wide"), f("local", { nearStopId: "s1" })];
    expect(buildFactDeck(facts, { ...base, here: ["s1"] })).toEqual(["local", "wide"]);
  });
  it("keeps a located fact in the deck everywhere when it is in the pool", () => {
    const facts = [f("wide"), f("both", { nearStopId: "s1", inPool: true })];
    expect(buildFactDeck(facts, base)).toEqual(["wide", "both"]);
    expect(buildFactDeck(facts, { ...base, here: ["s1"] })).toEqual(["both", "wide"]);
  });
  it("puts a nearby pinned fact first and honours first", () => {
    const facts = [f("wide"), f("pin", { lat: 10, lng: 10, inPool: true }), f("other")];
    expect(buildFactDeck(facts, { ...base, pos: { lat: 10, lng: 10 } })[0]).toBe("pin");
    expect(buildFactDeck(facts, { ...base, first: "other" })).toEqual(["other", "wide", "pin"]);
  });
  it("orders unseen before seen, oldest seen first", () => {
    const facts = [f("a"), f("b"), f("c")];
    expect(buildFactDeck(facts, { ...base, seen: ["b", "a"] })).toEqual(["c", "b", "a"]);
  });
});
