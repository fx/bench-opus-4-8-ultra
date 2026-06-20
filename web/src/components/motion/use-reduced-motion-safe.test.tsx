import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { useReducedMotionSafe } from "./use-reduced-motion-safe.ts";

// A controllable matchMedia mock that records listeners so tests can flip the
// preference at runtime and assert the hook re-renders.
function installMatchMedia(initialMatches: boolean) {
  let matches = initialMatches;
  const listeners = new Set<() => void>();
  const mql = {
    get matches() {
      return matches;
    },
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: (_: string, cb: () => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
  };
  window.matchMedia = vi
    .fn()
    .mockReturnValue(mql) as unknown as typeof window.matchMedia;
  return {
    set(next: boolean) {
      matches = next;
      listeners.forEach((cb) => cb());
    },
    listenerCount: () => listeners.size,
  };
}

function Probe() {
  const reduced = useReducedMotionSafe();
  return <span>{reduced ? "reduced" : "full"}</span>;
}

describe("useReducedMotionSafe", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  it("returns false when reduced motion is not requested", () => {
    installMatchMedia(false);
    render(<Probe />);
    expect(screen.getByText("full")).toBeInTheDocument();
  });

  it("returns true when reduced motion is requested", () => {
    installMatchMedia(true);
    render(<Probe />);
    expect(screen.getByText("reduced")).toBeInTheDocument();
  });

  it("updates when the preference changes", () => {
    const mm = installMatchMedia(false);
    render(<Probe />);
    expect(screen.getByText("full")).toBeInTheDocument();
    act(() => mm.set(true));
    expect(screen.getByText("reduced")).toBeInTheDocument();
  });

  it("unsubscribes on unmount", () => {
    const mm = installMatchMedia(false);
    const { unmount } = render(<Probe />);
    expect(mm.listenerCount()).toBe(1);
    unmount();
    expect(mm.listenerCount()).toBe(0);
  });

  describe("without matchMedia", () => {
    beforeEach(() => {
      // Simulate a non-browser environment with no matchMedia available.
      (window as { matchMedia?: typeof window.matchMedia }).matchMedia =
        undefined;
    });

    it("treats missing matchMedia as motion allowed and no-op subscribe", () => {
      const { unmount } = render(<Probe />);
      expect(screen.getByText("full")).toBeInTheDocument();
      // Unmount exercises the no-op unsubscribe returned when matchMedia is
      // unavailable.
      expect(() => unmount()).not.toThrow();
    });
  });
});
