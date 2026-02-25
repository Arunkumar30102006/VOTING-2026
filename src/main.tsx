import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import ErrorBoundary from "./components/ErrorBoundary";

console.log("Main.tsx: Starting execution");

// Pre-flight connectivity check for Supabase (Debug mobile issues)
fetch("https://tpfvvuuumfuvbqkackwk.supabase.co/rest/v1/", {
    headers: { "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY }
})
    .then(r => {
        const msg = "Supabase Connectivity Test: " + (r.ok ? "SUCCESS" : "FAILED (Status: " + r.status + ")");
        console.log(msg);
        // Only alert on mobile to avoid bothering desktop users
        if (!r.ok && /Mobi|Android/i.test(navigator.userAgent)) {
            alert(msg + ". Please check if your mobile network blocks supabase.co");
        }
    })
    .catch(e => {
        const msg = "Supabase Connectivity Test: ERROR " + e.message;
        console.error(msg, e);
        if (/Mobi|Android/i.test(navigator.userAgent)) {
            alert(msg + ". This usually means a network-level block or firewall.");
        }
    });

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
