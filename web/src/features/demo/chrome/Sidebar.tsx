import type { ComponentType } from "react";
import {
  Bot,
  Calendar,
  ChartNoAxesColumn,
  ChevronLeft,
  ChevronRight,
  Clock,
  Columns3,
  FileText,
  List,
  PanelLeft,
} from "lucide-react";
import { Button } from "../../../components/ui/button.tsx";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../components/ui/tooltip.tsx";
import { cn } from "../../../lib/cn.ts";
import { useDemoStore } from "../store/store.ts";

// The collapsible left sidebar (see docs/specs/demo-jira-clone › App Chrome). It
// shows the current SLOP project context and the Jira view list — Summary,
// Timeline, Backlog, Board (active), Calendar, Reports, Issues — plus the parody
// "Rovo Agents" roster item. The collapse control folds it to an icon rail; the
// collapsed flag lives in the store so the main content can reflow alongside.

type IconType = ComponentType<{ className?: string }>;

interface ViewItem {
  label: string;
  icon: IconType;
  active?: boolean;
  agent?: boolean;
}

// The sidebar view list. "Board" is the default/active view; "Rovo Agents" is
// the parody roster entry, visually distinguished as an AI surface.
const VIEWS: ViewItem[] = [
  { label: "Summary", icon: FileText },
  { label: "Timeline", icon: Clock },
  { label: "Backlog", icon: List },
  { label: "Board", icon: Columns3, active: true },
  { label: "Calendar", icon: Calendar },
  { label: "Reports", icon: ChartNoAxesColumn },
  { label: "Issues", icon: PanelLeft },
  { label: "Rovo Agents", icon: Bot, agent: true },
];

export interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const collapsed = useDemoStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useDemoStore((state) => state.toggleSidebar);
  const project = useDemoStore((state) => state.project);

  return (
    <TooltipProvider delayDuration={0}>
      <nav
        aria-label="Project"
        data-collapsed={collapsed}
        className={cn(
          "flex shrink-0 flex-col border-r bg-background transition-[width] duration-200",
          collapsed ? "w-14" : "w-60",
          className,
        )}
      >
        {/* Project header */}
        <div
          className={cn(
            "flex items-center gap-2 border-b px-3 py-3",
            collapsed && "justify-center px-0",
          )}
        >
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-xs font-bold text-primary-foreground"
            style={{ backgroundColor: project.avatarColor }}
            aria-hidden="true"
          >
            {project.key.slice(0, 2)}
          </span>
          {!collapsed && (
            <span className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-semibold text-foreground">
                {project.name}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {project.key} project
              </span>
            </span>
          )}
        </div>

        {/* View list. Items are placeholder buttons (not links) — only the
            active Board view is rendered by the shell; the rest are wired to
            routes in later changes. Buttons avoid the href="#" page jump and
            carry aria-current on the interactive element itself. */}
        <ul className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
          {VIEWS.map((view) => {
            const Icon = view.icon;
            const button = (
              <button
                type="button"
                aria-label={view.label}
                aria-current={view.active ? "page" : undefined}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  collapsed && "justify-center px-0",
                  view.active && "bg-accent font-medium text-accent-foreground",
                  view.agent && "text-primary",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{view.label}</span>}
              </button>
            );

            return (
              <li key={view.label}>
                {collapsed ? (
                  <Tooltip>
                    {/* Tooltip surfaces the label while the rail hides it. */}
                    <TooltipTrigger asChild>{button}</TooltipTrigger>
                    <TooltipContent side="right">{view.label}</TooltipContent>
                  </Tooltip>
                ) : (
                  button
                )}
              </li>
            );
          })}
        </ul>

        {/* Collapse / expand control */}
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            className={cn(
              "h-8 w-full justify-start gap-2 text-muted-foreground",
              collapsed && "justify-center px-0",
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            )}
            {!collapsed && <span>Collapse</span>}
          </Button>
        </div>
      </nav>
    </TooltipProvider>
  );
}
