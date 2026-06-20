import { Link } from "react-router-dom";

// Placeholder demo page for the scaffold. Replaced by the Jira-parody demo app
// in changes 0004+.
export function DemoPage() {
  return (
    <main>
      <h1>Demo</h1>
      <p>The agentic demo lives here.</p>
      <Link to="/">Back to home</Link>
    </main>
  );
}
