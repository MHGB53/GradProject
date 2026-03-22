

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

document.addEventListener('DOMContentLoaded', function() {
    initializeMobileMenu();
    initializeDarkMode();
    initializeDropdowns();
    initializeViewToggle();
    initializeScrollToTop();
    hideCurrentPageFromDropdown();
});

// Dark Mode
function initializeDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const darkModeIcon = document.getElementById('darkModeIcon');
    const logoImage = document.getElementById('logoImage');
    const html = document.documentElement;
    
    const lightLogo = 'assets/Logo.png';
    const darkLogo = 'assets/Logo0.png';
    
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    if (currentTheme === 'dark') {
        html.classList.add('dark');
        darkModeIcon.textContent = 'light_mode';
        logoImage.src = darkLogo;
    } else {
        logoImage.src = lightLogo;
    }
    
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', function() {
            if (html.classList.contains('dark')) {
                html.classList.remove('dark');
                localStorage.setItem('theme', 'light');
                darkModeIcon.textContent = 'dark_mode';
                logoImage.src = lightLogo;
            } else {
                html.classList.add('dark');
                localStorage.setItem('theme', 'dark');
                darkModeIcon.textContent = 'light_mode';
                logoImage.src = darkLogo;
            }
        });
    }
}

// Dropdowns
function initializeDropdowns() {
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    
    if (notificationBtn && notificationDropdown) {
        notificationBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            notificationDropdown.classList.toggle('active');
            if (profileDropdown) profileDropdown.classList.remove('active');
        });
    }
    
    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
            if (notificationDropdown) notificationDropdown.classList.remove('active');
        });
    }
    
    document.addEventListener('click', function() {
        if (notificationDropdown) notificationDropdown.classList.remove('active');
        if (profileDropdown) profileDropdown.classList.remove('active');
    });
}

// View Toggle
function initializeViewToggle() {
    const gridViewBtn = document.getElementById('gridViewBtn');
    const listViewBtn = document.getElementById('listViewBtn');
    const casesGrid = document.getElementById('casesGrid');
    
    if (gridViewBtn && listViewBtn && casesGrid) {
        gridViewBtn.addEventListener('click', function() {
            casesGrid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8';
            gridViewBtn.classList.add('bg-primary', 'text-white');
            gridViewBtn.classList.remove('text-text-secondary', 'dark:text-dark-text-secondary');
            listViewBtn.classList.remove('bg-primary', 'text-white');
            listViewBtn.classList.add('text-text-secondary', 'dark:text-dark-text-secondary');
        });
        
        listViewBtn.addEventListener('click', function() {
            casesGrid.className = 'grid grid-cols-1 gap-4 mb-8';
            listViewBtn.classList.add('bg-primary', 'text-white');
            listViewBtn.classList.remove('text-text-secondary', 'dark:text-dark-text-secondary');
            gridViewBtn.classList.remove('bg-primary', 'text-white');
            gridViewBtn.classList.add('text-text-secondary', 'dark:text-dark-text-secondary');
        });
    }
}

// Scroll to Top
function initializeScrollToTop() {
    const scrollBtn = document.getElementById('scrollToTop');
    
    if (scrollBtn) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                scrollBtn.style.opacity = '1';
                scrollBtn.style.pointerEvents = 'auto';
            } else {
                scrollBtn.style.opacity = '0';
                scrollBtn.style.pointerEvents = 'none';
            }
        });
        
        scrollBtn.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}