import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { AgentsRoster } from "./AgentsRoster.tsx";
import { ROSTER_AGENTS } from "./roster.ts";

describe("AgentsRoster", () => {
  it("lists every roster agent with its stats", () => {
    render(<AgentsRoster />);
    expect(screen.getAllByTestId("roster-agent")).toHaveLength(
      ROSTER_AGENTS.length,
    );
    // First agent's name + a utilization stat render.
    expect(screen.getByText(ROSTER_AGENTS[0].name)).toBeInTheDocument();
    expect(
      screen.getByText(`Utilization ${ROSTER_AGENTS[0].utilization}%`),
    ).toBeInTheDocument();
  });

  it("starts with no agents hired and Assign disabled", () => {
    render(<AgentsRoster />);
    expect(
      screen.getByText(
        "0 of 6 agents hired. Each works 400% of the time, allegedly.",
      ),
    ).toBeInTheDocument();
    const first = screen.getAllByTestId("roster-agent")[0];
    expect(within(first).getByTestId("roster-assign")).toBeDisabled();
  });

  it("hires and un-hires an agent, updating the header count", () => {
    render(<AgentsRoster />);
    const first = screen.getAllByTestId("roster-agent")[0];
    const hire = within(first).getByTestId("roster-hire");

    fireEvent.click(hire);
    expect(within(first).getByText("Hired")).toBeInTheDocument();
    expect(hire).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/1 of 6 agents hired/)).toBeInTheDocument();

    fireEvent.click(hire);
    expect(within(first).getByText("Hire")).toBeInTheDocument();
    expect(screen.getByText(/0 of 6 agents hired/)).toBeInTheDocument();
  });

  it("enables Assign only once hired, and toggles assignment", () => {
    render(<AgentsRoster />);
    const first = screen.getAllByTestId("roster-agent")[0];
    const hire = within(first).getByTestId("roster-hire");
    const assign = within(first).getByTestId("roster-assign");

    expect(assign).toBeDisabled();
    fireEvent.click(hire); // hire → assign enabled
    expect(assign).not.toBeDisabled();

    fireEvent.click(assign);
    expect(within(first).getByText("Assigned")).toBeInTheDocument();
    expect(assign).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(assign); // toggle off
    expect(within(first).getByText("Assign")).toBeInTheDocument();
  });

  it("clears an existing assignment when the agent is un-hired", () => {
    render(<AgentsRoster />);
    const first = screen.getAllByTestId("roster-agent")[0];
    const hire = within(first).getByTestId("roster-hire");

    fireEvent.click(hire); // hire
    fireEvent.click(within(first).getByTestId("roster-assign")); // assign
    expect(within(first).getByText("Assigned")).toBeInTheDocument();

    fireEvent.click(hire); // un-hire → assignment cleared
    // Re-hire: Assign must be back to "Assign" (not stale "Assigned").
    fireEvent.click(hire);
    expect(within(first).getByText("Assign")).toBeInTheDocument();
  });

  it("does not clear assignment for an agent that was never assigned when un-hired", () => {
    render(<AgentsRoster />);
    const first = screen.getAllByTestId("roster-agent")[0];
    const hire = within(first).getByTestId("roster-hire");
    // Hire then immediately un-hire WITHOUT assigning — exercises the
    // "assigned set unchanged" branch of the un-hire handler.
    fireEvent.click(hire);
    fireEvent.click(hire);
    expect(screen.getByText(/0 of 6 agents hired/)).toBeInTheDocument();
  });
});
