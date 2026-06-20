import { AppShell } from "../features/demo/chrome/AppShell.tsx";

// The /demo route renders the Jira-parody app shell (see docs/changes/0004). The
// shell owns the themed chrome, store, and placeholder board; this route is a
// thin entry point so the router (App.tsx) stays a plain route table.
export function DemoPage() {
  return <AppShell />;
}
