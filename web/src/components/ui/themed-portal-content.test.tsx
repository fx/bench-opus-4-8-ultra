import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemedPortalContent } from "./themed-portal-content.tsx";
import { ThemeScope } from "../ThemeScope.tsx";

describe("ThemedPortalContent", () => {
  it("renders children as-is when there is no enclosing ThemeScope", () => {
    const { container } = render(
      <ThemedPortalContent>
        <span>content</span>
      </ThemedPortalContent>,
    );
    expect(screen.getByText("content")).toBeInTheDocument();
    // No wrapping data-theme element is added outside any scope.
    expect(container.querySelector("[data-theme]")).toBeNull();
  });

  it("re-applies the enclosing theme to portalled content", () => {
    render(
      <ThemeScope theme="jira">
        <ThemedPortalContent>
          <span>content</span>
        </ThemedPortalContent>
      </ThemeScope>,
    );
    const wrapper = screen
      .getByText("content")
      .closest('[data-theme="jira"].contents');
    expect(wrapper).not.toBeNull();
  });

  it("uses the marketing theme when scoped to marketing", () => {
    render(
      <ThemeScope theme="marketing">
        <ThemedPortalContent>
          <span>content</span>
        </ThemedPortalContent>
      </ThemeScope>,
    );
    expect(
      screen.getByText("content").closest('[data-theme="marketing"]'),
    ).not.toBeNull();
  });
});
