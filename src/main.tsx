import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import ErrorBoundary from "./components/ErrorBoundary";

console.log("Main.tsx: Starting execution");

const rootElement = document.getElementById("root");
console.log("Main.tsx: Root element found:", !!rootElement);

if (rootElement) {
    const root = createRoot(rootElement);
    console.log("Main.tsx: Created root, rendering App");
    root.render(
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    );
} else {
    console.error("Main.tsx: Root element MISSING");
}
