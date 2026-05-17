import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n"; // ← import i18n BEFORE App renders

createRoot(document.getElementById("root")!).render(<App />);
