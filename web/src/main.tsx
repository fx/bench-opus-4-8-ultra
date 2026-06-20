import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App.tsx";

// Bootstrap: mounts the app onto the real #root element. Excluded from coverage
// (see vitest.config.ts) — there is no logic here to assert, only DOM wiring.
// The router is mounted here (not in App) so tests can wrap <App /> in their
// own MemoryRouter.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
