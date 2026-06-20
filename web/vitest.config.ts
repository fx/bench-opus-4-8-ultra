import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Vitest config is kept separate from vite.config.ts so the dev-server HMR
// settings (which read process.env.PORT) never affect the test run.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      // Only first-party source is measured. Config/entry/test scaffolding is
      // excluded with justification:
      //  - main.tsx: the React/DOM bootstrap (ReactDOM.createRoot on a real
      //    #root element); it has no logic to assert and cannot run under
      //    jsdom-as-unit without rendering the whole app. App/router/routes are
      //    fully covered instead.
      //  - *.config.*, test setup, and type-only files carry no testable logic.
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/main.tsx",
        "src/test/**",
        "src/**/*.d.ts",
        "**/*.config.*",
      ],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
