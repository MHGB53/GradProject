

// Dark Mode Toggle
function initializeDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const darkModeIcon = document.getElementById('darkModeIcon');
    const logoImage = document.getElementById('logoImage');
    const htmlElement = document.documentElement;
    
    // Logo paths
    const lightLogo = 'assets/Logo.png';
    const darkLogo = 'assets/Logo0.png';
    
    // Check for saved preference or default to light mode
    const currentMode = localStorage.getItem('darkMode') || 'light';
    if (currentMode === 'dark') {
        htmlElement.classList.add('dark');
        darkModeIcon.textContent = 'dark_mode';
        logoImage.src = darkLogo;
    }
    
    darkModeToggle.addEventListener('click', function() {
        htmlElement.classList.toggle('dark');
        const isDark = htmlElement.classList.contains('dark');
        
        // Update icon
        darkModeIcon.textContent = isDark ? 'dark_mode' : 'light_mode';
        
        // Update logo with fade effect
        logoImage.style.opacity = '0';
        setTimeout(() => {
            logoImage.src = isDark ? darkLogo : lightLogo;
            logoImage.style.opacity = '1';
        }, 150);
        
        // Save preference
        localStorage.setItem('darkMode', isDark ? 'dark' : 'light');
    });
}

// Initialize navigation with active states
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Set current page
    const currentPage = 'chatbot';
    
    // Add click handlers for navigation
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Don't prevent default if it's a link with href
            if (this.getAttribute('href') === '#') {
                e.preventDefault();
            }
            
            // Remove active class from all links
            navLinks.forEach(navLink => {
                navLink.classList.remove('active');
                navLink.classList.add('text-text-secondary', 'dark:text-dark-text-secondary');
                navLink.classList.remove('text-white', 'bg-primary', 'shadow-lg', 'shadow-primary/30');
            });
            
            // Add active class to clicked link
            this.classList.add('active');
            this.classList.remove('text-text-secondary', 'dark:text-dark-text-secondary');
            this.classList.add('text-white', 'bg-primary', 'shadow-lg', 'shadow-primary/30');
        });
    });
    
    // Set initial active state
    setActivePage(currentPage);
}

// Set active page
function setActivePage(pageName) {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('data-page');
        
        if (linkPage === pageName) {
            link.classList.add('active');
            link.classList.remove('text-text-secondary', 'dark:text-dark-text-secondary');
            link.classList.add('text-white', 'bg-primary', 'shadow-lg', 'shadow-primary/30');
        } else {
            link.classList.remove('active');
            link.classList.add('text-text-secondary', 'dark:text-dark-text-secondary');
            link.classList.remove('text-white', 'bg-primary', 'shadow-lg', 'shadow-primary/30');
        }
    });
}

// Mobile Menu
function initializeMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileSidebar = document.getElementById('mobileSidebar');
    const mobileSidebarPanel = document.getElementById('mobileSidebarPanel');
    const closeMobileMenu = document.getElementById('closeMobileMenu');
    
    mobileMenuBtn?.addEventListener('click', () => {
        mobileSidebar.classList.remove('hidden');
        setTimeout(() => {
            mobileSidebarPanel.classList.remove('-translate-x-full');
        }, 10);
    });
    
    const closeSidebar = () => {
        mobileSidebarPanel.classList.add('-translate-x-full');
        setTimeout(() => {
            mobileSidebar.classList.add('hidden');
        }, 300);
    };
    
    closeMobileMenu?.addEventListener('click', closeSidebar);
    mobileSidebar?.addEventListener('click', (e) => {
        if (e.target === mobileSidebar) {
            closeSidebar();
        }
    });
}

// Notification and Profile dropdown functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeMobileMenu();
    
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    
    // Initialize dark mode
    initializeDarkMode();
    
    // Initialize navigation
    initializeNavigation();
    
    // Toggle notification dropdown
    notificationBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        notificationDropdown.classList.toggle('hidden');
        profileDropdown.classList.add('hidden'); // Close profile dropdown
    });
    
    // Toggle profile dropdown
    profileBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        profileDropdown.classList.toggle('hidden');
        notificationDropdown.classList.add('hidden'); // Close notification dropdown
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!notificationBtn.contains(e.target) && !notificationDropdown.contains(e.target)) {
            notificationDropdown.classList.add('hidden');
        }
        if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.add('hidden');
        }
    });
    
    // Close dropdowns when pressing Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            notificationDropdown.classList.add('hidden');
            profileDropdown.classList.add('hidden');
        }
    });
    
    // Initialize chat functionality
    initializeChat();
});

// Chat functionality
function initializeChat() {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const chatArea = document.getElementById('chatArea');
    
    // Send message function
    function sendMessage() {
        const message = messageInput.value.trim();
        if (message === '') return;
        
        // Add user message
        addUserMessage(message);
        
        // Clear input
        messageInput.value = '';
        
        // Show typing indicator
        setTimeout(() => {
            addTypingIndicator();
            
            // Simulate bot response after 1.5 seconds
            setTimeout(() => {
                removeTypingIndicator();
                addBotMessage("I'm here to help! This is a demo response. In a real application, this would connect to an AI service.");
            }, 1500);
        }, 500);
    }
    
    // Add user message to chat
    function addUserMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'flex items-start gap-3 justify-end fade-in';
        messageDiv.innerHTML = `
            <div class="bg-gradient-to-br from-primary to-primary-dark text-white rounded-2xl rounded-tr-none p-4 shadow-lg max-w-2xl">
                <p class="text-sm leading-relaxed">${escapeHtml(text)}</p>
            </div>
            <div class="w-10 h-10 rounded-full bg-cover bg-center shrink-0 border-2 border-primary shadow-lg" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuA2tWFL9GUqbRAsXDeqUPNBw5aNnU2_b5Yp4AvrRLhimZdtkiooewUSKY243mUEuWCkeqZpSeFc1sGLKVI7ktEovSPuPXHNnVlgw90aZsi3UGMsaJM15qfEA2Cqq5nIM0kN40WAGc1ymC9BR2t1PbcDRehwOBo9pnHtZFa1M1IwvHu8BegPsUPM5COqM0U64xQzcqxc880Wyi6W10hLlslny9wB3DsyLSn0atnyINuXZjacaR3yMNQQPHtyJNZy1xbu-mn_f81mow");'></div>
        `;
        chatArea.appendChild(messageDiv);
        scrollToBottom();
    }
    
    // Add bot message to chat
    function addBotMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'flex items-start gap-3 fade-in';
        messageDiv.innerHTML = `
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-green-400 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg">
                D
            </div>
            <div class="bg-card dark:bg-dark-card rounded-2xl rounded-tl-none p-4 shadow-subtle max-w-2xl">
                <p class="text-sm text-text-primary dark:text-dark-text-primary leading-relaxed">${escapeHtml(text)}</p>
            </div>
        `;
        chatArea.appendChild(messageDiv);
        scrollToBottom();
    }
    
    // Add typing indicator
    function addTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'flex items-start gap-3 fade-in';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-green-400 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg">
                D
            </div>
            <div class="bg-card dark:bg-dark-card rounded-2xl rounded-tl-none p-4 shadow-subtle">
                <div class="flex items-center space-x-2">
                    <span class="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                    <span class="w-2 h-2 bg-primary rounded-full animate-pulse" style="animation-delay: 0.2s;"></span>
                    <span class="w-2 h-2 bg-primary rounded-full animate-pulse" style="animation-delay: 0.4s;"></span>
                </div>
            </div>
        `;
        chatArea.appendChild(typingDiv);
        scrollToBottom();
    }
    
    // Remove typing indicator
    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    // Scroll to bottom of chat
    function scrollToBottom() {
        chatArea.scrollTop = chatArea.scrollHeight;
    }
    
    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}