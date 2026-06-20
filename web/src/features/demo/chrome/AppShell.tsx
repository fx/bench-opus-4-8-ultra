import { ThemeScope } from "../../../components/ThemeScope.tsx";
import { Board } from "../board/Board.tsx";
import { useDemoStore } from "../store/store.ts";
import { Sidebar } from "./Sidebar.tsx";
import { TopNav } from "./TopNav.tsx";

// The demo application shell (see docs/changes/0004 › Jira chrome). It composes
// the three-zone Jira layout — fixed top nav, collapsible sidebar, and a main
// content area — inside a `data-theme="jira"` ThemeScope so every enclosed
// primitive resolves the Jira (light) token set. The main area renders the
// Kanban Board (change 0005).
//
// The root is w-full + overflow-x-hidden and the body row carries min-w-0 so the
// chrome never produces document-level horizontal overflow at any breakpoint;
// the sidebar auto-collapses and the top nav degrades responsively below lg. The
// board itself scrolls horizontally inside its own track (overflow-x-auto) so
// extra columns never push the document sideways.

export function AppShell() {
  const project = useDemoStore((state) => state.project);

  return (
    <ThemeScope
      theme="jira"
      className="flex h-dvh w-full flex-col overflow-x-hidden"
    >
      <TopNav />
      <div className="flex min-h-0 min-w-0 flex-1">
        <Sidebar />
        <main aria-label="Board" className="min-w-0 flex-1 overflow-auto p-4">
          {/* Board header — the view title + context bar above the columns. */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                Projects / {project.name}
              </p>
              <h1 className="text-xl font-semibold text-foreground">Board</h1>
            </div>
          </div>

          {/* The Kanban board (change 0005): four columns of draggable issue
              cards with live counts, fed from the store. */}
          <Board />
        </main>
      </div>
    </ThemeScope>
  );
}
