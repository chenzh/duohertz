import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { lazy, Suspense } from "react";
import "./styles.css";

const App = __PORTAL__
  ? lazy(() => import("./Portal").then((m) => ({ default: m.Portal })))
  : lazy(() => import("./App").then((m) => ({ default: m.App })));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={<p role="status">MusicSaas…</p>}><App /></Suspense>
  </StrictMode>,
);
