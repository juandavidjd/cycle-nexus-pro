import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

try {
  createRoot(document.getElementById("root")!).render(<App />);
} catch (e) {
  console.error("FATAL RENDER ERROR:", e);
  // Fallback: render LiveODI directly
  import("./components/LiveODI").then(({ default: LiveODI }) => {
    createRoot(document.getElementById("root")!).render(<LiveODI />);
  });
}
