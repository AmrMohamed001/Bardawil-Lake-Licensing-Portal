/**
 * Token Refresh Utility
 * Automatically refreshes access token before expiry to keep user logged in
 * 
 * NOTE: This script is only included on pages for logged-in users (via EJS conditional).
 * Since cookies are httpOnly, we cannot check their presence via JavaScript.
 * We trust that if this script is loaded, the user was authenticated at page load.
 */

(function () {
    // Refresh ~1 minute before the 2-hour expiry (every 119 minutes)
    // Or more conservatively, every 30 minutes to handle potential clock drift
    const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes

    let isRefreshing = false;

    // Refresh the access token
    const refreshToken = async () => {
        if (isRefreshing) return;
        isRefreshing = true;

        try {
            const response = await fetch('/api/v1/auth/refresh-token', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                // If refresh fails, the session has expired
                console.warn('[TokenRefresh] Refresh failed, session may have expired');
                // Don't immediately redirect - let the next page navigation handle it
                // User might be on a page they can still view
                return;
            }

            const data = await response.json();
            if (data.status === 'success') {
                console.log('[TokenRefresh] Access token refreshed successfully');
            }
        } catch (error) {
            console.error('[TokenRefresh] Error refreshing token:', error);
        } finally {
            isRefreshing = false;
        }
    };

    // Set up automatic refresh interval
    const startAutoRefresh = () => {
        // Refresh periodically (every 30 minutes)
        // Access token lasts 2 hours, so 30m is plenty safe
        // NOTE: We don't refresh immediately on load because the server just validated
        // the token to render this page (if it's a protected route).
        // This prevents race conditions with multiple tabs causing 401s due to token rotation.

        console.log('[TokenRefresh] Starting auto-refresh scheduler (30m interval)');
        setInterval(refreshToken, REFRESH_INTERVAL);
    };

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startAutoRefresh);
    } else {
        startAutoRefresh();
    }
})();
