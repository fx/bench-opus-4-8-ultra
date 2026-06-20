import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const captured: { props: Record<string, unknown>[] } = { props: [] };
vi.mock("motion/react", () => ({
  motion: {
    div: ({
      children,
      ...props
    }: {
      children?: React.ReactNode;
    } & Record<string, unknown>) => {
      captured.props.push(props);
      return <div data-testid="motion-div">{children}</div>;
    },
  },
}));

const reducedRef = { value: false };
vi.mock("./use-reduced-motion-safe.ts", () => ({
  useReducedMotionSafe: () => reducedRef.value,
}));

import { Stagger } from "./Stagger.tsx";
import { staggerContainerVariants } from "./easings.ts";

describe("Stagger", () => {
  beforeEach(() => {
    captured.props = [];
    reducedRef.value = false;
  });

  it("renders its children", () => {
    render(<Stagger>kids</Stagger>);
    expect(screen.getByTestId("motion-div")).toHaveTextContent("kids");
  });

  it("orchestrates children via the stagger variant by default", () => {
    render(<Stagger>x</Stagger>);
    const props = captured.props[0];
    expect(props.variants).toBe(staggerContainerVariants);
    expect(props.whileInView).toBe("visible");
    expect(props.viewport).toEqual({ once: true, amount: 0.2 });
  });

  it("drops the stagger variant under reduced motion", () => {
    reducedRef.value = true;
    render(<Stagger>x</Stagger>);
    expect(captured.props[0].variants).toBeUndefined();
  });

  it("animates on mount when whileInView is false", () => {
    render(<Stagger whileInView={false}>x</Stagger>);
    const props = captured.props[0];
    expect(props.animate).toBe("visible");
    expect(props.whileInView).toBeUndefined();
  });

  it("forwards className", () => {
    render(<Stagger className="grid">x</Stagger>);
    expect(captured.props[0].className).toBe("grid");
  });
});
