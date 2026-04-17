

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
    
    // Set current page (you can change this based on your current page)
    const currentPage = 'dashboard'; // This should be dynamic based on your routing
    
    // Add click handlers for navigation
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
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
            
            // Get page name and handle navigation
            const pageName = this.getAttribute('data-page');
            handlePageNavigation(pageName);
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

// Handle page navigation (you can customize this based on your routing needs)
function handlePageNavigation(pageName) {
    console.log(`Navigating to: ${pageName}`);
    
    // Here you would typically handle your page routing
    switch(pageName) {
        case 'dashboard':
            window.location.href = 'dashboard.html';
            break;
        case 'community':
            window.location.href = 'community.html';
            break;
        case 'leaderboard':
            window.location.href = 'leaderboard.html';
            break;
        case 'chatbot':
            window.location.href = 'chatbot.html';
            break;
        default:
            console.log('Unknown page:', pageName);
    }
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
});

// Change Password Logic
function initChangePasswordLogic() {
    const changePasswordForm = document.getElementById('change-password-form');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const securityMessage = document.getElementById('security-message');
            const submitBtn = changePasswordForm.querySelector('button[type="submit"]');

            securityMessage.classList.add('hidden');
            securityMessage.classList.remove('text-red-500', 'text-green-500');

            if (!currentPassword || !newPassword || !confirmPassword) {
                securityMessage.textContent = 'Please fill out all password fields.';
                securityMessage.classList.add('text-red-500');
                securityMessage.classList.remove('hidden');
                return;
            }

            if (newPassword.length < 8) {
                securityMessage.textContent = 'New password must be at least 8 characters long.';
                securityMessage.classList.add('text-red-500');
                securityMessage.classList.remove('hidden');
                return;
            }

            if (newPassword !== confirmPassword) {
                securityMessage.textContent = 'New passwords do not match.';
                securityMessage.classList.add('text-red-500');
                securityMessage.classList.remove('hidden');
                return;
            }

            const token = localStorage.getItem('access_token');
            if (!token) {
                securityMessage.textContent = 'Authentication token missing. Please log in again.';
                securityMessage.classList.add('text-red-500');
                securityMessage.classList.remove('hidden');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Updating...';

            try {
                const response = await fetch('/api/auth/change-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        current_password: currentPassword,
                        new_password: newPassword
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    securityMessage.textContent = 'Password successfully updated! Redirecting to login...';
                    securityMessage.classList.add('text-green-500');
                    securityMessage.classList.remove('hidden');
                    
                    // Log out user
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('user');
                    setTimeout(() => {
                        window.location.href = 'Login.html';
                    }, 2000);
                } else {
                    securityMessage.textContent = data.detail || 'Failed to update password.';
                    securityMessage.classList.add('text-red-500');
                    securityMessage.classList.remove('hidden');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Update';
                }
            } catch (error) {
                console.error('Error:', error);
                securityMessage.textContent = 'A network error occurred. Please try again.';
                securityMessage.classList.add('text-red-500');
                securityMessage.classList.remove('hidden');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Update';
            }
        });
    }
}

// Populate user data from localStorage
function populateUserData() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            const nameToDisplay = user.full_name || user.username || 'Dental Student';
            const emailToDisplay = user.email || '';

            // Update Dropdown
            const dropdownName = document.getElementById('dropdown-name');
            const dropdownEmail = document.getElementById('dropdown-email');
            if (dropdownName) dropdownName.textContent = nameToDisplay;
            if (dropdownEmail) dropdownEmail.textContent = emailToDisplay;

            // Update Main Profile Header
            const profileName = document.getElementById('profile-name');
            const profileEmail = document.getElementById('profile-email');
            if (profileName) profileName.textContent = nameToDisplay;
            if (profileEmail) profileEmail.textContent = emailToDisplay;

            // Update Account Information Card
            const accountName = document.getElementById('account-name');
            const accountEmail = document.getElementById('account-email');
            if (accountName) accountName.textContent = nameToDisplay;
            if (accountEmail) accountEmail.textContent = emailToDisplay;

        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
}

// Profile Photo Upload Logic
function initProfilePhotoUpload() {
    const uploadInput = document.getElementById('profile-upload');
    const uploadBtn = document.getElementById('upload-avatar-btn');
    
    // Trigger file chooser when button overlay is clicked
    if (uploadBtn && uploadInput) {
        uploadBtn.addEventListener('click', () => {
            uploadInput.click();
        });
        
        uploadInput.addEventListener('change', async function(e) {
            if (!this.files || this.files.length === 0) return;
            const file = this.files[0];
            
            if (!file.type.startsWith('image/')) {
                alert('Please upload a valid image file.');
                return;
            }
            
            const formData = new FormData();
            formData.append('file', file);
            
            const token = localStorage.getItem('access_token');
            if (!token) return;
            
            const heroAvatar = document.getElementById('hero-avatar');
            const originalBg = heroAvatar.style.backgroundImage;
            heroAvatar.style.opacity = '0.5';
            
            try {
                const response = await fetch('/api/auth/upload-photo', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                
                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('user', JSON.stringify(data));
                    
                    const newUrl = `url('${data.profile_photo}')`;
                    heroAvatar.style.backgroundImage = newUrl;
                    
                    const profileBtn = document.getElementById('profileBtn');
                    if (profileBtn) profileBtn.style.backgroundImage = newUrl;
                    
                    const dropdown = document.getElementById('profileDropdown');
                    if (dropdown) {
                        const ddImg = dropdown.querySelector('.rounded-full.bg-cover');
                        if (ddImg) ddImg.style.backgroundImage = newUrl;
                    }
                } else {
                    const errInfo = await response.json();
                    alert(errInfo.detail || 'Upload failed.');
                    heroAvatar.style.backgroundImage = originalBg;
                }
            } catch (err) {
                console.error('Network error during upload:', err);
                alert('Network error during upload.');
                heroAvatar.style.backgroundImage = originalBg;
            } finally {
                heroAvatar.style.opacity = '1';
            }
        });
    }
}

// Execute immediately
initChangePasswordLogic();
initProfilePhotoUpload();
document.addEventListener('DOMContentLoaded', populateUserData);