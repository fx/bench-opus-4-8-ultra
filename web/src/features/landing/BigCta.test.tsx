import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { BigCta } from "./BigCta.tsx";
import { BIG_CTA } from "./content.ts";

function renderBigCta() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<BigCta />} />
        <Route path="/demo" element={<h1>Demo Destination</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("BigCta", () => {
  it("renders the headline and a demo CTA button", () => {
    renderBigCta();
    expect(
      screen.getByRole("heading", { name: BIG_CTA.headline }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: BIG_CTA.cta })).toHaveAttribute(
      "href",
      "/demo",
    );
  });

  it("routes to /demo client-side when the CTA is clicked", async () => {
    const user = userEvent.setup();
    renderBigCta();
    await user.click(screen.getByRole("link", { name: BIG_CTA.cta }));
    expect(
      screen.getByRole("heading", { name: "Demo Destination" }),
    ).toBeInTheDocument();
  });
});
