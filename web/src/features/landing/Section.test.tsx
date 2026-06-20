import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Section } from "./Section.tsx";

describe("Section", () => {
  it("renders the header (eyebrow, title, lede) and children with an id", () => {
    const { container } = render(
      <Section
        id="demo-section"
        eyebrow="Eyebrow"
        title="A Title"
        lede="Some lede"
        className="extra"
        containerClassName="container-extra"
      >
        <p>Body</p>
      </Section>,
    );
    // The eyebrow/overline is violet text on the dark page, so it uses the
    // lighter accent-text token (text-primary-text) to clear WCAG AA — not the
    // darker --primary used for button backgrounds.
    expect(screen.getByText("Eyebrow")).toHaveClass("text-primary-text");
    expect(
      screen.getByRole("heading", { name: "A Title" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Some lede")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
    const section = container.querySelector("section");
    expect(section).toHaveAttribute("id", "demo-section");
    expect(section).toHaveClass("extra");
    expect(container.querySelector(".container-extra")).not.toBeNull();
  });

  it("omits the header block entirely when no header copy is provided", () => {
    render(
      <Section>
        <p>Only body</p>
      </Section>,
    );
    expect(screen.getByText("Only body")).toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("renders a partial header when only the title is provided", () => {
    render(<Section title="Solo title">child</Section>);
    expect(
      screen.getByRole("heading", { name: "Solo title" }),
    ).toBeInTheDocument();
  });
});
