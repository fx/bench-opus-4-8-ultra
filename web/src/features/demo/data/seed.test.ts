import { describe, it, expect } from "vitest";
import { createSeed } from "./seed.ts";
import { STATUS_ORDER } from "./types.ts";

describe("createSeed", () => {
  it("seeds the SLOP project context", () => {
    const { project } = createSeed();
    expect(project.key).toBe("SLOP");
    expect(project.name).toBe("Slop Simulator");
    expect(project.avatarColor).toMatch(/^#/);
  });

  it("includes the Rovo Ultra agent user", () => {
    const { users } = createSeed();
    const agent = users.find((u) => u.isAgent);
    expect(agent).toBeDefined();
    expect(agent?.name).toBe("Rovo Ultra");
    expect(agent?.id).toBe("rovo-ultra");
  });

  it("includes human (non-agent) users too", () => {
    const { users } = createSeed();
    expect(users.some((u) => !u.isAgent)).toBe(true);
    expect(users.length).toBeGreaterThanOrEqual(2);
  });

  it("seeds at least 12 issues", () => {
    const { issues } = createSeed();
    expect(issues.length).toBeGreaterThanOrEqual(12);
  });

  it("uses unique SLOP-### keys for every issue", () => {
    const { issues } = createSeed();
    const keys = issues.map((i) => i.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) {
      expect(key).toMatch(/^SLOP-\d+$/);
    }
  });

  it("populates every issue with a valid status in the four columns", () => {
    const { issues } = createSeed();
    for (const issue of issues) {
      expect(STATUS_ORDER).toContain(issue.status);
    }
  });

  it("seeds issues in every column so the board is non-empty everywhere", () => {
    const { issues } = createSeed();
    for (const status of STATUS_ORDER) {
      expect(issues.some((i) => i.status === status)).toBe(true);
    }
  });

  it("marks agent-handled done issues as handled by an agent", () => {
    const { issues } = createSeed();
    const handled = issues.filter((i) => i.handledByAgent);
    expect(handled.length).toBeGreaterThan(0);
    for (const issue of handled) {
      expect(issue.status).toBe("done");
    }
  });

  it("gives every issue deterministic, ordered timestamps", () => {
    const { issues } = createSeed();
    for (const issue of issues) {
      expect(typeof issue.createdAt).toBe("number");
      expect(issue.updatedAt).toBeGreaterThanOrEqual(issue.createdAt);
    }
  });

  it("includes a story-pointless issue (null points) and pointed issues", () => {
    const { issues } = createSeed();
    expect(issues.some((i) => i.storyPoints === null)).toBe(true);
    expect(issues.some((i) => typeof i.storyPoints === "number")).toBe(true);
  });

  it("includes an unassigned issue and assigned issues", () => {
    const { issues } = createSeed();
    expect(issues.some((i) => i.assignee === null)).toBe(true);
    expect(issues.some((i) => i.assignee !== null)).toBe(true);
  });

  it("attaches agent-authored comments flagged byAgent", () => {
    const { issues } = createSeed();
    const agentComments = issues.flatMap((i) =>
      i.comments.filter((c) => c.byAgent),
    );
    expect(agentComments.length).toBeGreaterThan(0);
    expect(agentComments.every((c) => c.author.isAgent)).toBe(true);
  });

  it("is deterministic — two calls produce equal data", () => {
    expect(createSeed()).toEqual(createSeed());
  });

  it("returns a fresh deep copy each call (no shared references)", () => {
    const a = createSeed();
    const b = createSeed();
    expect(a.issues).not.toBe(b.issues);
    a.issues[0].summary = "mutated";
    a.issues[0].status = "done";
    // Mutating one copy must not leak into another fresh seed.
    expect(b.issues[0].summary).not.toBe("mutated");
    expect(createSeed().issues[0].summary).not.toBe("mutated");
  });
});
