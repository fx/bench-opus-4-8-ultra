import {
  Bell,
  CircleHelp,
  Grid3x3,
  Plus,
  Search,
  Settings,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar.tsx";
import { Button } from "../../../components/ui/button.tsx";
import { Input } from "../../../components/ui/input.tsx";
import { cn } from "../../../lib/cn.ts";

// The fixed Jira-look top navigation bar (see docs/specs/demo-jira-clone › App
// Chrome). Left→right: app-switcher (9-dot), wordmark, primary nav items, the
// blue Create button, a search/command input, and a right cluster
// (notifications, help, settings, profile) plus the "Ask Rovo" AI entry point.
// In change 0004 the controls are visual only — search, Create, and Ask Rovo are
// wired to behaviour in later changes.

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
        "flex h-12 shrink-0 items-center gap-2 border-b bg-background px-3",
        className,
      )}
      // Landmark + label so the chrome is navigable and assertable by role.
      aria-label="Application header"
    >
      {/* App switcher (9-dot grid) */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground"
        aria-label="App switcher"
      >
        <Grid3x3 className="h-5 w-5" aria-hidden="true" />
      </Button>

      {/* Product wordmark — a client-side Link so navigating home stays in the
          SPA and does not remount/reset the in-memory demo store. */}
      <Link
        to="/demo"
        className="mr-2 flex items-center gap-1.5 text-sm font-semibold text-foreground"
      >
        <span
          className="flex h-6 w-6 items-center justify-center rounded-sm bg-primary text-[11px] font-bold text-primary-foreground"
          aria-hidden="true"
        >
          S
        </span>
        Slop Jira
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

      {/* Create button */}
      <Button size="sm" className="ml-1 h-8 font-medium">
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

      {/* Right cluster */}
      <div className="ml-auto flex items-center gap-1">
        {/* Ask Rovo AI entry point */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 border-primary/30 font-medium text-primary"
          aria-label="Ask Rovo"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          <span className="hidden lg:inline">Ask Rovo</span>
        </Button>

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

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          aria-label="Help"
        >
          <CircleHelp className="h-5 w-5" aria-hidden="true" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
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
