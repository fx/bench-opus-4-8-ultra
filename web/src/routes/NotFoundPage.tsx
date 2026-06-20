import { Link } from "react-router-dom";

// Client-side 404 for unknown SPA routes. (The Go server serves index.html for
// any HTML navigation; this component renders the not-found state inside it.)
export function NotFoundPage() {
  return (
    <main>
      <h1>404</h1>
      <p>This page does not exist.</p>
      <Link to="/">Back to home</Link>
    </main>
  );
}
