import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import ErrorBoundary from "./components/ErrorBoundary";

console.log("Main.tsx: Starting execution");

// Pre-flight connectivity check for Supabase (Debug mobile issues)
const SUPABASE_BASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_URL = (import.meta.env.PROD && typeof window !== 'undefined')
    ? `${window.location.origin}/supabase-proxy`
    : SUPABASE_BASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (SUPABASE_URL && supabaseKey) {
    console.log(`Pre-flight: Testing ${SUPABASE_URL} with key starting with ${supabaseKey.substring(0, 10)}...`);
    fetch(`${SUPABASE_URL}/rest/v1/`, {
        headers: { "apikey": supabaseKey }
    })
        .then(r => {
            const msg = `Supabase Connectivity Test: ${r.ok ? "SUCCESS" : "FAILED (Status: " + r.status + ")"}`;
            console.log(msg);
            // Alert only if it fails to help diagnose
            if (!r.ok) {
                const keyType = supabaseKey.startsWith("sb_") ? "PUBLISHABLE (Wrong for REST)" : "JWT (Likely correct)";
                alert(`${msg}. \nTarget: ${SUPABASE_URL} \nKey Type: ${keyType} \nPlease check Vercel Env Vars.`);
            }
        })
        .catch(e => {
            const msg = `Supabase Connectivity Test: ERROR ${e.message}`;
            console.error(msg, e);
            alert(`${msg}. \nTarget: ${SUPABASE_URL}. \nThis is a network/CORS error.`);
        });
}

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
