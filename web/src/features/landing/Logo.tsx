import { cn } from "../../lib/cn.ts";
import { WORDMARK } from "./content.ts";

// Locally-generated brand mark: a rounded-square glyph with a stylized "S" path
// plus the wordmark text. No external/CDN asset — the icon is inline SVG.

export interface LogoProps {
  className?: string;
  // When false, only the glyph renders (e.g. compact footers). Default true.
  showWordmark?: boolean;
}

export function Logo({ className, showWordmark = true }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        viewBox="0 0 32 32"
        role="img"
        aria-label={WORDMARK}
        className="h-7 w-7 shrink-0"
      >
        <rect
          width="32"
          height="32"
          rx="8"
          fill="hsl(var(--primary))"
          opacity="0.16"
        />
        <path
          d="M21 11.5c-1-1.6-2.8-2.5-5-2.5-2.8 0-4.8 1.4-4.8 3.6 0 4.8 9.6 2.4 9.6 7.2 0 2.3-2.2 3.7-5 3.7-2.4 0-4.4-1-5.4-2.7"
          fill="none"
          stroke="hsl(var(--slop))"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
      {showWordmark && (
        <span className="text-base font-semibold tracking-tight text-foreground">
          {WORDMARK}
        </span>
      )}
    </span>
  );
}
