import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "coverage"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
  // Config and Node-context files use the Node global set.
  {
    files: ["*.config.{js,ts}"],
    languageOptions: {
      globals: globals.node,
    },
  },
  // shadcn/ui primitives intentionally co-export their `cva` variant helpers
  // (e.g. buttonVariants) alongside the component, which the Fast-Refresh rule
  // flags. These are static primitives, not HMR-sensitive app components, so the
  // rule is disabled for the ui/ directory.
  {
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
);
