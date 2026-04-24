// ═══════════════════════════════════════════════════════════════════
//  Dentor Chatbot – chatbot.js
//  Handles the full chat UI + API integration with /api/chat
// ═══════════════════════════════════════════════════════════════════

// ── Conversation history (sent to backend with each request) ──────
let chatHistory = [];

// ── Dark Mode (delegates to global ThemeManager) ──────────────────
function initializeDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const darkModeIcon = document.getElementById('darkModeIcon');
    const logoImage = document.getElementById('logoImage');

    const lightLogo = '../assets/Logo.png';
    const darkLogo = '../assets/Logo0.png';

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
    const navLinks = document.querySelectorAll('.nav-link');
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
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileSidebar = document.getElementById('mobileSidebar');
    const mobileSidebarPanel = document.getElementById('mobileSidebarPanel');
    const closeMobileMenu = document.getElementById('closeMobileMenu');

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
    const sendButton = document.getElementById('sendButton');
    const chatBox = document.getElementById('chatBox');


    if (!chatBox || !messageInput || !sendButton) return;


    let currentSessionId = null;

    // ── Helper: Escape HTML ──────────────────────────────────────
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ── Helper: Scroll chat to bottom ───────────────────────────
    function scrollToBottom() {
        chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
    }

    // ── Render user bubble ───────────────────────────────────────
    function appendUserMessage(text) {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const avatarUrl = userData.avatar_url
            ? `/uploads/profiles/${userData.avatar_url}`
            : '../assets/default photo.png';

        const div = document.createElement('div');
        div.className = 'flex items-start gap-3 justify-end animate-fade-in mb-4';
        div.innerHTML = `
            <div class="bg-primary text-white rounded-2xl rounded-tr-none p-4 shadow-lg max-w-2xl">
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
        div.className = 'flex items-start gap-3 animate-fade-in mb-4';
        div.innerHTML = `
            <div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg">
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
        div.className = 'flex items-start gap-3 animate-fade-in mb-4';
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
        div.id = 'typingIndicator';
        div.className = 'flex items-start gap-3 animate-fade-in mb-4';
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

    function setInputBusy(busy) {
        messageInput.disabled = busy;
        sendButton.disabled = busy;
        sendButton.classList.toggle('opacity-50', busy);
        sendButton.classList.toggle('cursor-not-allowed', busy);
    }

    // ── API Helpers ──────────────────────────────────────────────
    const getToken = () => localStorage.getItem('access_token');
    const authHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
    });

    // ── Load Sessions ────────────────────────────────────────────
    window.switchSession = async function (sessionId) {
        if (currentSessionId === sessionId) return;
        currentSessionId = sessionId;
        await loadSessionMessages(sessionId);
        loadChatSessions(); // Refresh UI to highlight the active session
    }

    async function loadChatSessions() {
        if (!getToken()) return;
        const listContainer = document.getElementById('chatHistoryList');
        if (!listContainer) return;

        try {
            const res = await fetch('/api/chat/sessions', { headers: authHeaders() });
            if (res.ok) {
                const sessions = await res.json();
                listContainer.innerHTML = ''; // clear

                if (sessions.length === 0) {
                    listContainer.innerHTML = '<div class="px-2 py-4 text-center text-sm text-text-secondary dark:text-dark-text-secondary">No previous chats</div>';
                    return;
                }

                listContainer.innerHTML = '<h3 class="text-xs font-bold text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider mb-2 px-2">PREVIOUS CHATS</h3>';

                sessions.forEach(session => {
                    const isActive = session.id === currentSessionId;
                    const dateObj = new Date(session.created_at);
                    const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const dateString = dateObj.toLocaleDateString();

                    const html = `
                    <div class="mb-1">
                        <a onclick="switchSession(${session.id})" class="cursor-pointer group block p-3 rounded-lg ${isActive ? 'bg-primary/20 dark:bg-primary/30 border border-primary/30' : 'bg-primary/5 dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/20'} transition-all duration-200 relative">
                            <div class="flex items-start justify-between gap-2">
                                <div class="flex-1 min-w-0">
                                    <p class="font-semibold text-sm ${isActive ? 'text-primary dark:text-primary-light' : 'text-text-primary dark:text-dark-text-primary group-hover:text-primary dark:group-hover:text-primary-light'} truncate">
                                        ${session.title || 'New Chat'}
                                    </p>
                                    <p class="text-xs text-text-secondary dark:text-dark-text-secondary mt-1 truncate">${dateString}</p>
                                </div>
                            </div>
                            <span class="text-xs text-text-secondary dark:text-dark-text-secondary mt-2 block">${timeString}</span>
                        </a>
                    </div>`;
                    listContainer.insertAdjacentHTML('beforeend', html);
                });
            }
        } catch (e) {
            console.error("Failed to load sessions list:", e);
        }
    }

    async function loadInitialSession() {
        if (!getToken()) return; // User not logged in

        try {
            const res = await fetch('/api/chat/sessions', { headers: authHeaders() });
            if (res.ok) {
                const sessions = await res.json();
                if (sessions.length > 0) {
                    currentSessionId = sessions[0].id;
                    await loadSessionMessages(currentSessionId);
                } else {
                    // No sessions, start fresh with welcome message
                    clearChatUI();
                }
                loadChatSessions(); // Render the list
            }
        } catch (e) {
            console.error("Failed to load sessions:", e);
        }
    }

    async function loadSessionMessages(sessionId) {
        try {
            const res = await fetch(`/api/chat/session/${sessionId}/messages`, { headers: authHeaders() });
            if (res.ok) {
                const messages = await res.json();
                chatBox.innerHTML = ''; // Clear UI
                chatHistory = []; // Clear history array

                messages.forEach(msg => {
                    if (msg.role === 'user') {
                        appendUserMessage(msg.content);
                    } else {
                        appendBotMessage(msg.content);
                    }
                    chatHistory.push({ role: msg.role, content: msg.content });
                });
                scrollToBottom();
            }
        } catch (e) {
            console.error("Failed to load messages:", e);
        }
    }

    function clearChatUI() {
        chatBox.innerHTML = '';
        chatHistory = [];
        currentSessionId = null;
        appendBotMessage('مرحباً! 🦷 أنا Dentor، مساعدك الذكي في طب الأسنان. كيف يمكنني مساعدتك اليوم؟\n\nHello! I\'m Dentor, your AI dental assistant. How can I help you today?');
    }

    // ── Buttons Logic ────────────────────────────────────────────

    // Quick and dirty selectors since there are no IDs on the buttons in HTML
    const asideButtons = document.querySelectorAll('aside button');
    let realNewChatBtn, realDeleteChatBtn;
    asideButtons.forEach(btn => {
        if (btn.textContent.includes('New Chat')) realNewChatBtn = btn;
        if (btn.textContent.includes('Delete chat')) realDeleteChatBtn = btn;
    });

    if (realNewChatBtn) {
        realNewChatBtn.addEventListener('click', async () => {
            if (!getToken()) return;
            try {
                // Create a new session on backend
                const res = await fetch('/api/chat/session', { method: 'POST', headers: authHeaders() });
                if (res.ok) {
                    const data = await res.json();
                    currentSessionId = data.id;
                    chatBox.innerHTML = '';
                    chatHistory = [];
                    appendBotMessage('مرحباً! بدأت محادثة جديدة. كيف يمكنني مساعدتك اليوم؟');
                    loadChatSessions();
                }
            } catch (e) {
                console.error("Failed to create new chat:", e);
            }
        });
    }

    // ── Delete Chat Modal Logic ──────────────────────────────────
    const deleteModal = document.getElementById('deleteChatModal');
    const deleteModalContent = document.getElementById('deleteChatModalContent');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    function hideDeleteModal() {
        if (!deleteModal) return;
        deleteModal.classList.remove('opacity-100');
        deleteModal.classList.add('opacity-0');
        deleteModalContent?.classList.remove('scale-100');
        deleteModalContent?.classList.add('scale-95');
        setTimeout(() => deleteModal.classList.add('hidden'), 300);
    }

    if (realDeleteChatBtn && deleteModal) {
        realDeleteChatBtn.addEventListener('click', () => {
            if (!currentSessionId || !getToken()) {
                alert("لا توجد محادثة نشطة لحذفها.");
                return;
            }
            // Show modal
            deleteModal.classList.remove('hidden');
            setTimeout(() => {
                deleteModal.classList.remove('opacity-0');
                deleteModal.classList.add('opacity-100');
                deleteModalContent?.classList.remove('scale-95');
                deleteModalContent?.classList.add('scale-100');
            }, 10);
        });

        cancelDeleteBtn?.addEventListener('click', hideDeleteModal);

        // Close if clicking outside the modal content
        deleteModal.addEventListener('click', (e) => {
            if (e.target === deleteModal) hideDeleteModal();
        });

        confirmDeleteBtn?.addEventListener('click', async () => {
            const originalText = confirmDeleteBtn.textContent;
            confirmDeleteBtn.textContent = 'Deleting...';
            confirmDeleteBtn.disabled = true;
            try {
                const res = await fetch(`/api/chat/session/${currentSessionId}`, { method: 'DELETE', headers: authHeaders() });
                if (res.ok) {
                    clearChatUI();
                    hideDeleteModal();
                    loadInitialSession();
                } else {
                    alert("فشل حذف المحادثة.");
                }
            } catch (e) {
                console.error("Failed to delete chat:", e);
            } finally {
                confirmDeleteBtn.textContent = originalText;
                confirmDeleteBtn.disabled = false;
            }
        });
    }

    // ── Core send function ───────────────────────────────────────
    async function sendMessage() {
        const text = messageInput.value.trim();
        if (!text) return;

        // Ensure we have a session if user is logged in
        if (!currentSessionId && getToken()) {
            try {
                const sessionRes = await fetch('/api/chat/session', { method: 'POST', headers: authHeaders() });
                if (sessionRes.ok) {
                    const data = await sessionRes.json();
                    currentSessionId = data.id;
                }
            } catch (e) {
                console.error("Failed to auto-create session:", e);
            }
        }

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
                headers: authHeaders(),
                body: JSON.stringify({
                    message: text,
                    history: chatHistory.slice(0, -1),   // send history BEFORE this message
                    session_id: currentSessionId,
                    model: "gemini-3.1-pro-high"
                })
            });

            hideTypingIndicator();

            if (!res.ok) {
                let detail = `Server error (${res.status})`;
                try {
                    const err = await res.json();
                    if (err.detail) detail = err.detail;
                } catch (_) { /* ignore */ }
                appendErrorMessage(`⚠️ ${detail}`);
                chatHistory.pop();
                return;
            }

            const data = await res.json();
            const reply = data.reply ?? 'No response received.';

            // 5. Show bot reply
            appendBotMessage(reply);

            // 6. Update history with bot's reply
            chatHistory.push({ role: 'assistant', content: reply });

            // 7. If this was the first exchange, refresh sidebar to show the new generated title
            if (chatHistory.length === 2) {
                loadChatSessions();
            }

        } catch (networkErr) {
            hideTypingIndicator();
            appendErrorMessage('⚠️ تعذّر الوصول إلى الخادم. تحقّق من اتصالك بالإنترنت وأعد المحاولة.');
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

    // ── Boot ──────────────────────────────────────────
    loadInitialSession();
}

// ═══════════════════════════════════════════════════════════════════
//  DOMContentLoaded – wire everything up
// ═══════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function () {
    initializeMobileMenu();
    initializeDarkMode();
    initializeNavigation();
    hideCurrentPageFromDropdown();

    const notificationBtn = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');

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
        if (!profileBtn?.contains(e.target)) profileDropdown?.classList.add('hidden');
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