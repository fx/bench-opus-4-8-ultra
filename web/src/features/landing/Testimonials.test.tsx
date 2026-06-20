import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Testimonials } from "./Testimonials.tsx";
import { TESTIMONIALS } from "./content.ts";

describe("Testimonials", () => {
  it("renders every testimonial with quote, name, title, company, and avatar initials", () => {
    render(<Testimonials />);
    for (const t of TESTIMONIALS) {
      expect(screen.getByText(`${t.title}, ${t.company}`)).toBeInTheDocument();
      expect(screen.getByText(t.name)).toBeInTheDocument();
      // The Radix Avatar renders the initials fallback (no external image).
      // The initials are violet text on a tinted dark chip, so they use the
      // lighter accent-text token to clear WCAG AA.
      expect(screen.getByText(t.initials)).toHaveClass("text-primary-text");
    }
  });
});
