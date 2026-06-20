import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The Go server is the single origin the developer visits. Vite runs behind it
// and its HMR websocket must connect back to the Go port (PORT, default 8080),
// not Vite's own 5173 — otherwise HMR would bypass the single-port contract.
//
// Parse PORT defensively: an unset, empty, non-numeric, or non-positive value
// must fall back to 8080 rather than yield NaN (which would silently break the
// HMR client port).
const DEFAULT_GO_PORT = 8080;
const parsedPort = Number(process.env.PORT);
const goPort =
  Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : DEFAULT_GO_PORT;

export default defineConfig({
  plugins: [react()],
  server: {
    // Bind all interfaces so the dev server is reachable across the network
    // (e.g. over Tailscale), and accept any Host header for the same reason.
    host: true,
    allowedHosts: true,
    port: 5173,
    strictPort: true,
    hmr: {
      // Route the browser's HMR socket back through the Go server's port.
      clientPort: goPort,
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
