/**
 * Token Refresh Utility
 * Automatically refreshes access token before expiry to keep user logged in
 */

(function () {
    const REFRESH_INTERVAL = 14 * 60 * 1000; // Refresh every 14 minutes (before 15 min expiry)

    // Check if user is logged in (has access token cookie)
    const isLoggedIn = () => {
        return document.cookie.includes('accessToken') || document.cookie.includes('refreshToken');
    };

    // Refresh the access token
    const refreshToken = async () => {
        if (!isLoggedIn()) return;

        try {
            const response = await fetch('/api/v1/auth/refresh-token', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                // If refresh fails, user may need to login again
                console.log('Token refresh failed, session may have expired');
                return;
            }

            console.log('Access token refreshed successfully');
        } catch (error) {
            console.error('Error refreshing token:', error);
        }
    };

    // Set up automatic refresh interval
    const startAutoRefresh = () => {
        if (!isLoggedIn()) return;

        // Refresh immediately on page load if logged in
        setTimeout(refreshToken, 5000); // Wait 5 seconds after page load

        // Then refresh every 14 minutes
        setInterval(refreshToken, REFRESH_INTERVAL);
    };

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startAutoRefresh);
    } else {
        startAutoRefresh();
    }
})();
