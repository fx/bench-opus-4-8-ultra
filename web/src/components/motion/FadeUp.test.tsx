import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Capture the props handed to motion.div so we can assert which variant set,
// transition, and animate strategy FadeUp selected — without depending on the
// real Motion runtime's DOM output.
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

import { FadeUp } from "./FadeUp.tsx";
import { fadeUpVariants, fadeUpReducedVariants } from "./easings.ts";

describe("FadeUp", () => {
  beforeEach(() => {
    captured.props = [];
    reducedRef.value = false;
  });

  it("renders its children", () => {
    render(<FadeUp>hello</FadeUp>);
    expect(screen.getByTestId("motion-div")).toHaveTextContent("hello");
  });

  it("uses the translate variant and whileInView by default", () => {
    render(<FadeUp>x</FadeUp>);
    const props = captured.props[0];
    expect(props.variants).toBe(fadeUpVariants);
    expect(props.whileInView).toBe("visible");
    expect(props.viewport).toEqual({ once: true, amount: 0.3 });
    expect(props.animate).toBeUndefined();
  });

  it("uses the reduced variant under reduced motion", () => {
    reducedRef.value = true;
    render(<FadeUp>x</FadeUp>);
    expect(captured.props[0].variants).toBe(fadeUpReducedVariants);
  });

  it("animates on mount when whileInView is false", () => {
    render(<FadeUp whileInView={false}>x</FadeUp>);
    const props = captured.props[0];
    expect(props.animate).toBe("visible");
    expect(props.whileInView).toBeUndefined();
  });

  it("applies a custom delay to the transition", () => {
    render(<FadeUp delay={0.4}>x</FadeUp>);
    expect(captured.props[0].transition).toMatchObject({ delay: 0.4 });
  });

  it("forwards className", () => {
    render(<FadeUp className="lead">x</FadeUp>);
    expect(captured.props[0].className).toBe("lead");
  });
});
