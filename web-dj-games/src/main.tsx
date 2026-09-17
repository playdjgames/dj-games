import { createRoot } from "react-dom/client";

import App from "./App.tsx";
import { watchForStaleBuild } from "@/lib/stale-build-recovery";
import "./index.css";

watchForStaleBuild();

createRoot(document.getElementById("root")!).render(<App />);
