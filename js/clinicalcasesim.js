

let currentStep = 1;
const totalSteps = 5;

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

document.addEventListener('DOMContentLoaded', function() {
    initializeMobileMenu();
    initializeDarkMode();
    initializeDropdowns();
    updateProgress();
    initializeDiagnosisSelection();
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

// Navigation between steps
function goToStep(step) {
    // Hide all steps
    document.querySelectorAll('.step-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Show selected step
    const stepElement = document.getElementById('step' + step);
    if (stepElement) {
        stepElement.classList.add('active');
        currentStep = step;
        updateProgress();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Update progress bar
function updateProgress() {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    const percentage = (currentStep / totalSteps) * 100;
    
    if (progressBar) {
        progressBar.style.width = percentage + '%';
    }
    
    if (progressText) {
        progressText.textContent = `Step ${currentStep} of ${totalSteps}`;
    }
}

// Initialize diagnosis selection
function initializeDiagnosisSelection() {
    const diagnosisOptions = document.querySelectorAll('input[name="diagnosis"]');
    
    diagnosisOptions.forEach(option => {
        option.addEventListener('change', function() {
            updateSelectionStatus();
        });
    });
}

// Update selection status banner
function updateSelectionStatus() {
    const selected = document.querySelector('input[name="diagnosis"]:checked');
    const selectionStatus = document.getElementById('selectionStatus');
    
    if (selected && selectionStatus) {
        selectionStatus.classList.remove('hidden');
    } else if (selectionStatus) {
        selectionStatus.classList.add('hidden');
    }
}

// Clear diagnosis selection
function clearDiagnosis() {
    const diagnosisOptions = document.querySelectorAll('input[name="diagnosis"]');
    
    diagnosisOptions.forEach(option => {
        option.checked = false;
    });
    
    updateSelectionStatus();
    showNotification('Selection cleared', 'info');
}

// Retry case
function retryCase() {
    // Clear all selections
    document.querySelectorAll('input[name="diagnosis"]').forEach(option => {
        option.checked = false;
    });
    document.querySelectorAll('input[type="checkbox"]').forEach(option => {
        option.checked = false;
    });
    
    // Go back to step 1
    goToStep(1);
    
    showNotification('Case reset - Good luck!', 'info');
}

// Submit diagnosis
function submitDiagnosis() {
    const selected = document.querySelector('input[name="diagnosis"]:checked');
    
    if (!selected) {
        showNotification('Please select a diagnosis option before submitting', 'warning');
        return;
    }
    
    // Check if correct (option 1 is correct)
    if (selected.value === '1') {
        showFeedback('Correct diagnosis!', 'success');
        setTimeout(() => goToStep(4), 1500);
    } else {
        showFeedback('Not quite right. Review the clinical findings.', 'error');
    }
}

// Show notification
function showNotification(message, type) {
    const notification = document.createElement('div');
    
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };
    
    const icons = {
        success: 'check_circle',
        error: 'error',
        warning: 'warning',
        info: 'info'
    };
    
    notification.className = `fixed top-24 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 ${
        colors[type] || 'bg-blue-500'
    } text-white font-semibold transform transition-all duration-300 border-2 border-white/20`;
    notification.innerHTML = `
        <span class="material-symbols-outlined text-2xl">${icons[type] || 'info'}</span>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(500px)';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Show feedback
function showFeedback(message, type) {
    const feedback = document.createElement('div');
    feedback.className = `fixed top-24 right-6 z-50 px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white font-semibold transform transition-all duration-300`;
    feedback.innerHTML = `
        <span class="material-symbols-outlined">${type === 'success' ? 'check_circle' : 'error'}</span>
        <span>${message}</span>
    `;
    
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        feedback.style.transform = 'translateX(400px)';
        feedback.style.opacity = '0';
        setTimeout(() => feedback.remove(), 300);
    }, 2000);
}