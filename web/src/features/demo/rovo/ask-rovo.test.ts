import { describe, it, expect } from "vitest";
import { askRovo, ROVO_ANSWER_COUNT } from "./ask-rovo.ts";

describe("askRovo", () => {
  it("returns the first answer for a blank/whitespace query", () => {
    const blank = askRovo("");
    const spaces = askRovo("   ");
    expect(blank).toEqual(spaces);
    // It still answers — Rovo never admits it has nothing.
    expect(blank.body.length).toBeGreaterThan(0);
  });

  it("is deterministic: same query → same answer", () => {
    expect(askRovo("should we ship it?")).toEqual(
      askRovo("should we ship it?"),
    );
  });

  it("trims the query before selecting (whitespace doesn't change the answer)", () => {
    expect(askRovo("hello")).toEqual(askRovo("   hello   "));
  });

  it("always returns an over-confident, citation-laden answer", () => {
    const answer = askRovo("anything");
    expect(answer.confidence).toBeGreaterThanOrEqual(98);
    expect(answer.citations.length).toBeGreaterThan(0);
  });

  it("can reach every canned answer across varied queries", () => {
    // Probe a spread of queries and assert each distinct answer index appears,
    // exercising the hash→index mapping across the whole pool.
    const reached = new Set<string>();
    for (let i = 0; i < 500; i += 1) {
      reached.add(askRovo(`query number ${i}`).body);
    }
    expect(reached.size).toBe(ROVO_ANSWER_COUNT);
  });
});
