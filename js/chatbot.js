// ═══════════════════════════════════════════════════════════════════
//  Dentor Chatbot – chatbot.js
//  Handles the full chat UI + API integration with /api/chat
// ═══════════════════════════════════════════════════════════════════

// ── Conversation history (sent to backend with each request) ──────
let chatHistory = [];

// ── Dark Mode (delegates to global ThemeManager) ──────────────────
function initializeDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const darkModeIcon   = document.getElementById('darkModeIcon');
    const logoImage      = document.getElementById('logoImage');

    const lightLogo = '../assets/Logo.png';
    const darkLogo  = '../assets/Logo0.png';

    if (!darkModeToggle) return;

    darkModeToggle.addEventListener('click', function () {
        const newTheme = ThemeManager.toggleTheme();
        if (darkModeIcon) darkModeIcon.textContent = newTheme === 'dark' ? 'dark_mode' : 'light_mode';
        if (logoImage) {
            logoImage.style.opacity = '0';
            setTimeout(() => {
                logoImage.src = newTheme === 'dark' ? darkLogo : lightLogo;
                logoImage.style.opacity = '1';
            }, 150);
        }
    });

    const currentTheme = ThemeManager.getCurrentTheme();
    if (logoImage) logoImage.src = currentTheme === 'dark' ? darkLogo : lightLogo;
    if (darkModeIcon) darkModeIcon.textContent = currentTheme === 'dark' ? 'dark_mode' : 'light_mode';
}

// ── Navigation ────────────────────────────────────────────────────
function initializeNavigation() {
    const navLinks  = document.querySelectorAll('.nav-link');
    const currentPage = 'chatbot';

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            if (this.getAttribute('href') === '#') e.preventDefault();
            navLinks.forEach(nl => {
                nl.classList.remove('active', 'text-white', 'bg-primary', 'shadow-lg', 'shadow-primary/30');
                nl.classList.add('text-text-secondary', 'dark:text-dark-text-secondary');
            });
            this.classList.add('active', 'text-white', 'bg-primary', 'shadow-lg', 'shadow-primary/30');
            this.classList.remove('text-text-secondary', 'dark:text-dark-text-secondary');
        });
    });

    setActivePage(currentPage);
}

function setActivePage(pageName) {
    document.querySelectorAll('.nav-link').forEach(link => {
        const isActive = link.getAttribute('data-page') === pageName;
        link.classList.toggle('active', isActive);
        link.classList.toggle('text-white', isActive);
        link.classList.toggle('bg-primary', isActive);
        link.classList.toggle('shadow-lg', isActive);
        link.classList.toggle('shadow-primary/30', isActive);
        link.classList.toggle('text-text-secondary', !isActive);
        link.classList.toggle('dark:text-dark-text-secondary', !isActive);
    });
}

// ── Mobile Menu ───────────────────────────────────────────────────
function initializeMobileMenu() {
    const mobileMenuBtn      = document.getElementById('mobileMenuBtn');
    const mobileSidebar      = document.getElementById('mobileSidebar');
    const mobileSidebarPanel = document.getElementById('mobileSidebarPanel');
    const closeMobileMenu    = document.getElementById('closeMobileMenu');

    mobileMenuBtn?.addEventListener('click', () => {
        mobileSidebar.classList.remove('hidden');
        setTimeout(() => mobileSidebarPanel.classList.remove('-translate-x-full'), 10);
    });

    const closeSidebar = () => {
        mobileSidebarPanel.classList.add('-translate-x-full');
        setTimeout(() => mobileSidebar.classList.add('hidden'), 300);
    };

    closeMobileMenu?.addEventListener('click', closeSidebar);
    mobileSidebar?.addEventListener('click', e => { if (e.target === mobileSidebar) closeSidebar(); });
}

// ── Hide current page from Features dropdown ──────────────────────
function hideCurrentPageFromDropdown() {
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    document.querySelectorAll('.absolute.left-0.mt-2 a[href]').forEach(link => {
        link.parentElement.style.display = link.getAttribute('href') === currentPage ? 'none' : '';
    });
}

// ══════════════════════════════════════════════════════════════════
//  CHAT ENGINE
// ══════════════════════════════════════════════════════════════════
function initializeChat() {
    const messageInput = document.getElementById('messageInput');
    const sendButton   = document.getElementById('sendButton');
    const chatBox      = document.getElementById('chatArea');   // existing id in HTML

    if (!chatBox || !messageInput || !sendButton) return;

    // ── Helper: Escape HTML ──────────────────────────────────────
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ── Helper: Scroll chat to bottom ───────────────────────────
    function scrollToBottom() {
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // ── Render user bubble ───────────────────────────────────────
    function appendUserMessage(text) {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const avatarUrl = userData.avatar_url
            ? `/uploads/profiles/${userData.avatar_url}`
            : '../assets/default photo.png';

        const div = document.createElement('div');
        div.className = 'flex items-start gap-3 justify-end animate-fade-in';
        div.innerHTML = `
            <div class="bg-gradient-to-br from-primary to-primary-dark text-white rounded-2xl rounded-tr-none p-4 shadow-lg max-w-2xl">
                <p class="text-sm leading-relaxed whitespace-pre-wrap">${escapeHtml(text)}</p>
            </div>
            <div class="w-10 h-10 rounded-full bg-cover bg-center shrink-0 border-2 border-primary shadow-lg"
                 style="background-image: url('${avatarUrl}');"></div>
        `;
        chatBox.appendChild(div);
        scrollToBottom();
    }

    // ── Render bot bubble ────────────────────────────────────────
    function appendBotMessage(text) {
        const div = document.createElement('div');
        div.className = 'flex items-start gap-3 animate-fade-in';
        div.innerHTML = `
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-green-400 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg">
                D
            </div>
            <div class="bg-card dark:bg-dark-card rounded-2xl rounded-tl-none p-4 shadow-lg max-w-2xl border border-border-color dark:border-dark-border-color">
                <p class="text-sm text-text-primary dark:text-dark-text-primary leading-relaxed whitespace-pre-wrap">${escapeHtml(text)}</p>
            </div>
        `;
        chatBox.appendChild(div);
        scrollToBottom();
    }

    // ── Render error bubble ──────────────────────────────────────
    function appendErrorMessage(text) {
        const div = document.createElement('div');
        div.className = 'flex items-start gap-3 animate-fade-in';
        div.innerHTML = `
            <div class="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white shrink-0 shadow-lg">
                <span class="material-symbols-outlined text-sm">error</span>
            </div>
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl rounded-tl-none p-4 max-w-2xl">
                <p class="text-sm text-red-700 dark:text-red-400 leading-relaxed">${escapeHtml(text)}</p>
            </div>
        `;
        chatBox.appendChild(div);
        scrollToBottom();
    }

    // ── Typing indicator ─────────────────────────────────────────
    function showTypingIndicator() {
        const div = document.createElement('div');
        div.id        = 'typingIndicator';
        div.className = 'flex items-start gap-3 animate-fade-in';
        div.innerHTML = `
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-green-400 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg">
                D
            </div>
            <div class="bg-card dark:bg-dark-card rounded-2xl rounded-tl-none p-4 shadow-lg border border-border-color dark:border-dark-border-color">
                <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay:0s"></span>
                    <span class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay:0.15s"></span>
                    <span class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay:0.30s"></span>
                </div>
            </div>
        `;
        chatBox.appendChild(div);
        scrollToBottom();
    }

    function hideTypingIndicator() {
        document.getElementById('typingIndicator')?.remove();
    }

    // ── Disable/enable input while waiting ───────────────────────
    function setInputBusy(busy) {
        messageInput.disabled = busy;
        sendButton.disabled   = busy;
        sendButton.classList.toggle('opacity-50', busy);
        sendButton.classList.toggle('cursor-not-allowed', busy);
    }

    // ── Core send function ───────────────────────────────────────
    async function sendMessage() {
        const text = messageInput.value.trim();
        if (!text) return;

        // 1. Show user message immediately
        appendUserMessage(text);
        messageInput.value = '';

        // 2. Add to history BEFORE the request
        chatHistory.push({ role: 'user', content: text });

        // 3. Show typing indicator & lock input
        setInputBusy(true);
        showTypingIndicator();

        try {
            // 4. POST to backend
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    history: chatHistory.slice(0, -1)   // send history BEFORE this message
                })
            });

            hideTypingIndicator();

            if (!res.ok) {
                // Attempt to read error detail from FastAPI
                let detail = `Server error (${res.status})`;
                try {
                    const err = await res.json();
                    if (err.detail) detail = err.detail;
                } catch (_) { /* ignore */ }
                appendErrorMessage(`⚠️ ${detail}`);
                // Remove user message from history since we got no reply
                chatHistory.pop();
                return;
            }

            const data = await res.json();
            const reply = data.reply ?? 'No response received.';

            // 5. Show bot reply
            appendBotMessage(reply);

            // 6. Update history with bot's reply
            chatHistory.push({ role: 'assistant', content: reply });

        } catch (networkErr) {
            hideTypingIndicator();
            appendErrorMessage('⚠️ تعذّر الوصول إلى الخادم. تحقّق من اتصالك بالإنترنت وأعد المحاولة.');
            // Remove user message from history since request failed
            chatHistory.pop();
        } finally {
            setInputBusy(false);
            messageInput.focus();
        }
    }

    // ── Event listeners ──────────────────────────────────────────
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // ── Welcome message ──────────────────────────────────────────
    appendBotMessage('مرحباً! 🦷 أنا Dentor، مساعدك الذكي في طب الأسنان. كيف يمكنني مساعدتك اليوم؟\n\nHello! I\'m Dentor, your AI dental assistant. How can I help you today?');
}

// ═══════════════════════════════════════════════════════════════════
//  DOMContentLoaded – wire everything up
// ═══════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function () {
    initializeMobileMenu();
    initializeDarkMode();
    initializeNavigation();
    hideCurrentPageFromDropdown();

    const notificationBtn      = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const profileBtn           = document.getElementById('profileBtn');
    const profileDropdown      = document.getElementById('profileDropdown');

    // ── Populate profile dropdown from localStorage ──────────────
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData.full_name) {
        const nameEl = profileDropdown?.querySelector('h3');
        if (nameEl) nameEl.textContent = userData.full_name;
    }
    if (userData.email) {
        const emailEl = profileDropdown?.querySelector('p.text-xs');
        if (emailEl) emailEl.textContent = userData.email;
    }
    if (userData.avatar_url) {
        const avatarUrl = `/uploads/profiles/${userData.avatar_url}`;
        [profileBtn, profileDropdown?.querySelector('.w-12.h-12.rounded-full')]
            .forEach(el => el && (el.style.backgroundImage = `url('${avatarUrl}')`));
    }

    // Notification dropdown
    notificationBtn?.addEventListener('click', e => {
        e.stopPropagation();
        notificationDropdown?.classList.toggle('hidden');
        profileDropdown?.classList.add('hidden');
    });

    // Profile dropdown
    profileBtn?.addEventListener('click', e => {
        e.stopPropagation();
        profileDropdown?.classList.toggle('hidden');
        notificationDropdown?.classList.add('hidden');
    });

    // Close on outside click / Escape
    document.addEventListener('click', e => {
        if (!notificationBtn?.contains(e.target)) notificationDropdown?.classList.add('hidden');
        if (!profileBtn?.contains(e.target))      profileDropdown?.classList.add('hidden');
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            notificationDropdown?.classList.add('hidden');
            profileDropdown?.classList.add('hidden');
        }
    });

    // ── Boot the chat ────────────────────────────────────────────
    initializeChat();
});