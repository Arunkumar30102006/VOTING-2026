export const env = {
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string,
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    IS_DEV: import.meta.env.DEV,
    APP_URL: window.location.origin,
};

if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    console.error("Missing Supabase Environment Variables");
}
