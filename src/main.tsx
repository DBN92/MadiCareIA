import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/animations.css";
import "./scrollbar-handler.js";

createRoot(document.getElementById("root")!).render(<App />);
