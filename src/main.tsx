import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import ErrorBoundary from "./components/ErrorBoundary";

console.log("Main.tsx: Starting execution");

// Pre-flight connectivity check for Supabase (Debug mobile issues)
fetch("https://tpfvvuuumfuvbqkackwk.supabase.co/rest/v1/", {
    headers: { "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY }
})
    .then(r => console.log("Supabase Connectivity Test:", r.ok ? "SUCCESS" : "FAILED (Status: " + r.status + ")"))
    .catch(e => console.error("Supabase Connectivity Test: ERROR", e));

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
