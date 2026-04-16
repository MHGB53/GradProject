// ── Auth Guard & Global Logout Interceptor ────────────────────────────────────

// Wrap the auth guard logic in a function so it can be called on multiple events
async function runAuthGuard() {
    // 1. Intercept Logout links across all pages
    const authLinks = document.querySelectorAll('a[href*="ogin.html"]'); // Catches Login.html and login.html
    authLinks.forEach(link => {
        const text = link.textContent.toLowerCase();
        // Prevent adding multiple listeners if runAuthGuard is called multiple times
        if (!link.dataset.logoutGuarded && (text.includes('logout') || text.includes('sign out'))) {
            link.dataset.logoutGuarded = 'true';
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                const token = localStorage.getItem('access_token');

                // Call backend logout endpoint if a token exists
                if (token) {
                    try {
                        await fetch('http://localhost:8000/api/auth/logout', {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}` },
                            // Keepalive ensures the request finishes even if the page redirects quickly
                            keepalive: true
                        });
                    } catch (err) {
                        console.error('Backend logout failed:', err);
                    }
                }

                // Clear state regardless of backend success
                localStorage.removeItem('access_token');
                localStorage.removeItem('token_type');
                localStorage.removeItem('user');

                // Force a fresh load of the login page instead of loading from cache
                window.location.replace(link.href);
            });
        }
    });

    // 2. Auth Guard: Automatically protect routes
    const path = window.location.pathname.toLowerCase();
    const isPublicPage = path.includes('login.html') || path.includes('forget_password');

    if (!isPublicPage) {
        const token = localStorage.getItem('access_token');

        // No token present -> kick them out
        if (!token) {
            window.location.replace('Login.html');
            return;
        }

        // Validate token with backend
        try {
            const res = await fetch('http://localhost:8000/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 401 || res.status === 403) {
                // Token is invalid, expired, or account deactivated
                localStorage.removeItem('access_token');
                localStorage.removeItem('user');
                window.location.replace('Login.html');
            }
        } catch (err) {
            console.error('Auth verification failed', err);
        }
    }
}

// Run on initial load
document.addEventListener('DOMContentLoaded', runAuthGuard);

// Run whenever the page is shown (specifically catches the "Back" button in Chrome / BFCache)
window.addEventListener('pageshow', (event) => {
    // event.persisted is true if the page is being restored from the back/forward cache
    if (event.persisted) {
        runAuthGuard();
    }
});
