import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Footer } from "./Footer.tsx";
import {
  FOOTER_COLUMNS,
  FOOTER_FINE_PRINT,
  FOOTER_SOCIALS,
  FOOTER_STATUS,
} from "./content.ts";

function renderFooter() {
  return render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
  );
}

describe("Footer", () => {
  it("renders all link columns and their links", () => {
    renderFooter();
    for (const column of FOOTER_COLUMNS) {
      expect(
        screen.getByRole("heading", { name: column.heading }),
      ).toBeInTheDocument();
      for (const link of column.links) {
        expect(screen.getByText(link)).toBeInTheDocument();
      }
    }
  });

  it("renders the status pill, socials, and fine print", () => {
    renderFooter();
    expect(screen.getByText(FOOTER_STATUS)).toBeInTheDocument();
    expect(screen.getByText(FOOTER_FINE_PRINT)).toBeInTheDocument();
    for (const social of FOOTER_SOCIALS) {
      expect(screen.getByText(social)).toBeInTheDocument();
    }
  });

  it("renders the giant ghosted SLOP wordmark as decorative", () => {
    const { container } = renderFooter();
    const ghost = container.querySelector('[aria-hidden="true"]');
    expect(ghost).not.toBeNull();
    expect(screen.getByText("SLOP")).toBeInTheDocument();
  });
});
