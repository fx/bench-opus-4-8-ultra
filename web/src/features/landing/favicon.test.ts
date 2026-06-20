import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Guards the favicon fix: the leftover Vite scaffold `<link rel="icon"
// href="/vite.svg">` 404'd on every load. The icon must now be a self-contained
// inline data URI (so it always resolves — no network request, no 404) and must
// not reference the missing /vite.svg asset in the actual link.
// Vitest runs with cwd = the web/ package root, where index.html lives.
describe("index.html favicon", () => {
  const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");

  it("uses an inline SVG data-URI icon, not the missing /vite.svg asset", () => {
    const iconLink = html.match(/<link[^>]*rel="icon"[^>]*>/);
    expect(iconLink).not.toBeNull();
    expect(iconLink![0]).toContain("data:image/svg+xml");
    expect(iconLink![0]).not.toContain("/vite.svg");
  });
});
