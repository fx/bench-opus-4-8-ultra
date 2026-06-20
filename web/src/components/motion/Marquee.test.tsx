import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const reducedRef = { value: false };
vi.mock("./use-reduced-motion-safe.ts", () => ({
  useReducedMotionSafe: () => reducedRef.value,
}));

import { Marquee } from "./Marquee.tsx";

describe("Marquee", () => {
  beforeEach(() => {
    reducedRef.value = false;
  });

  it("duplicates the track for a seamless loop when motion is allowed", () => {
    render(
      <Marquee>
        <span>logo</span>
      </Marquee>,
    );
    // Two copies of the content render (one visible, one inert duplicate).
    const copies = screen.getAllByText("logo");
    expect(copies).toHaveLength(2);
    const wrapper = copies[0].closest("[data-reduced]");
    expect(wrapper).toHaveAttribute("data-reduced", "false");
    // The first copy is focusable/visible; the duplicate is inert (removed from
    // the focus + a11y order) so keyboard users can't tab into the clone.
    expect(copies[0].parentElement).not.toHaveAttribute("inert");
    expect(copies[1].parentElement).toHaveAttribute("inert");
  });

  it("applies the marquee animation class and duration variable", () => {
    const { container } = render(
      <Marquee durationSeconds={12}>
        <span>x</span>
      </Marquee>,
    );
    const track = container.querySelector(".animate-marquee") as HTMLElement;
    expect(track).not.toBeNull();
    expect(track.style.getPropertyValue("--marquee-duration")).toBe("12s");
  });

  it("renders the content once with no animation under reduced motion", () => {
    reducedRef.value = true;
    const { container } = render(
      <Marquee>
        <span>logo</span>
      </Marquee>,
    );
    expect(screen.getAllByText("logo")).toHaveLength(1);
    expect(container.querySelector(".animate-marquee")).toBeNull();
    expect(container.querySelector('[data-reduced="true"]')).not.toBeNull();
  });

  it("forwards className onto the outer wrapper in both modes", () => {
    const { container, rerender } = render(
      <Marquee className="band">
        <span>x</span>
      </Marquee>,
    );
    expect(container.querySelector(".band")).not.toBeNull();
    reducedRef.value = true;
    rerender(
      <Marquee className="band">
        <span>x</span>
      </Marquee>,
    );
    expect(container.querySelector(".band")).not.toBeNull();
  });
});
