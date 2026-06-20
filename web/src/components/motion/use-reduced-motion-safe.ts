import { useSyncExternalStore } from "react";

// MEDIA_QUERY is the canonical reduced-motion preference query. It is read via
// matchMedia so the hook reflects the live OS/browser setting.
const MEDIA_QUERY = "(prefers-reduced-motion: reduce)";

function getMediaQueryList(): MediaQueryList | null {
  // matchMedia is unavailable in non-browser environments; treat that as "no
  // preference" (motion allowed) rather than crashing.
  if (typeof window === "undefined" || !window.matchMedia) {
    return null;
  }
  return window.matchMedia(MEDIA_QUERY);
}

function subscribe(onChange: () => void): () => void {
  const mql = getMediaQueryList();
  if (!mql) {
    return () => {};
  }
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return getMediaQueryList()?.matches ?? false;
}

// useReducedMotionSafe is the single reduced-motion gate consulted by every
// motion primitive. It returns true when the user has requested reduced motion,
// so primitives can short-circuit transform/infinite animations centrally
// rather than each re-reading the media query. getServerSnapshot returns false
// (motion allowed) for SSR/non-browser snapshots.
export function useReducedMotionSafe(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
