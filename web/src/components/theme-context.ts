import { createContext, useContext } from "react";

// The two supported theme scopes. A subtree wrapped in <ThemeScope theme="...">
// (see ThemeScope.tsx) drives its CSS-variable token set (styles/themes.css) so
// marketing and Jira surfaces coexist without bleeding into each other.
export type ThemeName = "marketing" | "jira";

// The nearest enclosing theme, exposed via context so primitives that escape the
// DOM subtree (Radix portals mount under document.body, outside the [data-theme]
// element) can re-apply the theme to their portalled content. null means no
// ThemeScope is present (e.g. an unscoped test render).
export const ThemeScopeContext = createContext<ThemeName | null>(null);

// useThemeScope returns the active theme name, or null when used outside any
// ThemeScope. Portalled primitives use it to wrap their content in a matching
// data-theme container so themed tokens still resolve.
export function useThemeScope(): ThemeName | null {
  return useContext(ThemeScopeContext);
}
