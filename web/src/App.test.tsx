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
    expect(
      screen.getByRole("heading", { name: "Slop Simulator" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open the demo" })).toHaveAttribute(
      "href",
      "/demo",
    );
  });

  it("renders the demo app shell at /demo", () => {
    renderAt("/demo");
    // The demo route now mounts the Jira-parody shell: its Board heading and the
    // SLOP project context stand in for the old placeholder page.
    expect(screen.getByRole("heading", { name: "Board" })).toBeInTheDocument();
    expect(screen.getByText("Slop Simulator")).toBeInTheDocument();
  });

  it("renders the not-found page for unknown routes", () => {
    renderAt("/does-not-exist");
    expect(screen.getByRole("heading", { name: "404" })).toBeInTheDocument();
  });

  it("navigates from landing to demo via the link", async () => {
    const user = userEvent.setup();
    renderAt("/");
    await user.click(screen.getByRole("link", { name: "Open the demo" }));
    expect(screen.getByRole("heading", { name: "Board" })).toBeInTheDocument();
  });

  it("navigates from not-found back to home", async () => {
    const user = userEvent.setup();
    renderAt("/nowhere");
    await user.click(screen.getByRole("link", { name: "Back to home" }));
    expect(
      screen.getByRole("heading", { name: "Slop Simulator" }),
    ).toBeInTheDocument();
  });
});
