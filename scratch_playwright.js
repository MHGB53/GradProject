const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err));

    await page.goto('http://localhost:8000/html/community.html');

    // we need to set localStorage to have a valid token to bypass requireAuth
    // or we can login first.
    await page.goto('http://localhost:8000/html/Login.html');
    await page.fill('#username', 'testuser'); // assuming testuser exists? I might not know the login.
    
    await browser.close();
})();
