

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

// Dark Mode Toggle - Using Global ThemeManager
function initializeDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const darkModeIcon = document.getElementById('darkModeIcon');
    const logoImage = document.getElementById('logoImage');
    
    // Logo paths
    const lightLogo = 'assets/Logo.png';
    const darkLogo = 'assets/Logo0.png';
    
    if (darkModeToggle && logoImage) {
        // Set initial logo based on current theme
        const currentTheme = ThemeManager.getCurrentTheme();
        logoImage.src = currentTheme === 'dark' ? darkLogo : lightLogo;
        if (darkModeIcon) darkModeIcon.textContent = currentTheme === 'dark' ? 'dark_mode' : 'light_mode';
        
        // Update logo when theme toggle is clicked
        darkModeToggle.addEventListener('click', function() {
            // Toggle and get new theme
            const newTheme = ThemeManager.toggleTheme();
            if (darkModeIcon) darkModeIcon.textContent = newTheme === 'dark' ? 'dark_mode' : 'light_mode';
            
            // Update logo with fade effect
            logoImage.style.opacity = '0';
            setTimeout(() => {
                logoImage.src = newTheme === 'dark' ? darkLogo : lightLogo;
                logoImage.style.opacity = '1';
            }, 150);
        });
    }
}

// Navigation Active State
function initializeNavigation() {
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref === currentPage || (currentPage === '' && linkHref === 'dashboard.html')) {
            link.classList.add('text-white', 'bg-primary', 'shadow-lg', 'shadow-primary/30');
            link.classList.remove('text-text-secondary', 'dark:text-dark-text-secondary');
        } else {
            link.classList.remove('text-white', 'bg-primary', 'shadow-lg', 'shadow-primary/30');
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
    
    // Initialize exam generator features
    initializeExamGenerator();
});

// Lectures data by subject
const lecturesData = {
    anatomy: [
        { id: 1, name: "Introduction to Dental Anatomy", weeks: "Week 1-2" },
        { id: 2, name: "Tooth Morphology and Structure", weeks: "Week 3-4" },
        { id: 3, name: "Oral Cavity Structures", weeks: "Week 5-6" },
        { id: 4, name: "Temporomandibular Joint", weeks: "Week 7" },
        { id: 5, name: "Muscles of Mastication", weeks: "Week 8-9" },
        { id: 6, name: "Blood Supply and Innervation", weeks: "Week 10-11" },
        { id: 7, name: "Salivary Glands", weeks: "Week 12" }
    ],
    pharmacology: [
        { id: 1, name: "Introduction to Dental Pharmacology", weeks: "Week 1-2" },
        { id: 2, name: "Local Anesthetics", weeks: "Week 3-4" },
        { id: 3, name: "Analgesics and Pain Management", weeks: "Week 5-6" },
        { id: 4, name: "Antibiotics in Dentistry", weeks: "Week 7-8" },
        { id: 5, name: "Sedation and Anxiolytics", weeks: "Week 9-10" },
        { id: 6, name: "Emergency Medications", weeks: "Week 11" },
        { id: 7, name: "Drug Interactions", weeks: "Week 12" }
    ],
    pathology: [
        { id: 1, name: "Introduction to Oral Pathology", weeks: "Week 1-2" },
        { id: 2, name: "Dental Caries and Pulp Disease", weeks: "Week 3-4" },
        { id: 3, name: "Periodontal Diseases", weeks: "Week 5-6" },
        { id: 4, name: "Oral Infections", weeks: "Week 7-8" },
        { id: 5, name: "Oral Lesions and Tumors", weeks: "Week 9-10" },
        { id: 6, name: "Developmental Disorders", weeks: "Week 11" },
        { id: 7, name: "Systemic Diseases in Dentistry", weeks: "Week 12" }
    ],
    radiology: [
        { id: 1, name: "Introduction to Dental Radiography", weeks: "Week 1-2" },
        { id: 2, name: "Radiation Physics and Safety", weeks: "Week 3-4" },
        { id: 3, name: "Intraoral Radiographic Techniques", weeks: "Week 5-6" },
        { id: 4, name: "Extraoral Radiography", weeks: "Week 7-8" },
        { id: 5, name: "Panoramic Imaging", weeks: "Week 9" },
        { id: 6, name: "CBCT and 3D Imaging", weeks: "Week 10-11" },
        { id: 7, name: "Radiographic Interpretation", weeks: "Week 12" }
    ]
};

// Exam Generator Functionality
function initializeExamGenerator() {
    // Subject selection and lecture population
    const subjectSelect = document.getElementById('subject');
    const lecturesSection = document.getElementById('lecturesSection');
    const lecturesList = document.getElementById('lecturesList');
    const selectAllCheckbox = document.getElementById('selectAll');
    const selectedCountSpan = document.getElementById('selectedCount');
    
    if (subjectSelect) {
        subjectSelect.addEventListener('change', function() {
            const subject = this.value;
            
            if (subject && lecturesData[subject]) {
                // Show lectures section
                lecturesSection.classList.remove('hidden');
                lecturesSection.classList.add('slide-in');
                
                // Populate lectures
                populateLectures(subject);
                
                // Reset select all
                selectAllCheckbox.checked = false;
                updateSelectedCount();
            } else {
                // Hide lectures section
                lecturesSection.classList.add('hidden');
                lecturesList.innerHTML = '';
            }
        });
    }
    
    // Select all functionality
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const checkboxes = lecturesList.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
                updateLectureCheckboxStyle(checkbox);
            });
            updateSelectedCount();
        });
    }
    
    // Question slider sync with input
    const questionSlider = document.getElementById('questionSlider');
    const questionInput = document.getElementById('questions');
    
    if (questionSlider && questionInput) {
        questionSlider.addEventListener('input', function() {
            questionInput.value = this.value;
        });
        
        questionInput.addEventListener('input', function() {
            questionSlider.value = this.value;
        });
    }
    
    // Difficulty buttons
    const difficultyBtns = document.querySelectorAll('.difficulty-btn');
    difficultyBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            difficultyBtns.forEach(b => {
                b.classList.remove('bg-primary', 'text-white', 'font-semibold', 'shadow-sm');
                b.classList.add('text-text-secondary', 'dark:text-dark-text-secondary');
            });
            this.classList.add('bg-primary', 'text-white', 'font-semibold', 'shadow-sm');
            this.classList.remove('text-text-secondary', 'dark:text-dark-text-secondary');
        });
    });
    
    // Question type checkboxes - update border style
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const parent = this.closest('.flex');
            if (this.checked) {
                parent.classList.add('border-2', 'border-primary');
                parent.classList.remove('border', 'border-border-color', 'dark:border-dark-border-color');
            } else {
                parent.classList.remove('border-2', 'border-primary');
                parent.classList.add('border', 'border-border-color', 'dark:border-dark-border-color');
            }
        });
    });
    
    // Generate button with validation and navigation to quiz
    const generateBtn = document.getElementById('generateBtn');
    const btnText = document.getElementById('btnText');
    
    if (generateBtn && btnText) {
        generateBtn.addEventListener('click', function() {
            // Validate form
            const subject = document.getElementById('subject').value;
            
            if (!subject) {
                showNotification('Please select a subject', 'error');
                return;
            }
            
            // Get selected lectures
            const lecturesList = document.getElementById('lecturesList');
            const selectedLectures = [];
            
            if (lecturesList) {
                const lectureCheckboxes = lecturesList.querySelectorAll('input[type="checkbox"]:checked');
                lectureCheckboxes.forEach(checkbox => {
                    selectedLectures.push(checkbox.getAttribute('data-lecture-id'));
                });
            }
            
            if (subject && selectedLectures.length === 0) {
                showNotification('Please select at least one lecture', 'error');
                return;
            }
            
            // Get selected difficulty
            const difficultyBtn = document.querySelector('.difficulty-btn.bg-primary');
            const difficulty = difficultyBtn ? difficultyBtn.getAttribute('data-level') : 'intermediate';
            
            // Get number of questions
            const numQuestions = document.getElementById('questions').value;
            
            // Get selected question types
            const questionTypes = [];
            if (document.getElementById('mcq').checked) questionTypes.push('multiple-choice');
            if (document.getElementById('tf').checked) questionTypes.push('true-false');
            if (document.getElementById('short-answer').checked) questionTypes.push('short-answer');
            if (document.getElementById('image-based').checked) questionTypes.push('image-based');
            if (document.getElementById('case-study').checked) questionTypes.push('case-study');
            
            if (questionTypes.length === 0) {
                showNotification('Please select at least one question type', 'error');
                return;
            }
            
            // Store exam configuration
            const examConfig = {
                subject: subject,
                difficulty: difficulty,
                numQuestions: numQuestions,
                questionTypes: questionTypes,
                selectedLectures: selectedLectures
            };
            
            localStorage.setItem('examConfig', JSON.stringify(examConfig));
            
            // Disable button
            this.disabled = true;
            this.classList.add('opacity-75', 'cursor-not-allowed');
            
            // Change button text
            btnText.innerHTML = '<span class="animate-pulse">Generating...</span>';
            
            // Simulate generation and navigate to quiz
            setTimeout(() => {
                showNotification('Exam generated successfully!', 'success');
                
                // Navigate to quiz page after a short delay
                setTimeout(() => {
                    window.location.href = 'quiz.html';
                }, 500);
            }, 1500);
        });
    }
}

// Populate lectures list
function populateLectures(subject) {
    const lecturesList = document.getElementById('lecturesList');
    const lectures = lecturesData[subject];
    
    lecturesList.innerHTML = '';
    
    lectures.forEach((lecture, index) => {
        const lectureItem = document.createElement('div');
        lectureItem.className = 'flex items-center gap-3 p-3 rounded-lg bg-card dark:bg-dark-card border border-border-color dark:border-dark-border-color hover:border-primary hover:shadow-md transition-all duration-200';
        
        lectureItem.innerHTML = `
            <input class="lecture-checkbox h-5 w-5 rounded border-border-color dark:border-dark-border-color text-primary focus:ring-primary" 
                   id="lecture-${lecture.id}" 
                   type="checkbox"
                   data-lecture-id="${lecture.id}"/>
            <div class="flex-1 cursor-pointer" onclick="document.getElementById('lecture-${lecture.id}').click()">
                <label class="text-sm font-medium text-text-primary dark:text-dark-text-primary cursor-pointer block" for="lecture-${lecture.id}">
                    ${lecture.name}
                </label>
                <span class="text-xs text-text-secondary dark:text-dark-text-secondary">${lecture.weeks}</span>
            </div>
            <span class="material-symbols-outlined text-text-secondary dark:text-dark-text-secondary text-sm">menu_book</span>
        `;
        
        lecturesList.appendChild(lectureItem);
        
        // Add event listener to update count and style
        const checkbox = lectureItem.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', function() {
            updateLectureCheckboxStyle(this);
            updateSelectedCount();
            updateSelectAllState();
        });
    });
    
    updateSelectedCount();
}

// Update lecture checkbox style
function updateLectureCheckboxStyle(checkbox) {
    const parent = checkbox.closest('.flex');
    if (checkbox.checked) {
        parent.classList.add('border-2', 'border-primary', 'bg-primary/5');
        parent.classList.remove('border', 'border-border-color', 'dark:border-dark-border-color');
    } else {
        parent.classList.remove('border-2', 'border-primary', 'bg-primary/5');
        parent.classList.add('border', 'border-border-color', 'dark:border-dark-border-color');
    }
}

// Update selected count
function updateSelectedCount() {
    const lecturesList = document.getElementById('lecturesList');
    const selectedCountSpan = document.getElementById('selectedCount');
    
    if (lecturesList && selectedCountSpan) {
        const checkboxes = lecturesList.querySelectorAll('input[type="checkbox"]');
        const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
        selectedCountSpan.textContent = checkedCount;
    }
}

// Update select all checkbox state
function updateSelectAllState() {
    const lecturesList = document.getElementById('lecturesList');
    const selectAllCheckbox = document.getElementById('selectAll');
    
    if (lecturesList && selectAllCheckbox) {
        const checkboxes = lecturesList.querySelectorAll('input[type="checkbox"]');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        const someChecked = Array.from(checkboxes).some(cb => cb.checked);
        
        selectAllCheckbox.checked = allChecked;
        selectAllCheckbox.indeterminate = someChecked && !allChecked;
    }
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
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}