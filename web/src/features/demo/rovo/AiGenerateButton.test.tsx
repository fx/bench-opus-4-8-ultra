import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AiGenerateButton } from "./AiGenerateButton.tsx";

describe("AiGenerateButton", () => {
  it("renders its label + children and fires onGenerate on click", () => {
    const onGenerate = vi.fn();
    render(
      <AiGenerateButton label="AI-generate description" onGenerate={onGenerate}>
        AI generate
      </AiGenerateButton>,
    );
    const button = screen.getByTestId("ai-generate");
    expect(button).toHaveAttribute("aria-label", "AI-generate description");
    expect(screen.getByText("AI generate")).toBeInTheDocument();
    fireEvent.click(button);
    expect(onGenerate).toHaveBeenCalledTimes(1);
  });
});
