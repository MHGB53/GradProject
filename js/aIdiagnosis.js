

let currentStep = 1;
let xrayFile = null;
let labFile = null;
let historyFile = null;

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

// Dark Mode - Using Global ThemeManager
function initializeDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const darkModeIcon = document.getElementById('darkModeIcon');
    const logoImg = document.getElementById('logoImage');
    
    if (logoImg) {
        // Set initial logo based on current theme
        const currentTheme = ThemeManager.getCurrentTheme();
        logoImg.src = currentTheme === 'dark' ? 'assets/Logo0.png' : 'assets/Logo.png';
        if (darkModeIcon) {
            darkModeIcon.textContent = currentTheme === 'dark' ? 'dark_mode' : 'light_mode';
        }
    }

    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            // Toggle using ThemeManager
            const newTheme = ThemeManager.toggleTheme();
            
            // Update logo
            if (logoImg) {
                logoImg.src = newTheme === 'dark' ? 'assets/Logo0.png' : 'assets/Logo.png';
            }
            if (darkModeIcon) {
                darkModeIcon.textContent = newTheme === 'dark' ? 'dark_mode' : 'light_mode';
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

    // Only add event listeners if elements exist
    if (!notificationBtn || !notificationDropdown || !profileBtn || !profileDropdown) {
        console.warn('Dropdown elements not found');
        return;
    }

    notificationBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notificationDropdown.classList.toggle('active');
        profileDropdown.classList.remove('active');
    });

    profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('active');
        notificationDropdown.classList.remove('active');
    });

    document.addEventListener('click', () => {
        notificationDropdown.classList.remove('active');
        profileDropdown.classList.remove('active');
    });
}

// File Upload System
function initializeFileUpload() {
    setupDropZone('xray', 'xrayDropZone', 'xrayInput', 'xrayPrompt', 'xrayPreview', 'blue', 'radiology', 'X-Ray');
    setupDropZone('lab', 'labDropZone', 'labInput', 'labPrompt', 'labPreview', 'purple', 'science', 'Lab Results');
    setupDropZone('history', 'historyDropZone', 'historyInput', 'historyPrompt', 'historyPreview', 'green', 'history_edu', 'Medical History');
    
    // Add input listeners to patient info fields
    const patientName = document.getElementById('patientName');
    const patientAge = document.getElementById('patientAge');
    
    if (patientName) {
        patientName.addEventListener('input', updateContinueButton);
    }
    if (patientAge) {
        patientAge.addEventListener('input', updateContinueButton);
    }
}

function setupDropZone(type, zoneId, inputId, promptId, previewId, color, icon, label) {
    const zone = document.getElementById(zoneId);
    const input = document.getElementById(inputId);
    
    zone.addEventListener('click', () => input.click());
    
    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('drag-active');
    });
    
    zone.addEventListener('dragleave', () => {
        zone.classList.remove('drag-active');
    });
    
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-active');
        if (e.dataTransfer.files.length > 0) {
            handleFileUpload(type, e.dataTransfer.files[0], promptId, previewId, color, icon, label);
        }
    });
    
    input.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(type, e.target.files[0], promptId, previewId, color, icon, label);
        }
    });
}

function handleFileUpload(type, file, promptId, previewId, color, icon, label) {
    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
        showNotification('File size exceeds 10MB limit', 'error');
        return;
    }
    
    // Store file
    if (type === 'xray') xrayFile = file;
    else if (type === 'lab') labFile = file;
    else if (type === 'history') historyFile = file;
    
    // Show preview
    const prompt = document.getElementById(promptId);
    const preview = document.getElementById(previewId);
    
    prompt.classList.add('hidden');
    preview.classList.remove('hidden');
    
    preview.innerHTML = `
        <div class="text-center">
            <div class="w-14 h-14 bg-${color}-600 dark:bg-${color}-500 rounded-xl flex items-center justify-center mx-auto mb-2 relative">
                <span class="material-symbols-outlined text-white text-2xl">${icon}</span>
                <div class="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span class="material-symbols-outlined text-white text-sm">check</span>
                </div>
            </div>
            <p class="text-sm font-bold text-text-primary dark:text-dark-text-primary mb-1 truncate px-2">${file.name}</p>
            <p class="text-xs text-text-secondary dark:text-dark-text-secondary mb-3">${formatFileSize(file.size)}</p>
            <button onclick="removeFile('${type}', '${promptId}', '${previewId}')" class="px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 mx-auto">
                <span class="material-symbols-outlined text-sm">delete</span>
                <span>Remove</span>
            </button>
        </div>
    `;
    
    updateContinueButton();
    showNotification(`${label} uploaded successfully!`, 'success');
}

function removeFile(type, promptId, previewId) {
    // Clear file
    if (type === 'xray') xrayFile = null;
    else if (type === 'lab') labFile = null;
    else if (type === 'history') historyFile = null;
    
    // Reset UI
    document.getElementById(promptId).classList.remove('hidden');
    document.getElementById(previewId).classList.add('hidden');
    
    updateContinueButton();
    showNotification('File removed', 'info');
}

function updateContinueButton() {
    const continueBtn = document.getElementById('continueBtn');
    const patientName = document.getElementById('patientName').value.trim();
    const patientAge = document.getElementById('patientAge').value.trim();
    
    // All fields are required
    const allValid = patientName && patientAge && xrayFile && labFile && historyFile;
    continueBtn.disabled = !allValid;
    
    // Update file count
    const count = [xrayFile, labFile, historyFile].filter(f => f !== null).length;
    document.getElementById('totalFilesCount').textContent = `${count}/3`;
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// Step Management
function updateStepIndicator(step) {
    // Reset all indicators
    for (let i = 1; i <= 3; i++) {
        const indicator = document.getElementById(`stepIndicator${i}`);
        const circle = indicator.querySelector('div');
        const text = indicator.querySelector('span:last-child');
        
        if (i < step) {
            // Completed
            circle.className = 'w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold shadow-lg mb-2 text-2xl';
            text.className = 'text-sm font-semibold text-primary';
        } else if (i === step) {
            // Active
            circle.className = 'w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold shadow-lg mb-2 text-2xl';
            text.className = 'text-sm font-semibold text-primary';
        } else {
            // Pending
            circle.className = 'w-12 h-12 rounded-full bg-border-color dark:bg-dark-border-color text-text-secondary dark:text-dark-text-secondary flex items-center justify-center font-bold mb-2 text-2xl';
            text.className = 'text-sm font-semibold text-text-secondary dark:text-dark-text-secondary';
        }
    }
    
    // Update progress lines
    document.getElementById('progressLine1').style.width = (step > 1 ? '100' : '0') + '%';
    document.getElementById('progressLine2').style.width = (step > 2 ? '100' : '0') + '%';
}

function showStep(step) {
    // Hide all steps
    for (let i = 1; i <= 3; i++) {
        document.getElementById(`step${i}`).classList.remove('active');
    }
    
    // Show current step
    document.getElementById(`step${step}`).classList.add('active');
    currentStep = step;
    updateStepIndicator(step);
}

// Analysis
function startAnalysis() {
    // Validate patient information
    const patientName = document.getElementById('patientName').value.trim();
    const patientAge = document.getElementById('patientAge').value.trim();
    
    // Collect missing items
    const missing = [];
    
    if (!patientName) {
        missing.push('Patient Name');
    }
    
    if (!patientAge) {
        missing.push('Patient Age');
    }
    
    if (!xrayFile) {
        missing.push('X-Ray Images');
    }
    
    if (!labFile) {
        missing.push('Lab Results');
    }
    
    if (!historyFile) {
        missing.push('Medical History');
    }
    
    // Show error if anything is missing
    if (missing.length > 0) {
        const missingList = missing.join(', ');
        showNotification(`Missing required fields: ${missingList}`, 'error');
        
        // Highlight missing patient info fields
        if (!patientName) {
            const field = document.getElementById('patientName');
            field.classList.add('border-red-500', 'ring-2', 'ring-red-200');
            setTimeout(() => {
                field.classList.remove('border-red-500', 'ring-2', 'ring-red-200');
            }, 3000);
        }
        
        if (!patientAge) {
            const field = document.getElementById('patientAge');
            field.classList.add('border-red-500', 'ring-2', 'ring-red-200');
            setTimeout(() => {
                field.classList.remove('border-red-500', 'ring-2', 'ring-red-200');
            }, 3000);
        }
        
        // Highlight missing file uploads
        if (!xrayFile) {
            const zone = document.getElementById('xrayDropZone');
            zone.classList.add('border-red-500', 'bg-red-50', 'dark:bg-red-900/20');
            setTimeout(() => {
                zone.classList.remove('border-red-500', 'bg-red-50', 'dark:bg-red-900/20');
            }, 3000);
        }
        
        if (!labFile) {
            const zone = document.getElementById('labDropZone');
            zone.classList.add('border-red-500', 'bg-red-50', 'dark:bg-red-900/20');
            setTimeout(() => {
                zone.classList.remove('border-red-500', 'bg-red-50', 'dark:bg-red-900/20');
            }, 3000);
        }
        
        if (!historyFile) {
            const zone = document.getElementById('historyDropZone');
            zone.classList.add('border-red-500', 'bg-red-50', 'dark:bg-red-900/20');
            setTimeout(() => {
                zone.classList.remove('border-red-500', 'bg-red-50', 'dark:bg-red-900/20');
            }, 3000);
        }
        
        return;
    }
    
    // All validation passed - proceed with analysis
    showStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const analysisSteps = [
        { progress: 15, status: 'Loading X-ray images...', files: 1, patterns: 0, confidence: 0 },
        { progress: 30, status: 'Analyzing radiographic features...', files: 1, patterns: 3, confidence: 35 },
        { progress: 45, status: 'Processing lab results...', files: 2, patterns: 6, confidence: 58 },
        { progress: 60, status: 'Evaluating patient history...', files: 3, patterns: 9, confidence: 70 },
        { progress: 75, status: 'Cross-referencing clinical data...', files: 3, patterns: 12, confidence: 82 },
        { progress: 90, status: 'Generating diagnosis...', files: 3, patterns: 15, confidence: 87 },
        { progress: 100, status: 'Finalizing recommendations...', files: 3, patterns: 18, confidence: 87 }
    ];
    
    let stepIndex = 0;
    
    const interval = setInterval(() => {
        if (stepIndex < analysisSteps.length) {
            const step = analysisSteps[stepIndex];
            
            document.getElementById('analysisProgress').style.width = step.progress + '%';
            document.getElementById('analysisPercent').textContent = step.progress + '% Complete';
            document.getElementById('analysisStatus').textContent = step.status;
            document.getElementById('filesAnalyzed').textContent = step.files;
            document.getElementById('patternsFound').textContent = step.patterns;
            document.getElementById('confidenceScore').textContent = step.confidence + '%';
            
            stepIndex++;
        } else {
            clearInterval(interval);
            setTimeout(() => {
                showStep(3);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                showNotification('Diagnosis completed successfully!', 'success');
            }, 500);
        }
    }, 1000);
}

// Actions
function downloadReport() {
    showNotification('Downloading diagnostic report...', 'success');
}

function shareResults() {
    showNotification('Preparing share link...', 'info');
}

function newDiagnosis() {
    // Reset everything
    xrayFile = null;
    labFile = null;
    historyFile = null;
    
    // Reset upload zones
    document.getElementById('xrayPrompt').classList.remove('hidden');
    document.getElementById('xrayPreview').classList.add('hidden');
    document.getElementById('labPrompt').classList.remove('hidden');
    document.getElementById('labPreview').classList.add('hidden');
    document.getElementById('historyPrompt').classList.remove('hidden');
    document.getElementById('historyPreview').classList.add('hidden');
    
    // Reset file count
    document.getElementById('totalFilesCount').textContent = '0/3';
    
    // Reset button
    document.getElementById('continueBtn').disabled = true;
    
    // Reset progress
    document.getElementById('analysisProgress').style.width = '0%';
    
    // Go to step 1
    showStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showNotification('Ready for new diagnosis', 'info');
}

// Toast Notifications
function showNotification(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    
    const icons = {
        success: 'check_circle',
        error: 'error',
        warning: 'warning',
        info: 'info'
    };

    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };

    toast.className = `${colors[type]} text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 slide-in`;
    toast.innerHTML = `
        <span class="material-symbols-outlined">${icons[type]}</span>
        <span class="font-semibold">${message}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
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

// Initialize
// Validate full name - only letters and spaces
function validateFullName() {
    const patientNameInput = document.getElementById('patientName');
    if (patientNameInput) {
        patientNameInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^A-Za-z\s]/g, '');
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeMobileMenu();
    initializeDarkMode();
    initializeDropdowns();
    hideCurrentPageFromDropdown();
    initializeFileUpload();
    validateFullName();
    showStep(1);
});