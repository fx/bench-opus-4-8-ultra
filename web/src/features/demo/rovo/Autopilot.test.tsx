import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Autopilot } from "./Autopilot.tsx";
import { useDemoStore } from "../store/store.ts";

// Autopilot is now purely the toggle's presentation + the on/off store action;
// the actual autonomous ticking is driven by the shell clock (covered in
// use-demo-clocks.test.tsx). These tests cover the toggle UI + store wiring.

beforeEach(() => {
  useDemoStore.getState().reset();
});

describe("Autopilot", () => {
  it("reflects and toggles the store flag", () => {
    render(<Autopilot />);
    const toggle = screen.getByRole("switch", { name: "Agentic Autopilot" });
    expect(toggle).not.toBeChecked();

    fireEvent.click(toggle);
    expect(useDemoStore.getState().autopilotEnabled).toBe(true);
    expect(screen.getByRole("switch")).toBeChecked();
    // Copy + icon switch to the "running" treatment when ON.
    expect(screen.getByText("Rovo is running the sprint…")).toBeInTheDocument();
  });

  it("toggles back off", () => {
    useDemoStore.getState().toggleAutopilot();
    render(<Autopilot />);
    expect(screen.getByRole("switch")).toBeChecked();
    fireEvent.click(screen.getByRole("switch"));
    expect(useDemoStore.getState().autopilotEnabled).toBe(false);
    expect(screen.getByText("Let Rovo run the sprint")).toBeInTheDocument();
  });
});
