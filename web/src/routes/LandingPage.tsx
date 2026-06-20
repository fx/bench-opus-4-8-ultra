import { Link } from "react-router-dom";

// Placeholder landing page for the scaffold. Replaced by the full parody
// marketing page in change 0003.
export function LandingPage() {
  return (
    <main>
      <h1>Slop Simulator</h1>
      <p>The world&apos;s first fully autonomous slop engine.</p>
      <Link to="/demo">Open the demo</Link>
    </main>
  );
}
