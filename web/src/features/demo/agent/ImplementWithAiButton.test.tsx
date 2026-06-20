import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ImplementWithAiButton } from "./ImplementWithAiButton.tsx";
import { useDemoStore } from "../store/store.ts";

beforeEach(() => {
  useDemoStore.getState().reset();
});

describe("ImplementWithAiButton", () => {
  it("starts a run for the issue and calls onStarted", () => {
    const onStarted = vi.fn();
    render(<ImplementWithAiButton issueKey="SLOP-101" onStarted={onStarted} />);
    fireEvent.click(screen.getByTestId("implement-with-ai"));
    expect(useDemoStore.getState().agentRun?.issueKey).toBe("SLOP-101");
    expect(onStarted).toHaveBeenCalledWith("SLOP-101");
  });

  it("works without an onStarted callback", () => {
    render(<ImplementWithAiButton issueKey="SLOP-101" />);
    fireEvent.click(screen.getByTestId("implement-with-ai"));
    expect(useDemoStore.getState().agentRun?.issueKey).toBe("SLOP-101");
  });

  it("renders the full label by default and a compact label when compact", () => {
    const { unmount } = render(<ImplementWithAiButton issueKey="SLOP-101" />);
    expect(screen.getByText("Implement now with AI")).toBeInTheDocument();
    unmount();
    render(<ImplementWithAiButton issueKey="SLOP-101" compact />);
    expect(screen.getByText("AI")).toBeInTheDocument();
  });

  it("disables while THIS issue has a running run, but not for other issues", () => {
    useDemoStore.getState().startAgent("SLOP-101");
    const { unmount } = render(<ImplementWithAiButton issueKey="SLOP-101" />);
    expect(screen.getByTestId("implement-with-ai")).toBeDisabled();
    unmount();
    // A different issue's button is NOT disabled by SLOP-101's run.
    render(<ImplementWithAiButton issueKey="SLOP-102" />);
    expect(screen.getByTestId("implement-with-ai")).not.toBeDisabled();
  });

  it("re-enables once the run is no longer running (cancelled)", () => {
    useDemoStore.getState().startAgent("SLOP-101");
    useDemoStore.getState().cancelAgent();
    render(<ImplementWithAiButton issueKey="SLOP-101" />);
    expect(screen.getByTestId("implement-with-ai")).not.toBeDisabled();
  });

  it("has an accessible label naming the issue", () => {
    render(<ImplementWithAiButton issueKey="SLOP-101" />);
    expect(
      screen.getByLabelText("Implement SLOP-101 now with AI"),
    ).toBeInTheDocument();
  });

  it("stops click + activation-key events from reaching the host card", () => {
    // The compact button lives inside a draggable card whose own onClick opens
    // the detail and whose onKeyDown forwards Space/Enter to the drag sensor.
    // The button must not let those events bubble.
    const cardClick = vi.fn();
    const cardKeyDown = vi.fn();
    render(
      <div onClick={cardClick} onKeyDown={cardKeyDown} data-testid="host-card">
        <ImplementWithAiButton issueKey="SLOP-101" compact />
      </div>,
    );
    const button = screen.getByTestId("implement-with-ai");

    fireEvent.click(button);
    // The run started (button worked) but the card's onClick did NOT fire.
    expect(useDemoStore.getState().agentRun?.issueKey).toBe("SLOP-101");
    expect(cardClick).not.toHaveBeenCalled();

    // Space and Enter on the button do not bubble to the card's keydown.
    fireEvent.keyDown(button, { key: " " });
    fireEvent.keyDown(button, { key: "Enter" });
    expect(cardKeyDown).not.toHaveBeenCalled();
  });

  it("lets non-activation keys bubble (does not swallow arrow navigation)", () => {
    const cardKeyDown = vi.fn();
    render(
      <div onKeyDown={cardKeyDown}>
        <ImplementWithAiButton issueKey="SLOP-101" />
      </div>,
    );
    // An arrow key is not an activation key → it still bubbles (so the card's
    // own keyboard handling, e.g. roving focus, is unaffected).
    fireEvent.keyDown(screen.getByTestId("implement-with-ai"), {
      key: "ArrowRight",
    });
    expect(cardKeyDown).toHaveBeenCalledTimes(1);
  });
});
