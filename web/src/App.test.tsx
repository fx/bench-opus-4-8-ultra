import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { App } from "./App.tsx";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("App router", () => {
  it("renders the landing page at /", () => {
    renderAt("/");
    // The landing hero shows the parody tagline as the page's h1.
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /fully autonomous slop engine/i,
      }),
    ).toBeInTheDocument();
  });

  it("renders the demo page at /demo", () => {
    renderAt("/demo");
    expect(screen.getByRole("heading", { name: "Demo" })).toBeInTheDocument();
  });

  it("renders the not-found page for unknown routes", () => {
    renderAt("/does-not-exist");
    expect(screen.getByRole("heading", { name: "404" })).toBeInTheDocument();
  });

  it("navigates from landing to demo via the nav Demo button", async () => {
    const user = userEvent.setup();
    renderAt("/");
    // The nav exposes a Demo link/button that routes client-side to /demo.
    await user.click(screen.getAllByRole("link", { name: "Demo" })[0]);
    expect(screen.getByRole("heading", { name: "Demo" })).toBeInTheDocument();
  });

  it("navigates from demo back to home", async () => {
    const user = userEvent.setup();
    renderAt("/demo");
    await user.click(screen.getByRole("link", { name: "Back to home" }));
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /fully autonomous slop engine/i,
      }),
    ).toBeInTheDocument();
  });

  it("navigates from not-found back to home", async () => {
    const user = userEvent.setup();
    renderAt("/nowhere");
    await user.click(screen.getByRole("link", { name: "Back to home" }));
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /fully autonomous slop engine/i,
      }),
    ).toBeInTheDocument();
  });
});
