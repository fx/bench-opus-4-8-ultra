import { Routes, Route } from "react-router-dom";
import { LandingPage } from "./routes/LandingPage.tsx";
import { DemoPage } from "./routes/DemoPage.tsx";
import { NotFoundPage } from "./routes/NotFoundPage.tsx";

// App defines the client-side route table. The router itself is provided by the
// caller (BrowserRouter in main.tsx; MemoryRouter in tests) so App stays pure
// and testable. Routes are minimal placeholders for the scaffold; real content
// arrives in later changes (landing page, demo app).
export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/demo" element={<DemoPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
