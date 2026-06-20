import type { ReactNode } from "react";
import { useThemeScope } from "../theme-context.ts";

// Radix portals mount their content under document.body, outside the
// [data-theme] element that defines the theme's CSS variables — so themed
// utility classes on portalled content (dialogs, menus, tooltips) would resolve
// with unset variables. ThemedPortalContent re-applies the active theme by
// wrapping the portalled children in a matching data-theme element. When there
// is no enclosing ThemeScope it renders children as-is (no extra wrapper), so
// unscoped usage and tests are unaffected.
export function ThemedPortalContent({ children }: { children: ReactNode }) {
  const theme = useThemeScope();
  if (!theme) {
    return <>{children}</>;
  }
  // `contents` keeps this wrapper layout-neutral while still carrying the theme
  // variables down to the portalled subtree.
  return (
    <div data-theme={theme} className="contents">
      {children}
    </div>
  );
}
