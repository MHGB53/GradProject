

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
    const currentMode = localStorage.getItem('theme') || 'light';
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
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}

// Initialize navigation with active states
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Set current page
    const currentPage = 'leaderboard';
    
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

// Hide current page from Features dropdown
function hideCurrentPageFromDropdown() {
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    const dropdownLinks = document.querySelectorAll('.absolute.left-0.mt-2 a[href]');
    
    dropdownLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref === currentPage) {
            link.parentElement.style.display = 'none';
        } else {
            link.parentElement.style.display = '';
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
    
    // Hide current page from Features dropdown
    hideCurrentPageFromDropdown();
    
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
    
    // Initialize user info modal
    initializeUserInfoModal();
});

// User data
const usersData = {
    'sophia-clark': {
        name: 'Sophia Clark',
        id: '@sophia_clark',
        level: 'Level 10 - Expert',
        score: 950,
        rank: 1,
        quizzes: 85,
        avatar: 'https://i.pravatar.cc/150?img=47'
    },
    'ethan-bennett': {
        name: 'Ethan Bennett',
        id: '@ethan_bennett',
        level: 'Level 9 - Advanced',
        score: 920,
        rank: 2,
        quizzes: 78,
        avatar: 'https://i.pravatar.cc/150?img=26'
    },
    'olivia-carter': {
        name: 'Olivia Carter',
        id: '@olivia_carter',
        level: 'Level 9 - Advanced',
        score: 900,
        rank: 3,
        quizzes: 72,
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA2tWFL9GUqbRAsXDeqUPNBw5aNnU2_b5Yp4AvrRLhimZdtkiooewUSKY243mUEuWCkeqZpSeFc1sGLKVI7ktEovSPuPXHNnVlgw90aZsi3UGMsaJM15qfEA2Cqq5nIM0kN40WAGc1ymC9BR2t1PbcDRehwOBo9pnHtZFa1M1IwvHu8BegPsUPM5COqM0U64xQzcqxc880Wyi6W10hLlslny9wB3DsyLSn0atnyINuXZjacaR3yMNQQPHtyJNZy1xbu-mn_f81mow'
    },
    'liam-davis': {
        name: 'Liam Davis',
        id: '@liam_davis',
        level: 'Level 8 - Intermediate',
        score: 880,
        rank: 4,
        quizzes: 68,
        avatar: 'https://i.pravatar.cc/150?img=12'
    },
    'ava-evans': {
        name: 'Ava Evans',
        id: '@ava_evans',
        level: 'Level 8 - Intermediate',
        score: 860,
        rank: 5,
        quizzes: 65,
        avatar: 'https://i.pravatar.cc/150?img=45'
    },
    'noah-foster': {
        name: 'Noah Foster',
        id: '@noah_foster',
        level: 'Level 7 - Intermediate',
        score: 840,
        rank: 6,
        quizzes: 62,
        avatar: 'https://i.pravatar.cc/150?img=33'
    },
    'isabella-green': {
        name: 'Isabella Green',
        id: '@isabella_green',
        level: 'Level 7 - Intermediate',
        score: 820,
        rank: 7,
        quizzes: 58,
        avatar: 'https://i.pravatar.cc/150?img=48'
    },
    'mason-hayes': {
        name: 'Mason Hayes',
        id: '@mason_hayes',
        level: 'Level 6 - Beginner',
        score: 800,
        rank: 8,
        quizzes: 55,
        avatar: 'https://i.pravatar.cc/150?img=15'
    },
    'mia-ingram': {
        name: 'Mia Ingram',
        id: '@mia_ingram',
        level: 'Level 6 - Beginner',
        score: 780,
        rank: 9,
        quizzes: 52,
        avatar: 'https://i.pravatar.cc/150?img=49'
    },
    'logan-jenkins': {
        name: 'Logan Jenkins',
        id: '@logan_jenkins',
        level: 'Level 5 - Beginner',
        score: 760,
        rank: 10,
        quizzes: 48,
        avatar: 'https://i.pravatar.cc/150?img=14'
    }
};

// Show user info modal
function showUserInfo(userId) {
    const user = usersData[userId];
    if (!user) return;
    
    // Update modal content
    document.getElementById('modalUserAvatar').src = user.avatar;
    document.getElementById('modalUserName').textContent = user.name;
    document.getElementById('modalUserId').textContent = user.id;
    document.getElementById('modalUserLevel').textContent = user.level;
    
    // Show modal
    document.getElementById('userInfoModal').classList.remove('hidden');
}

// Close user info modal
function closeUserInfo() {
    document.getElementById('userInfoModal').classList.add('hidden');
}

// Initialize user info modal
function initializeUserInfoModal() {
    // Close modal when clicking outside
    document.getElementById('userInfoModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeUserInfo();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeUserInfo();
        }
    });
    
    // Make all student elements clickable
    const clickableElements = document.querySelectorAll('[data-user-id]');
    clickableElements.forEach(element => {
        element.style.cursor = 'pointer';
        element.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            showUserInfo(userId);
      });
    });
}