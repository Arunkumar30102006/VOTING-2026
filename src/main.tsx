import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import ErrorBoundary from "./components/ErrorBoundary";

console.log("Main.tsx: Starting execution");

// Pre-flight connectivity check for Supabase (Debug mobile issues)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (supabaseUrl && supabaseKey) {
    console.log(`Pre-flight: Testing ${supabaseUrl} with key starting with ${supabaseKey.substring(0, 10)}...`);
    fetch(`${supabaseUrl}/rest/v1/`, {
        headers: { "apikey": supabaseKey }
    })
        .then(r => {
            const msg = `Supabase Connectivity Test: ${r.ok ? "SUCCESS" : "FAILED (Status: " + r.status + ")"}`;
            console.log(msg);
            // Alert always for now to help the user diagnose mobile
            if (!r.ok) {
                const keyType = supabaseKey.startsWith("sb_") ? "PUBLISHABLE (Wrong for REST)" : "JWT (Likely correct)";
                alert(`${msg}. \nURL: ${supabaseUrl} \nKey Type: ${keyType} \nKey Preview: ${supabaseKey.substring(0, 10)}... \nPlease check Vercel Env Vars.`);
            }
        })
        .catch(e => {
            const msg = `Supabase Connectivity Test: ERROR ${e.message}`;
            console.error(msg, e);
            alert(`${msg}. \nTarget: ${supabaseUrl}. \nThis is a network/CORS error.`);
        });
} else {
    console.error("Supabase environment variables are missing!");
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
