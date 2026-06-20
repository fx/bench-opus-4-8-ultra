import {
  Bell,
  CircleHelp,
  Grid3x3,
  Plus,
  Search,
  Settings,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar.tsx";
import { Button } from "../../../components/ui/button.tsx";
import { Input } from "../../../components/ui/input.tsx";
import { cn } from "../../../lib/cn.ts";
import { CommandBar } from "../rovo/CommandBar.tsx";

// The fixed Jira-look top navigation bar (see docs/specs/demo-jira-clone › App
// Chrome). Left→right: app-switcher (9-dot), wordmark, primary nav items, the
// blue Create button, a search/command input, and a right cluster
// (notifications, help, settings, profile) plus the "Ask Rovo" AI entry point.
// "Ask Rovo" is the live CommandBar (0007 — opens the scripted-answer dialog);
// search, Create, and the secondary icons remain visual placeholders.
//
// Responsive degradation (so the bar never forces horizontal overflow below
// 1024px): the header clips overflow and its clusters shrink gracefully —
// primary nav is hidden below md, search below sm, and the secondary right
// icons (help, settings) and the wordmark caption below lg. The primary
// affordances (wordmark mark, Create, the Ask Rovo AI entry, notifications,
// profile) stay reachable at every breakpoint.

// Primary nav items rendered as a row of ghost buttons. `active` highlights the
// current section the way Jira underlines the open area.
const NAV_ITEMS: { label: string; active?: boolean }[] = [
  { label: "Your work" },
  { label: "Projects", active: true },
  { label: "Filters" },
  { label: "Dashboards" },
];

export interface TopNavProps {
  className?: string;
}

export function TopNav({ className }: TopNavProps) {
  return (
    <header
      className={cn(
        // overflow-hidden clips any momentary cluster overflow so it never
        // becomes document-level horizontal scroll.
        "flex h-12 shrink-0 items-center gap-2 overflow-hidden border-b bg-background px-3",
        className,
      )}
      // Landmark + label so the chrome is navigable and assertable by role.
      aria-label="Application header"
    >
      {/* App switcher (9-dot grid) */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground"
        aria-label="App switcher"
      >
        <Grid3x3 className="h-5 w-5" aria-hidden="true" />
      </Button>

      {/* Product wordmark — a client-side Link so navigating home stays in the
          SPA and does not remount/reset the in-memory demo store. The mark stays
          at every breakpoint; the "Slop Jira" caption hides below lg so the bar
          stays overflow-safe on narrow screens. */}
      <Link
        to="/demo"
        className="mr-2 flex shrink-0 items-center gap-1.5 text-sm font-semibold text-foreground"
      >
        <span
          className="flex h-6 w-6 items-center justify-center rounded-sm bg-primary text-[11px] font-bold text-primary-foreground"
          aria-hidden="true"
        >
          S
        </span>
        <span className="hidden lg:inline">Slop Jira</span>
      </Link>

      {/* Primary nav */}
      <nav
        aria-label="Primary navigation"
        className="hidden items-center md:flex"
      >
        {NAV_ITEMS.map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            size="sm"
            aria-current={item.active ? "page" : undefined}
            className={cn(
              "h-8 font-normal text-muted-foreground",
              item.active && "font-medium text-foreground",
            )}
          >
            {item.label}
          </Button>
        ))}
      </nav>

      {/* Create button — stays at every breakpoint (a primary affordance). */}
      <Button size="sm" className="ml-1 h-8 shrink-0 font-medium">
        <Plus className="h-4 w-4" aria-hidden="true" />
        Create
      </Button>

      {/* Search / command input */}
      <div className="relative ml-2 hidden max-w-xs flex-1 sm:block">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="Search"
          aria-label="Search"
          className="h-8 pl-8"
        />
      </div>

      {/* Right cluster — shrink-0 so its icon buttons keep their hit targets;
          Help/Settings drop below lg to stay overflow-safe on narrow widths. */}
      <div className="ml-auto flex shrink-0 items-center gap-1">
        {/* Ask Rovo command bar (0007) — opens the scripted-answer dialog. */}
        <CommandBar />

        {/* Notifications with unread badge */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 text-muted-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          <span
            className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground"
            aria-hidden="true"
          >
            9
          </span>
        </Button>

        {/* Secondary icons — hidden below lg so the bar never overflows. */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden h-8 w-8 text-muted-foreground lg:inline-flex"
          aria-label="Help"
        >
          <CircleHelp className="h-5 w-5" aria-hidden="true" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="hidden h-8 w-8 text-muted-foreground lg:inline-flex"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" aria-hidden="true" />
        </Button>

        {/* Profile avatar */}
        <Avatar className="ml-1 h-7 w-7">
          <AvatarFallback className="bg-primary text-[11px] text-primary-foreground">
            DP
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
