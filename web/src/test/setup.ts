// Vitest global setup: registers jest-dom matchers (toBeInTheDocument, etc.)
// and tears down the DOM between tests. Excluded from coverage — pure scaffold.
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
