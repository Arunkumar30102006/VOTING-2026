/**
 * Google Analytics Event Tracking Utility
 * Helper to ensure consistent event naming and reliable tracking
 */

type EventParams = {
    [key: string]: any;
};

/**
 * Tracks a custom event in Google Analytics
 * @param action The event name/action
 * @param params Additional event parameters (category, label, value, etc.)
 */
export const trackEvent = (action: string, params?: EventParams) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', action, params);
    } else {
        console.warn(`Analytics: gtag not found for event "${action}"`, params);
    }
};

/**
 * Common event presets for the platform
 */
export const AnalyticsEvents = {
    // Conversion Events
    REGISTER_CLICK: 'register_click',
    LOGIN_CLICK: 'login_click',
    VOTE_CAST: 'vote_cast',
    AI_SUMMARY_REQUEST: 'ai_summary_request',
    AI_CHAT_REQUEST: 'ai_chat_request',

    // Navigation
    NAV_LINK_CLICK: 'nav_link_click',
    FOOTER_LINK_CLICK: 'footer_link_click',
};
