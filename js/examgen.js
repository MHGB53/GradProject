

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

    // Render previously completed exams from localStorage
    renderRecentExams();
});

// Lectures data by subject
// Exam Generator Functionality
function initializeExamGenerator() {
    // Show file name when selected
    const fileInput = document.getElementById('referenceFile');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const dropZone = document.getElementById('dropZone');
    
    if (fileInput && fileNameDisplay && dropZone) {
        // Handle file input change
        fileInput.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                fileNameDisplay.textContent = this.files[0].name;
                fileNameDisplay.classList.remove('hidden');
                dropZone.classList.add('border-primary', 'bg-primary/5');
            } else {
                fileNameDisplay.classList.add('hidden');
                dropZone.classList.remove('border-primary', 'bg-primary/5');
            }
        });

        // Drag and drop functionality
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, unhighlight, false);
        });

        function highlight(e) {
            dropZone.classList.add('border-primary', 'bg-primary/10');
        }

        function unhighlight(e) {
            dropZone.classList.remove('border-primary', 'bg-primary/10');
        }

        dropZone.addEventListener('drop', handleDrop, false);

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files && files.length > 0) {
                fileInput.files = files; // Assign files to input
                
                // Manually trigger change event
                const event = new Event('change');
                fileInput.dispatchEvent(event);
            }
        }
    }
    
    // Question slider — live value label
    const questionSlider = document.getElementById('questionSlider');
    const questionsVal = document.getElementById('questionsVal');
    if (questionSlider && questionsVal) {
        questionsVal.textContent = questionSlider.value;
        questionSlider.addEventListener('input', function() {
            questionsVal.textContent = this.value;
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
            // Validate file input
            const fileInput = document.getElementById('referenceFile');
            if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
                showNotification('Please upload a reference document (PDF/Word)', 'error');
                return;
            }
            
            // Get selected difficulty
            const difficultyBtn = document.querySelector('.difficulty-btn.bg-primary');
            const difficulty = difficultyBtn ? difficultyBtn.getAttribute('data-level') : 'intermediate';
            
            // Get number of questions (from the slider)
            const numQuestions = document.getElementById('questionSlider').value;
            
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
                subject: "Custom Document", // Default subject
                fileName: (fileInput.files[0] && fileInput.files[0].name) || "Custom Document",
                difficulty: difficulty,
                numQuestions: numQuestions,
                questionTypes: questionTypes,
                selectedLectures: []
            };
            
            localStorage.setItem('examConfig', JSON.stringify(examConfig));
            
            // Disable button
            this.disabled = true;
            this.classList.add('opacity-75', 'cursor-not-allowed');
            
            // Change button text
            btnText.innerHTML = '<span class="animate-pulse">Generating...</span>';
            
            // Generate real quiz from AI proxy
            // Bypass login requirement for development / testing
            let token = localStorage.getItem('token');
            if (!token) {
                token = 'dummy_token_for_dev';
            }

            const formData = new FormData();
            formData.append('subject', "Custom Document");
            formData.append('difficulty', difficulty);
            formData.append('num_questions', parseInt(numQuestions));
            formData.append('question_types', JSON.stringify(questionTypes));
            formData.append('lectures', JSON.stringify([]));

            if (fileInput && fileInput.files.length > 0) {
                formData.append('file', fileInput.files[0]);
            }

            fetch('/api/ai/generate-quiz', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    // Store the raw response in localStorage for the quiz page to parse
                    localStorage.setItem('generatedQuizRaw', data.raw_response);
                    showNotification('Exam generated successfully!', 'success');
                    
                    setTimeout(() => {
                        window.location.href = 'quiz.html';
                    }, 500);
                } else {
                    throw new Error(data.detail || "Failed to generate quiz");
                }
            })
            .catch(err => {
                console.error("Quiz gen error:", err);
                showNotification('Failed to generate exam. The model might be loading.', 'error');
                
                // Re-enable button
                this.disabled = false;
                this.classList.remove('opacity-75', 'cursor-not-allowed');
                btnText.innerHTML = 'Generate Exam';
            });
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

// ─────────────────────── Recent Exams (localStorage) ───────────────────────
function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function timeAgo(ts) {
    if (!ts) return 'recently';
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
}

async function fetchRecentExams() {
    // Prefer the server (per-account, shared across devices); fall back to the
    // local cache when not logged in or the request fails.
    const token = localStorage.getItem('access_token');
    if (token) {
        try {
            const res = await fetch('/api/exams/recent', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                return data.map(e => ({
                    id: e.id,
                    title: e.title,
                    difficulty: e.difficulty,
                    numQuestions: e.num_questions,
                    score: e.score,
                    completedAt: e.created_at ? new Date(e.created_at).getTime() : null
                }));
            }
        } catch (err) {
            console.warn('Could not load exams from server, using local cache:', err);
        }
    }
    try { return JSON.parse(localStorage.getItem('recentExams') || '[]'); } catch (_) { return []; }
}

async function renderRecentExams() {
    const list = document.getElementById('recentExamsList');
    if (!list) return;

    const exams = await fetchRecentExams();

    if (!exams.length) {
        list.className = '';
        list.innerHTML = `
            <div class="bg-card dark:bg-dark-card rounded-2xl shadow-subtle p-10 border border-dashed border-border-color dark:border-dark-border-color text-center">
                <span class="material-symbols-outlined text-4xl text-text-secondary dark:text-dark-text-secondary mb-2">history</span>
                <p class="text-text-secondary dark:text-dark-text-secondary">No exams yet. Generate and complete an exam to see it here.</p>
            </div>`;
        return;
    }

    list.className = 'grid md:grid-cols-2 gap-6';
    list.innerHTML = exams.map(ex => {
        const score = typeof ex.score === 'number' ? ex.score : 0;
        const scoreColor = score >= 70
            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
            : score >= 50
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
        const diff = (ex.difficulty || 'intermediate');
        const diffLabel = diff.charAt(0).toUpperCase() + diff.slice(1);
        return `
            <div class="bg-card dark:bg-dark-card rounded-2xl shadow-subtle p-6 border border-border-color dark:border-dark-border-color hover:border-primary transition-all">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-3">
                        <span class="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                            <span class="material-symbols-outlined text-2xl text-primary">quiz</span>
                        </span>
                        <div>
                            <h4 class="font-bold text-text-primary dark:text-dark-text-primary">${escapeHtml(ex.title || 'Custom Document Exam')}</h4>
                            <p class="text-xs text-text-secondary dark:text-dark-text-secondary">${diffLabel} • ${ex.numQuestions || 0} Questions</p>
                        </div>
                    </div>
                    <span class="text-xs font-semibold px-3 py-1 rounded-full ${scoreColor}">${score}%</span>
                </div>
                <div class="flex items-center justify-between text-xs text-text-secondary dark:text-dark-text-secondary">
                    <span>Completed ${timeAgo(ex.completedAt)}</span>
                    ${ex.id ? `<a href="quiz.html?review=${ex.id}" class="text-primary hover:underline font-semibold">View Results</a>` : ''}
                </div>
            </div>`;
    }).join('');
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