

// Sample quiz data
const quizData = [
    {
        question: "Which of the following is NOT a function of saliva?",
        options: [
            "Digestion of proteins",
            "Lubrication of food",
            "Antibacterial action",
            "Initial digestion of carbohydrates"
        ],
        correct: 0,
        type: "multiple-choice"
    },
    {
        question: "What is the hardest substance in the human body?",
        options: [
            "Bone",
            "Dentin",
            "Enamel",
            "Cementum"
        ],
        correct: 2,
        type: "multiple-choice"
    },
    {
        question: "The temporomandibular joint connects which two structures?",
        options: [
            "Maxilla and mandible",
            "Temporal bone and mandible",
            "Zygomatic bone and mandible",
            "Sphenoid bone and maxilla"
        ],
        correct: 1,
        type: "multiple-choice"
    },
    {
        question: "Which muscle is primarily responsible for closing the jaw?",
        options: [
            "Lateral pterygoid",
            "Digastric",
            "Masseter",
            "Mylohyoid"
        ],
        correct: 2,
        type: "multiple-choice"
    },
    {
        question: "How many deciduous (primary) teeth do humans have?",
        options: [
            "16",
            "20",
            "24",
            "32"
        ],
        correct: 1,
        type: "multiple-choice"
    },
    {
        question: "Which nerve provides sensation to the lower teeth?",
        options: [
            "Maxillary nerve",
            "Inferior alveolar nerve",
            "Lingual nerve",
            "Facial nerve"
        ],
        correct: 1,
        type: "multiple-choice"
    },
    {
        question: "What is the normal pH range of saliva?",
        options: [
            "5.0-5.5",
            "6.2-7.6",
            "7.8-8.5",
            "8.0-9.0"
        ],
        correct: 1,
        type: "multiple-choice"
    },
    {
        question: "Which structure forms the roof of the mouth?",
        options: [
            "Hard palate only",
            "Soft palate only",
            "Both hard and soft palate",
            "Palatine tonsils"
        ],
        correct: 2,
        type: "multiple-choice"
    },
    {
        question: "What is the primary function of the periodontal ligament?",
        options: [
            "Produce saliva",
            "Anchor tooth to bone",
            "Protect pulp",
            "Create enamel"
        ],
        correct: 1,
        type: "multiple-choice"
    },
    {
        question: "Which blood vessel supplies the maxillary teeth?",
        options: [
            "Facial artery",
            "Lingual artery",
            "Maxillary artery",
            "External carotid artery"
        ],
        correct: 2,
        type: "multiple-choice"
    }
];

let currentQuestionIndex = 0;
let userAnswers = [];
let timerInterval;
let startTime;
let elapsedTime = 0;
let examConfig = null;

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

// Initialize quiz
document.addEventListener('DOMContentLoaded', function() {
    // Initialize mobile menu
    initializeMobileMenu();
    
    // Initialize dark mode
    initializeDarkMode();
    
    // Initialize navigation
    initializeNavigation();
    
    // Initialize dropdowns
    initializeDropdowns();
    
    // Load exam configuration
    loadExamConfig();
    
    // Start quiz
    startQuiz();
});

// Lectures data (same as exam gen page)
const lecturesDataQuiz = {
    anatomy: [
        { id: 1, name: "Introduction to Dental Anatomy" },
        { id: 2, name: "Tooth Morphology and Structure" },
        { id: 3, name: "Oral Cavity Structures" },
        { id: 4, name: "Temporomandibular Joint" },
        { id: 5, name: "Muscles of Mastication" },
        { id: 6, name: "Blood Supply and Innervation" },
        { id: 7, name: "Salivary Glands" }
    ],
    pharmacology: [
        { id: 1, name: "Introduction to Dental Pharmacology" },
        { id: 2, name: "Local Anesthetics" },
        { id: 3, name: "Analgesics and Pain Management" },
        { id: 4, name: "Antibiotics in Dentistry" },
        { id: 5, name: "Sedation and Anxiolytics" },
        { id: 6, name: "Emergency Medications" },
        { id: 7, name: "Drug Interactions" }
    ],
    pathology: [
        { id: 1, name: "Introduction to Oral Pathology" },
        { id: 2, name: "Dental Caries and Pulp Disease" },
        { id: 3, name: "Periodontal Diseases" },
        { id: 4, name: "Oral Infections" },
        { id: 5, name: "Oral Lesions and Tumors" },
        { id: 6, name: "Developmental Disorders" },
        { id: 7, name: "Systemic Diseases in Dentistry" }
    ],
    radiology: [
        { id: 1, name: "Introduction to Dental Radiography" },
        { id: 2, name: "Radiation Physics and Safety" },
        { id: 3, name: "Intraoral Radiographic Techniques" },
        { id: 4, name: "Extraoral Radiography" },
        { id: 5, name: "Panoramic Imaging" },
        { id: 6, name: "CBCT and 3D Imaging" },
        { id: 7, name: "Radiographic Interpretation" }
    ]
};

// Load exam configuration from localStorage
function loadExamConfig() {
    const storedConfig = localStorage.getItem('examConfig');
    
    if (storedConfig) {
        examConfig = JSON.parse(storedConfig);
        
        // Update exam title and info
        const subjectName = examConfig.subject.charAt(0).toUpperCase() + examConfig.subject.slice(1);
        const difficultyName = examConfig.difficulty.charAt(0).toUpperCase() + examConfig.difficulty.slice(1);
        
        document.getElementById('examTitle').textContent = `${subjectName} Exam`;
        document.getElementById('examInfo').textContent = 
            `${difficultyName} Level • ${examConfig.numQuestions} Questions`;
        
        // Display selected lectures
        if (examConfig.selectedLectures && examConfig.selectedLectures.length > 0) {
            const lecturesInfo = document.getElementById('lecturesInfo');
            const lecturesList = document.getElementById('lecturesList');
            
            lecturesInfo.classList.remove('hidden');
            
            // Get lecture names
            const subjectLectures = lecturesDataQuiz[examConfig.subject] || [];
            examConfig.selectedLectures.forEach(lectureId => {
                const lecture = subjectLectures.find(l => l.id == lectureId);
                if (lecture) {
                    const badge = document.createElement('span');
                    badge.className = 'text-xs px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20';
                    badge.textContent = lecture.name;
                    lecturesList.appendChild(badge);
                }
            });
        }
    } else {
        // Default configuration if none exists
        examConfig = {
            subject: 'anatomy',
            difficulty: 'intermediate',
            numQuestions: 10,
            questionTypes: ['multiple-choice'],
            selectedLectures: []
        };
    }
}

function startQuiz() {
    currentQuestionIndex = 0;
    userAnswers = new Array(quizData.length).fill(null);
    startTime = Date.now();
    
    // Start timer
    startTimer();
    
    // Load first question
    loadQuestion();
    
    // Setup navigation buttons
    setupNavigation();
}

function startTimer() {
    let timeRemaining = 25 * 60; // 25 minutes in seconds
    
    timerInterval = setInterval(() => {
        elapsedTime++;
        timeRemaining--;
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            submitQuiz();
            return;
        }
        
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        document.getElementById('timer').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Change color when time is running out
        if (timeRemaining <= 60) {
            document.getElementById('timer').classList.add('text-red-500');
        } else if (timeRemaining <= 300) {
            document.getElementById('timer').classList.add('text-yellow-600');
        }
    }, 1000);
}

function loadQuestion() {
    const question = quizData[currentQuestionIndex];
    const questionCard = document.getElementById('questionCard');
    
    // Update progress
    updateProgress();
    
    // Build question HTML
    let html = `
        <div class="mb-6">
            <div class="flex items-center gap-3 mb-4">
                <span class="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-lg">
                    ${currentQuestionIndex + 1}
                </span>
                <span class="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    Multiple Choice
                </span>
            </div>
            <h3 class="text-xl font-semibold text-text-primary dark:text-dark-text-primary mb-6">
                ${question.question}
            </h3>
        </div>
        <div class="space-y-3">
    `;
    
    question.options.forEach((option, index) => {
        const isSelected = userAnswers[currentQuestionIndex] === index;
        const selectedClass = isSelected ? 'option-selected border-2' : '';
        
        html += `
            <label class="flex items-center p-4 rounded-lg border border-border-color dark:border-dark-border-color hover:border-primary hover:bg-primary/5 transition-all cursor-pointer ${selectedClass}" 
                   onclick="selectAnswer(${index})">
                <input type="radio" name="answer" value="${index}" class="h-5 w-5 text-primary focus:ring-primary" ${isSelected ? 'checked' : ''}>
                <span class="ml-4 text-text-primary dark:text-dark-text-primary flex-1">${option}</span>
            </label>
        `;
    });
    
    html += '</div>';
    
    questionCard.innerHTML = html;
}

function selectAnswer(answerIndex) {
    userAnswers[currentQuestionIndex] = answerIndex;
    loadQuestion(); // Reload to show selection
}

function updateProgress() {
    const progress = ((currentQuestionIndex) / quizData.length) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
    document.getElementById('currentQuestion').textContent = currentQuestionIndex + 1;
    document.getElementById('totalQuestions').textContent = quizData.length;
    document.getElementById('progressPercent').textContent = Math.round(progress);
}

function setupNavigation() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    prevBtn.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            loadQuestion();
            updateNavigationButtons();
        }
    });
    
    nextBtn.addEventListener('click', () => {
        if (currentQuestionIndex < quizData.length - 1) {
            currentQuestionIndex++;
            loadQuestion();
            updateNavigationButtons();
        }
    });
    
    submitBtn.addEventListener('click', () => {
        openSubmitModal();
    });
    
    updateNavigationButtons();
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    prevBtn.disabled = currentQuestionIndex === 0;
    
    if (currentQuestionIndex === quizData.length - 1) {
        nextBtn.classList.add('hidden');
        submitBtn.classList.remove('hidden');
    } else {
        nextBtn.classList.remove('hidden');
        submitBtn.classList.add('hidden');
    }
}

// Open submit modal
function openSubmitModal() {
    const modal = document.getElementById('submitModal');
    const answeredCount = userAnswers.filter(answer => answer !== null).length;
    const unansweredCount = quizData.length - answeredCount;
    
    document.getElementById('answeredCount').textContent = answeredCount;
    document.getElementById('totalQuestionsModal').textContent = quizData.length;
    
    // Show/hide warning
    const warningDiv = document.getElementById('unansweredWarning');
    if (unansweredCount > 0) {
        warningDiv.classList.remove('hidden');
        document.getElementById('unansweredCount').textContent = unansweredCount;
    } else {
        warningDiv.classList.add('hidden');
    }
    
    modal.classList.remove('hidden');
}

// Close submit modal
function closeSubmitModal() {
    const modal = document.getElementById('submitModal');
    modal.classList.add('hidden');
}

// Confirm submit
function confirmSubmit() {
    closeSubmitModal();
    submitQuiz();
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('submitModal');
    if (e.target === modal) {
        closeSubmitModal();
    }
});

function submitQuiz() {
    clearInterval(timerInterval);
    
    // Calculate results
    let correctCount = 0;
    quizData.forEach((question, index) => {
        if (userAnswers[index] === question.correct) {
            correctCount++;
        }
    });
    
    const totalQuestions = quizData.length;
    const incorrectCount = totalQuestions - correctCount;
    const scorePercent = Math.round((correctCount / totalQuestions) * 100);
    
    // Format time taken
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    const timeTakenStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Hide quiz container
    document.getElementById('quizContainer').classList.add('hidden');
    
    // Show results container
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.classList.remove('hidden');
    
    // Update results
    document.getElementById('scorePercent').textContent = scorePercent;
    document.getElementById('correctCount').textContent = correctCount;
    document.getElementById('totalCount').textContent = totalQuestions;
    document.getElementById('correctAnswers').textContent = correctCount;
    document.getElementById('incorrectAnswers').textContent = incorrectCount;
    document.getElementById('timeTaken').textContent = timeTakenStr;
    
    // Generate review
    generateReview();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function generateReview() {
    const reviewContainer = document.getElementById('reviewAnswers');
    let html = '';
    
    quizData.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        const correctAnswer = question.correct;
        const isCorrect = userAnswer === correctAnswer;
        
        html += `
            <div class="p-4 rounded-lg border-2 ${isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-red-500 bg-red-50 dark:bg-red-900/10'}">
                <div class="flex items-start gap-3 mb-3">
                    <span class="flex items-center justify-center w-8 h-8 rounded-full ${isCorrect ? 'bg-green-500' : 'bg-red-500'} text-white font-bold">
                        ${index + 1}
                    </span>
                    <div class="flex-1">
                        <h4 class="font-semibold text-text-primary dark:text-dark-text-primary mb-2">
                            ${question.question}
                        </h4>
                        <div class="space-y-2 text-sm">
                            <p class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-xs ${isCorrect ? 'text-green-500' : 'text-red-500'}">
                                    ${isCorrect ? 'check_circle' : 'cancel'}
                                </span>
                                <span class="font-medium">Your answer:</span>
                                <span class="${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
                                    ${userAnswer !== null ? question.options[userAnswer] : 'Not answered'}
                                </span>
                            </p>
                            ${!isCorrect ? `
                                <p class="flex items-center gap-2">
                                    <span class="material-symbols-outlined text-xs text-green-500">check_circle</span>
                                    <span class="font-medium">Correct answer:</span>
                                    <span class="text-green-600 dark:text-green-400">
                                        ${question.options[correctAnswer]}
                                    </span>
                                </p>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    reviewContainer.innerHTML = html;
}

// Dark Mode
function initializeDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const darkModeIcon = document.getElementById('darkModeIcon');
    const logoImage = document.getElementById('logoImage');
    const htmlElement = document.documentElement;
    
    const lightLogo = 'assets/Logo.png';
    const darkLogo = 'assets/Logo0.png';
    
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    if (currentTheme === 'dark') {
        htmlElement.classList.add('dark');
        darkModeIcon.textContent = 'dark_mode';
        logoImage.src = darkLogo;
    } else {
        htmlElement.classList.remove('dark');
        darkModeIcon.textContent = 'light_mode';
        logoImage.src = lightLogo;
    }
    
    darkModeToggle.addEventListener('click', function() {
        htmlElement.classList.toggle('dark');
        
        const newTheme = htmlElement.classList.contains('dark') ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        
        if (newTheme === 'dark') {
            darkModeIcon.textContent = 'dark_mode';
            logoImage.src = darkLogo;
        } else {
            darkModeIcon.textContent = 'light_mode';
            logoImage.src = lightLogo;
        }
    });
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

// Mobile Menu (already defined above, initialization called in DOMContentLoaded)

// Dropdowns
function initializeDropdowns() {
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    
    // Only setup if elements exist
    if (!notificationBtn || !notificationDropdown || !profileBtn || !profileDropdown) {
        return;
    }
    
    notificationBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        notificationDropdown.classList.toggle('hidden');
        profileDropdown.classList.add('hidden');
    });
    
    profileBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        profileDropdown.classList.toggle('hidden');
        notificationDropdown.classList.add('hidden');
    });
    
    document.addEventListener('click', function(e) {
        if (!notificationBtn.contains(e.target) && !notificationDropdown.contains(e.target)) {
            notificationDropdown.classList.add('hidden');
        }
        if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.add('hidden');
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Check if submit modal is open first
            const submitModal = document.getElementById('submitModal');
            if (submitModal && !submitModal.classList.contains('hidden')) {
                closeSubmitModal();
            } else {
                notificationDropdown.classList.add('hidden');
                profileDropdown.classList.add('hidden');
            }
        }
    });
}