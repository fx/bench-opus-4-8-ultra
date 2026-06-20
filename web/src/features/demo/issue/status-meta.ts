import type { Status } from "../data/types.ts";
import { STATUS_LABELS, STATUS_ORDER } from "../data/types.ts";

// Presentation metadata for the issue-detail status lozenge / dropdown (0006).
// Jira renders the current status as a coloured lozenge whose category maps to a
// colour: To Do = neutral grey, In Progress / In Review = blue ("in progress"
// category), Done = green. The dropdown trigger paints WHITE text on `color`, so
// every `color` here MUST clear WCAG AA for white text (≥ 4.5:1) — locked by
// status-meta.contrast.test.ts.
//
// Kept in a plain (component-free) module, mirroring issue-meta.ts, so the maps
// can be re-exported without tripping React Fast-Refresh's "only export
// components" rule and so multiple surfaces share one status palette.

export interface StatusMeta {
  // Lozenge background; white text sits on it (AA-guarded).
  color: string;
  // Human-readable label, e.g. "In Progress" (mirrors STATUS_LABELS).
  label: string;
}

// Keyed by Status so the union is exhaustively covered; adding a status without
// an entry fails to compile. Colours are AA-safe shades of the Atlaskit status
// palette:
//  - todo        #44546F  neutral slate (7.65:1) — "To Do" neutral category
//  - in_progress #0052CC  Jira blue     (6.82:1) — "In Progress" category
//  - in_review   #0747A6  darker blue   (8.53:1) — same blue category, distinct
//  - done        #1F845A  green         (4.66:1) — "Done" category
export const STATUS_META: Record<Status, StatusMeta> = {
  todo: { color: "#44546F", label: STATUS_LABELS.todo },
  in_progress: { color: "#0052CC", label: STATUS_LABELS.in_progress },
  in_review: { color: "#0747A6", label: STATUS_LABELS.in_review },
  done: { color: "#1F845A", label: STATUS_LABELS.done },
};

// The selectable statuses in board display order — what the status dropdown
// lists. Re-exported from STATUS_ORDER so the dropdown and the board share one
// ordering source.
export const STATUS_OPTIONS: readonly Status[] = STATUS_ORDER;

// The violet fill of the activity feed's "Rovo" agent badge (ActivityFeed). White
// text sits on it, so it is AA-guarded (5.86:1) by status-meta.contrast.test.ts —
// kept here as the SINGLE source of truth so the rendered colour and the guarded
// colour can never drift. (Matches the agent's avatar/ring violet elsewhere.)
export const AGENT_BADGE_COLOR = "#6554C0";
