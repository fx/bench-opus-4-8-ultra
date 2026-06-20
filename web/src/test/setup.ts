// Vitest global setup: registers jest-dom matchers (toBeInTheDocument, etc.)
// and tears down the DOM between tests. Excluded from coverage — pure scaffold.
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom does not implement ResizeObserver, which Radix's ScrollArea relies on.
// A no-op polyfill lets those primitives render under tests without affecting
// behavior (there is no layout to observe in jsdom).
if (!("ResizeObserver" in globalThis)) {
  class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  globalThis.ResizeObserver =
    ResizeObserverStub as unknown as typeof ResizeObserver;
}

// jsdom also lacks IntersectionObserver, which Motion's whileInView/useInView
// (used by the marketing motion primitives and section animations) relies on. A
// no-op stub lets those render under tests; the reduced-motion/in-view branches
// are asserted via injected hooks rather than real intersection events.
if (!("IntersectionObserver" in globalThis)) {
  class IntersectionObserverStub {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds: ReadonlyArray<number> = [];
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  globalThis.IntersectionObserver =
    IntersectionObserverStub as unknown as typeof IntersectionObserver;
}

afterEach(() => {
  cleanup();
});
