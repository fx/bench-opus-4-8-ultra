import { Sparkles } from "lucide-react";
import type { Comment } from "../data/types.ts";
import { AssigneeAvatar } from "../board/CardMeta.tsx";
import { formatRelativeTime } from "./relative-time.ts";
import { AGENT_BADGE_COLOR } from "./status-meta.ts";

// The issue-detail activity feed (see docs/changes/0006 › Comments / activity).
// It lists an issue's comments newest-first (reverse-chronological) — each row a
// coloured author avatar, the author name, a relative timestamp, and the body.
// Comments flagged `byAgent` (the 0007 "Rovo handled this" run logs) get a violet
// sparkle marker. `now` is injected so the "x minutes ago" stamps are
// deterministic in tests and consistent with comments the store timestamps via
// the same clock.
//
// The store PREPENDS new comments, so rendering the array as-is is already
// newest-first; we don't re-sort (the seed + store guarantee descending order),
// keeping the feed a pure projection of state.

export interface ActivityFeedProps {
  comments: Comment[];
  // Current time (epoch ms) for relative-time formatting. Injected so tests are
  // deterministic; the live detail view passes Date.now().
  now: number;
}

export function ActivityFeed({ comments, now }: ActivityFeedProps) {
  if (comments.length === 0) {
    return (
      <p data-testid="activity-empty" className="text-sm text-muted-foreground">
        No activity yet. Be the first to comment.
      </p>
    );
  }

  return (
    <ul data-testid="activity-feed" className="flex flex-col gap-4">
      {comments.map((comment) => (
        <li key={comment.id} className="flex gap-2.5">
          <AssigneeAvatar user={comment.author} className="mt-0.5" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-sm font-semibold text-foreground">
                {comment.author.name}
              </span>
              {comment.byAgent && (
                <span
                  data-testid="activity-agent-badge"
                  // White text on the AA-safe violet (AGENT_BADGE_COLOR =
                  // #6554C0, 5.86:1) so the agent marker reads as AI without a
                  // contrast miss. The colour comes from the shared constant
                  // (single source of truth with the contrast guard) via an inline
                  // style, since the value isn't a static Tailwind class.
                  className="inline-flex items-center gap-0.5 rounded-sm px-1 text-[10px] font-semibold text-white"
                  style={{ backgroundColor: AGENT_BADGE_COLOR }}
                >
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  Rovo
                </span>
              )}
              <time
                dateTime={new Date(comment.createdAt).toISOString()}
                className="text-xs text-muted-foreground"
              >
                {formatRelativeTime(comment.createdAt, now)}
              </time>
            </div>
            <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground">
              {comment.body}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
