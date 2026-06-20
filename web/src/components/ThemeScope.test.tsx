import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeScope } from "./ThemeScope.tsx";
import { useThemeScope } from "./theme-context.ts";

function ThemeProbe() {
  const theme = useThemeScope();
  return <span>theme:{theme ?? "none"}</span>;
}

describe("ThemeScope", () => {
  it("applies the marketing data-theme attribute", () => {
    render(
      <ThemeScope theme="marketing">
        <span>content</span>
      </ThemeScope>,
    );
    const child = screen.getByText("content");
    expect(child.parentElement).toHaveAttribute("data-theme", "marketing");
  });

  it("applies the jira data-theme attribute", () => {
    render(
      <ThemeScope theme="jira">
        <span>content</span>
      </ThemeScope>,
    );
    const child = screen.getByText("content");
    expect(child.parentElement).toHaveAttribute("data-theme", "jira");
  });

  it("forwards a className to the scope element", () => {
    render(
      <ThemeScope theme="jira" className="custom">
        <span>content</span>
      </ThemeScope>,
    );
    expect(screen.getByText("content").parentElement).toHaveClass("custom");
  });

  it("renders without children", () => {
    const { container } = render(<ThemeScope theme="marketing" />);
    expect(container.querySelector('[data-theme="marketing"]')).not.toBeNull();
  });

  it("does not let the two scopes share an attribute value", () => {
    render(
      <div>
        <ThemeScope theme="marketing">
          <span>m</span>
        </ThemeScope>
        <ThemeScope theme="jira">
          <span>j</span>
        </ThemeScope>
      </div>,
    );
    expect(screen.getByText("m").parentElement).toHaveAttribute(
      "data-theme",
      "marketing",
    );
    expect(screen.getByText("j").parentElement).toHaveAttribute(
      "data-theme",
      "jira",
    );
  });

  it("exposes the active theme via useThemeScope", () => {
    render(
      <ThemeScope theme="marketing">
        <ThemeProbe />
      </ThemeScope>,
    );
    expect(screen.getByText("theme:marketing")).toBeInTheDocument();
  });

  it("useThemeScope returns null outside any ThemeScope", () => {
    render(<ThemeProbe />);
    expect(screen.getByText("theme:none")).toBeInTheDocument();
  });
});
