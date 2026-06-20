import { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/cn.ts";
import { useReducedMotionSafe } from "../../components/motion/index.ts";

// A minimal timer abstraction so the typewriter can be driven deterministically
// in tests (fake timers) without coupling to global setTimeout directly.
export interface TerminalClock {
  setTimer: (cb: () => void, ms: number) => number;
  clearTimer: (handle: number) => void;
}

const defaultClock: TerminalClock = {
  setTimer: (cb, ms) => window.setTimeout(cb, ms),
  clearTimer: (handle) => window.clearTimeout(handle),
};

export interface TerminalProps {
  lines: readonly string[];
  className?: string;
  // Milliseconds between typed characters.
  charMs?: number;
  // Milliseconds to pause after a line completes, before the next line starts.
  linePauseMs?: number;
  // Injectable clock for deterministic tests; defaults to window.setTimeout.
  clock?: TerminalClock;
}

// Terminal renders an animated typewriter "slop deploy" console — the hero
// product mock. It types the scripted lines character-by-character, advancing on
// a timer. Under reduced motion it short-circuits to all lines fully rendered
// with no timers scheduled, so the content is present and static.
export function Terminal({
  lines,
  className,
  charMs = 28,
  linePauseMs = 420,
  clock = defaultClock,
}: TerminalProps) {
  const reduced = useReducedMotionSafe();
  // lineIndex = how many lines are fully typed; charCount = chars typed of the
  // current (in-progress) line.
  const [lineIndex, setLineIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Reduced motion: render everything immediately, schedule nothing.
    if (reduced) {
      setLineIndex(lines.length);
      setCharCount(0);
      return;
    }

    // All lines done — idle (the cursor keeps blinking via CSS).
    if (lineIndex >= lines.length) {
      return;
    }

    const current = lines[lineIndex];
    if (charCount < current.length) {
      // Type the next character.
      timerRef.current = clock.setTimer(() => {
        setCharCount((c) => c + 1);
      }, charMs);
    } else {
      // Line complete — pause, then advance to the next line.
      timerRef.current = clock.setTimer(() => {
        setLineIndex((i) => i + 1);
        setCharCount(0);
      }, linePauseMs);
    }

    return () => {
      if (timerRef.current !== null) {
        clock.clearTimer(timerRef.current);
      }
    };
  }, [lineIndex, charCount, lines, charMs, linePauseMs, reduced, clock]);

  // The lines to display: all completed lines, plus the partially-typed current
  // line (when not reduced and still in progress).
  const completed = lines.slice(0, lineIndex);
  const inProgress =
    !reduced && lineIndex < lines.length
      ? lines[lineIndex].slice(0, charCount)
      : null;
  const done = reduced || lineIndex >= lines.length;

  return (
    <div
      data-testid="hero-terminal"
      className={cn(
        "overflow-hidden rounded-xl border bg-card/80 font-mono text-xs shadow-2xl backdrop-blur",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 border-b px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-destructive/80" />
        <span className="h-3 w-3 rounded-full bg-slop/80" />
        <span className="h-3 w-3 rounded-full bg-primary/80" />
        <span className="ml-2 text-[11px] text-muted-foreground">
          slop@swarm — deploy
        </span>
      </div>
      <pre className="m-0 min-h-[9.5rem] whitespace-pre-wrap break-words p-4 leading-relaxed text-foreground">
        {/* Lines are an append-only, ordered list (a line is never reordered or
            removed once typed), so the index is a stable key even if two scripted
            lines happen to share text. Rendered as block-level <span>s because
            <pre> only permits phrasing content — a <div> child would be invalid
            HTML. */}
        {completed.map((line, i) => (
          <span key={i} className="block">
            {line}
          </span>
        ))}
        {inProgress !== null && (
          <span className="block">
            {inProgress}
            <span
              className={cn(
                "ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 bg-slop align-middle",
                !reduced && "animate-pulse",
              )}
            />
          </span>
        )}
        {done && (
          <span
            data-testid="terminal-cursor"
            // The blinking cursor is an infinite loop; disable it under reduced
            // motion so the terminal is fully static (a solid cursor).
            className={cn(
              "inline-block h-3.5 w-1.5 translate-y-0.5 bg-slop align-middle",
              !reduced && "animate-pulse",
            )}
          />
        )}
      </pre>
    </div>
  );
}
