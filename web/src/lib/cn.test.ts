import { describe, it, expect } from "vitest";
import { cn } from "./cn.ts";

describe("cn", () => {
  it("joins multiple class strings", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("merges conflicting tailwind utilities, last wins", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("keeps a conditional class only when truthy", () => {
    const on = true as boolean;
    const off = false as boolean;
    expect(cn("p-2", on && "p-4")).toBe("p-4");
    expect(cn("p-2", off && "p-4")).toBe("p-2");
  });

  it("ignores falsy values (undefined/null/empty)", () => {
    expect(cn("a", undefined, null, "", "b")).toBe("a b");
  });

  it("flattens arrays and objects (clsx semantics)", () => {
    expect(cn(["a", "b"], { c: true, d: false })).toBe("a b c");
  });
});
