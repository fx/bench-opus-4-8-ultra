import type { ReactNode } from "react";
import { ThemeScopeContext, type ThemeName } from "./theme-context.ts";

// ThemeScope sets a data-theme attribute on a wrapper element so the enclosed
// subtree adopts that theme's CSS-variable token set (see styles/themes.css),
// letting marketing and Jira surfaces coexist in one SPA without their styles
// bleeding into each other. It also publishes the theme via context
// (theme-context.ts) so portalled primitives can re-apply it. Used by the route
// shells in changes 0003/0004.

export interface ThemeScopeProps {
  theme: ThemeName;
  children?: ReactNode;
  className?: string;
}

export function ThemeScope({ theme, children, className }: ThemeScopeProps) {
  return (
    <ThemeScopeContext.Provider value={theme}>
      <div data-theme={theme} className={className}>
        {children}
      </div>
    </ThemeScopeContext.Provider>
  );
}
