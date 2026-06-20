import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// cn merges class lists: clsx resolves conditionals/arrays/objects into a
// string, then tailwind-merge collapses conflicting Tailwind utilities so the
// last-wins (e.g. `p-2` + `p-4` → `p-4`). This is the single class-merge helper
// used by every primitive.
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
