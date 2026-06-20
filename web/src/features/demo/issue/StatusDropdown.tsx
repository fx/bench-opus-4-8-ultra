import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu.tsx";
import { cn } from "../../../lib/cn.ts";
import type { Status } from "../data/types.ts";
import { STATUS_META, STATUS_OPTIONS } from "./status-meta.ts";

// The issue-detail status control (see docs/changes/0006 › Status). It renders
// the current status as a Jira-style coloured lozenge that opens a DropdownMenu
// of every status; choosing one calls `onChange`, which the detail wires to the
// store's `setStatus` — the SAME pure transition the board's drag uses, so the
// board reflects the change immediately (single source of truth).
//
// The trigger is a real <button> (DropdownMenuTrigger renders one) so it is
// keyboard-operable with a visible focus ring; white lozenge text on the
// category colour is AA-guarded (status-meta.contrast.test.ts).

export interface StatusDropdownProps {
  status: Status;
  // Called with the chosen status. Selecting the already-current status still
  // fires — the store's transition reducer no-ops a same-status change, so this
  // stays a harmless single source of truth rather than the component guarding.
  onChange: (status: Status) => void;
}

export function StatusDropdown({ status, onChange }: StatusDropdownProps) {
  const current = STATUS_META[status];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-testid="status-dropdown-trigger"
        aria-label={`Status: ${current.label}. Change status`}
        className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs font-bold uppercase tracking-wide text-white transition-[filter] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        style={{ backgroundColor: current.color }}
      >
        {current.label}
        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[12rem]">
        {STATUS_OPTIONS.map((option) => {
          const meta = STATUS_META[option];
          const selected = option === status;
          return (
            <DropdownMenuItem
              key={option}
              data-testid={`status-option-${option}`}
              onSelect={() => onChange(option)}
              className="cursor-pointer justify-between gap-3"
            >
              <span className="inline-flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: meta.color }}
                />
                {meta.label}
              </span>
              <Check
                aria-hidden="true"
                className={cn(
                  "h-4 w-4",
                  selected ? "opacity-100" : "opacity-0",
                )}
              />
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
