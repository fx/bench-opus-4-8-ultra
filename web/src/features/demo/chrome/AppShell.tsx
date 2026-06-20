import { ThemeScope } from "../../../components/ThemeScope.tsx";
import { Board } from "../board/Board.tsx";
import { IssueDetail } from "../issue/IssueDetail.tsx";
import { AgentPanel } from "../agent/AgentPanel.tsx";
import { ImplementWithAiButton } from "../agent/ImplementWithAiButton.tsx";
import { useDemoClocks } from "../agent/use-demo-clocks.ts";
import { Autopilot } from "../rovo/Autopilot.tsx";
import { AgentsRoster } from "../rovo/AgentsRoster.tsx";
import { AiGenerateButton } from "../rovo/AiGenerateButton.tsx";
import type { Issue } from "../data/types.ts";
import { useDemoStore } from "../store/store.ts";
import { Sidebar } from "./Sidebar.tsx";
import { TopNav } from "./TopNav.tsx";

// The demo application shell (see docs/changes/0004 › Jira chrome; agentic
// features wired in 0007). It composes the three-zone Jira layout — fixed top
// nav, collapsible sidebar, and a main content area — inside a
// `data-theme="jira"` ThemeScope so every enclosed primitive resolves the Jira
// (light) token set. The main area renders EITHER the Kanban Board (default) or
// the Rovo Agents roster, driven by the store's `activeView` (the sidebar flips
// it).
//
// 0007 wiring lives here so the feature stays at the composition root:
//  - The board header hosts the Agentic Autopilot toggle.
//  - Every board card's AI slot is the "✨ Implement now with AI" action, which
//    starts a run AND opens the issue detail so the user watches the AgentPanel.
//  - The issue detail's agent slot hosts the AgentPanel + a start button, and its
//    description slot hosts the "✨ AI-generate" action.
//  - `useDemoClocks()` (mounted here, at the always-present shell root) drives the
//    agent run + Autopilot, so they progress regardless of which view is shown.
//
// The root is w-full + overflow-x-hidden and the body row carries min-w-0 so the
// chrome never produces document-level horizontal overflow at any breakpoint.

// renderCardAiSlot is the per-card "✨ AI" action. Starting a run opens the
// issue's detail (openIssue) so the streaming panel is visible immediately.
function CardAiSlot({
  issue,
  onOpenIssue,
}: {
  issue: Issue;
  onOpenIssue: (key: string) => void;
}) {
  return (
    <ImplementWithAiButton
      issueKey={issue.key}
      compact
      onStarted={onOpenIssue}
    />
  );
}

// The issue-detail agent slot: the AgentPanel (live run stream) with a start
// button beneath it when this issue has no run yet, so the detail is a complete
// "run it / watch it" surface.
function DetailAgentSlot({ issue }: { issue: Issue }) {
  const run = useDemoStore((state) => state.agentRun);
  const hasRunForIssue = run !== null && run.issueKey === issue.key;
  return (
    <div className="flex flex-col gap-2">
      {!hasRunForIssue && (
        <ImplementWithAiButton issueKey={issue.key} className="w-full" />
      )}
      <AgentPanel issue={issue} />
    </div>
  );
}

export function AppShell() {
  const project = useDemoStore((state) => state.project);
  const openIssue = useDemoStore((state) => state.openIssue);
  const activeView = useDemoStore((state) => state.activeView);
  const generateSummary = useDemoStore((state) => state.generateSummary);
  const generateDescription = useDemoStore(
    (state) => state.generateDescription,
  );
  const generateReply = useDemoStore((state) => state.generateReply);

  // The shell-level clock driver: advances the agent run and Autopilot whenever
  // they're logically active, independent of which view/panel is mounted, so a
  // run completes even if the issue detail closes mid-run and Autopilot keeps
  // shipping cards while the user is on the roster. The only real timers in 0007.
  useDemoClocks();

  return (
    <ThemeScope
      theme="jira"
      className="flex h-dvh w-full flex-col overflow-x-hidden"
    >
      <TopNav />
      <div className="flex min-h-0 min-w-0 flex-1">
        <Sidebar />
        <main
          // The landmark label tracks the active view so screen-reader users
          // hear the correct region name (Board vs. the Rovo Agents roster).
          aria-label={activeView === "agents" ? "Rovo Agents" : "Board"}
          className="min-w-0 flex-1 overflow-auto p-4"
        >
          {activeView === "agents" ? (
            <AgentsRoster />
          ) : (
            <>
              {/* Board header — the view title + the Agentic Autopilot toggle. */}
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Projects / {project.name}
                  </p>
                  <h1 className="text-xl font-semibold text-foreground">
                    Board
                  </h1>
                </div>
                <Autopilot />
              </div>

              {/* The Kanban board: four columns of draggable cards. A card click
                  opens the issue detail; the card's AI slot starts a run + opens
                  the detail so the panel is visible. */}
              <Board
                onOpenIssue={openIssue}
                renderAiSlot={(issue) => (
                  <CardAiSlot issue={issue} onOpenIssue={openIssue} />
                )}
              />
            </>
          )}
        </main>
      </div>

      {/* The issue detail modal. It hosts the AgentPanel (agent slot) and the
          AI-generate summary/description actions (description slot). Mounted at
          the shell root so it overlays the whole demo, inside the Jira theme. */}
      <IssueDetail
        aiAgentSlot={(issue) => <DetailAgentSlot issue={issue} />}
        summaryAiSlot={(issue) => (
          <AiGenerateButton
            label="AI-generate summary"
            onGenerate={() => generateSummary(issue.key)}
          >
            AI rewrite
          </AiGenerateButton>
        )}
        descriptionAiSlot={(issue) => (
          <AiGenerateButton
            label="AI-generate description"
            onGenerate={() => generateDescription(issue.key)}
          >
            AI generate
          </AiGenerateButton>
        )}
        replyAiSlot={(issue) => (
          <AiGenerateButton
            label="Reply with AI"
            onGenerate={() => generateReply(issue.key)}
          >
            Reply with AI
          </AiGenerateButton>
        )}
      />
    </ThemeScope>
  );
}
