import { Link } from "react-router-dom";
import { Logo } from "./Logo.tsx";
import {
  FOOTER_COLUMNS,
  FOOTER_FINE_PRINT,
  FOOTER_GHOST_WORDMARK,
  FOOTER_SOCIALS,
  FOOTER_STATUS,
} from "./content.ts";

// Footer: a multi-column link grid, a status pill, socials, a giant ghosted
// "SLOP" wordmark, and parody fine print. The big ghost wordmark is decorative
// (aria-hidden) so it isn't announced to assistive tech.
export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t bg-panel/30 px-4 pt-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link to="/" aria-label="Slop Simulator home">
              <Logo />
            </Link>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-slop">
              {FOOTER_STATUS}
            </p>
            <div className="mt-5 flex gap-3">
              {FOOTER_SOCIALS.map((social) => (
                <a
                  key={social}
                  href="/demo"
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {social}
                </a>
              ))}
            </div>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.heading}>
              <h3 className="text-sm font-semibold text-foreground">
                {column.heading}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link}>
                    <a
                      href="/demo"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center gap-6 border-t pt-8 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted-foreground">{FOOTER_FINE_PRINT}</p>
        </div>

        {/* Giant ghosted wordmark — purely decorative. */}
        <div
          aria-hidden="true"
          className="pointer-events-none select-none pt-8 text-center text-[22vw] font-bold leading-none tracking-tighter text-foreground/[0.04]"
        >
          {FOOTER_GHOST_WORDMARK}
        </div>
      </div>
    </footer>
  );
}
