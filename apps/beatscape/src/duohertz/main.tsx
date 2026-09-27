import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DuohertzApp } from "./DuohertzApp";
import "./base.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode><DuohertzApp /></StrictMode>,
);
