

// Mobile Menu
function initializeMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileSidebar = document.getElementById('mobileSidebar');
    const mobileSidebarPanel = document.getElementById('mobileSidebarPanel');
    const closeMobileMenu = document.getElementById('closeMobileMenu');
    
    // Open mobile menu
    mobileMenuBtn?.addEventListener('click', () => {
        mobileSidebar.classList.remove('hidden');
        setTimeout(() => {
            mobileSidebarPanel.classList.remove('-translate-x-full');
        }, 10);
    });
    
    // Close mobile menu
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
    const currentPage = 'smartstudyplan';
    
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

// Initialize slider value updates
function initializeSliders() {
    const sliders = [
        { id: 'anatomy-slider', valueId: 'anatomy-value' },
        { id: 'radiology-slider', valueId: 'radiology-value' },
        { id: 'pathology-slider', valueId: 'pathology-value' },
        { id: 'pharmacology-slider', valueId: 'pharmacology-value' }
    ];
    
    sliders.forEach(slider => {
        const sliderElement = document.getElementById(slider.id);
        const valueElement = document.getElementById(slider.valueId);
        
        sliderElement.addEventListener('input', function() {
            valueElement.textContent = this.value;
        });
    });
}

// Generate Plan functionality
function initializeGeneratePlan() {
    const generateBtn = document.getElementById('generatePlanBtn');
    const generateIcon = document.getElementById('generateIcon');
    const generateText = document.getElementById('generateText');
    
    generateBtn.addEventListener('click', function() {
        // Disable button
        generateBtn.disabled = true;
        generateBtn.classList.add('opacity-75', 'cursor-not-allowed');
        
        // Show loading state
        generateIcon.classList.add('loading-spinner');
        generateText.textContent = 'Generating...';
        
        // Simulate AI generation (in real app, this would be an API call)
        setTimeout(() => {
            // Reset button
            generateBtn.disabled = false;
            generateBtn.classList.remove('opacity-75', 'cursor-not-allowed');
            generateIcon.classList.remove('loading-spinner');
            generateText.textContent = 'Generate Plan';
            
            // Show success message
            showNotification('Study plan generated successfully!', 'success');
            
            // Add animation to schedule
            const schedule = document.querySelector('.lg\\:col-span-2');
            schedule.classList.add('fade-in');
            setTimeout(() => schedule.classList.remove('fade-in'), 600);
        }, 2000);
    });
}

// Initialize subject filters
function initializeSubjectFilters() {
    const filterButtons = document.querySelectorAll('.subject-filter');
    const scheduleCells = document.querySelectorAll('.schedule-cell[data-subject]');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active from all
            filterButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.classList.remove('border-primary', 'border-yellow-600', 'border-red-600', 'border-blue-600');
                btn.classList.add('border-transparent');
            });
            
            // Add active to clicked
            this.classList.add('active');
            
            const subject = this.getAttribute('data-subject');
            
            // Update border color based on subject
            if (subject === 'all') {
                this.classList.remove('border-transparent');
                this.classList.add('border-primary');
            } else if (subject === 'anatomy') {
                this.classList.remove('border-transparent');
                this.classList.add('border-primary');
            } else if (subject === 'radiology') {
                this.classList.remove('border-transparent');
                this.classList.add('border-yellow-600');
            } else if (subject === 'pathology') {
                this.classList.remove('border-transparent');
                this.classList.add('border-red-600');
            } else if (subject === 'pharmacology') {
                this.classList.remove('border-transparent');
                this.classList.add('border-blue-600');
            }
            
            // Filter schedule cells - show/hide subjects within cells
            if (subject === 'all') {
                // Show all subjects
                scheduleCells.forEach(cell => {
                    cell.style.display = '';
                });
                showNotification('Showing all subjects', 'info');
            } else {
                // Hide cells that don't match the selected subject
                scheduleCells.forEach(cell => {
                    if (cell.getAttribute('data-subject') === subject) {
                        cell.style.display = '';
                    } else {
                        cell.style.display = 'none';
                    }
                });
                const subjectName = subject.charAt(0).toUpperCase() + subject.slice(1);
                showNotification(`Filtering by ${subjectName}`, 'info');
            }
        });
    });
}

// Initialize schedule cell interactions
function initializeScheduleCells() {
    const scheduleCells = document.querySelectorAll('.schedule-cell[data-subject]');
    
    scheduleCells.forEach(cell => {
        cell.addEventListener('click', function(e) {
            // Prevent default behavior
            e.preventDefault();
            
            const subject = this.getAttribute('data-subject');
            const time = this.getAttribute('data-time');
            const day = this.getAttribute('data-day');
            
            if (subject) {
                // Toggle completion status
                const isCompleted = this.classList.contains('schedule-completed');
                const subjectName = subject.charAt(0).toUpperCase() + subject.slice(1);
                
                if (isCompleted) {
                    // Mark as incomplete
                    this.classList.remove('schedule-completed');
                    showNotification(`${subjectName} marked as incomplete`, 'info');
                } else {
                    // Mark as complete
                    this.classList.add('schedule-completed');
                    showNotification(`${subjectName} marked as complete! ✓`, 'success');
                    
                    // Add celebration animation
                    const badge = this.querySelector('span');
                    if (badge) {
                        badge.style.animation = 'pulse 0.5s ease-in-out';
                        setTimeout(() => {
                            badge.style.animation = '';
                        }, 500);
                    }
                }
                
                // Update progress stats (optional - could track completion percentage)
                updateCompletionStats();
            }
        });
    });
}

// Update completion statistics
function updateCompletionStats() {
    const allSessions = document.querySelectorAll('.schedule-cell[data-subject]');
    const completedSessions = document.querySelectorAll('.schedule-cell.schedule-completed');
    const totalSessions = allSessions.length;
    const completedCount = completedSessions.length;
    const completionRate = totalSessions > 0 ? Math.round((completedCount / totalSessions) * 100) : 0;
    
    console.log(`Completion: ${completedCount}/${totalSessions} (${completionRate}%)`);
    // You can update UI elements here to show completion stats
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-24 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 ${
        type === 'success' ? 'bg-primary text-white' : 
        type === 'error' ? 'bg-red-500 text-white' : 
        'bg-card dark:bg-dark-card text-text-primary dark:text-dark-text-primary border border-border-color dark:border-dark-border-color'
    }`;
    
    notification.innerHTML = `
        <span class="material-symbols-outlined">${type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info'}</span>
        <span class="font-medium">${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    requestAnimationFrame(() => {
        notification.style.transform = 'translateX(0)';
    });
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
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
    
    // Initialize sliders
    initializeSliders();
    
    // Initialize generate plan
    initializeGeneratePlan();
    
    // Initialize subject filters
    initializeSubjectFilters();
    
    // Initialize schedule cells
    initializeScheduleCells();
    
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
});