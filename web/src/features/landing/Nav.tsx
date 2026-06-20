import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button, type ButtonProps } from "../../components/ui/button.tsx";
import { cn } from "../../lib/cn.ts";
import { Logo } from "./Logo.tsx";
import { ANNOUNCEMENT, NAV_LINKS } from "./content.ts";

// The sticky glass navigation: announcement pill, wordmark, in-page anchors,
// right-side actions (Log in + primary CTA), and a prominent Demo button that
// routes to /demo client-side. Below the md breakpoint the anchors/actions
// collapse into a toggleable mobile menu that still carries a working Demo CTA.

// A Demo CTA that navigates to /demo via React Router (no full reload). Rendered
// as a Button styled link (asChild) so it keeps button styling while being an
// <a> the router intercepts.
function DemoButton({
  className,
  size,
  onNavigate,
}: {
  className?: string;
  size?: ButtonProps["size"];
  onNavigate?: () => void;
}) {
  return (
    <Button asChild className={className} size={size}>
      <Link to="/demo" onClick={onNavigate}>
        Demo
      </Link>
    </Button>
  );
}

export function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40">
      {/* Announcement pill */}
      <div className="border-b bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-2 text-center text-xs text-muted-foreground">
          <span className="rounded-full border px-3 py-1">{ANNOUNCEMENT}</span>
        </div>
      </div>

      {/* Glass nav bar */}
      <nav
        aria-label="Primary"
        className="border-b bg-background/70 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" aria-label="Slop Simulator home">
            <Logo />
          </Link>

          {/* Center anchors — desktop only */}
          <div className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right actions — desktop only */}
          <div className="hidden items-center gap-2 md:flex">
            <Button asChild variant="ghost" size="sm">
              <Link to="/demo">Log in</Link>
            </Button>
            <DemoButton size="sm" />
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border text-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:hidden"
          >
            {menuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile menu panel */}
        {menuOpen && (
          <div
            data-testid="mobile-menu"
            className={cn(
              "border-t bg-background/95 px-4 py-4 backdrop-blur-xl md:hidden",
            )}
          >
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-3 flex flex-col gap-2">
                <Button asChild variant="ghost">
                  <Link to="/demo" onClick={() => setMenuOpen(false)}>
                    Log in
                  </Link>
                </Button>
                <DemoButton onNavigate={() => setMenuOpen(false)} />
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
