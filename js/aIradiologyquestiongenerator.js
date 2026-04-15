

// Sample Questions
const sampleQuestions = [
    {
        id: 1,
        question: "What is the most likely diagnosis based on this radiograph?",
        options: ["Periapical abscess", "Periodontal disease", "Impacted tooth", "Normal anatomy"],
        correctAnswer: 0,
        difficulty: "beginner",
        explanation: "The radiolucent area at the apex of the tooth indicates a periapical abscess."
    },
    {
        id: 2,
        question: "Identify the anatomical structure indicated by the arrow in this radiograph.",
        options: ["Maxillary sinus", "Mandibular canal", "Mental foramen", "Zygomatic arch"],
        correctAnswer: 1,
        difficulty: "intermediate",
        explanation: "The mandibular canal is clearly visible as a radiolucent line running through the mandible."
    },
    {
        id: 3,
        question: "Which of the following is NOT a characteristic of a healthy periodontal ligament space?",
        options: ["Uniform width", "Radiolucent line", "Continuous with lamina dura", "Widened space"],
        correctAnswer: 3,
        difficulty: "advanced",
        explanation: "A widened periodontal ligament space is abnormal and may indicate periodontal disease or trauma."
    },
    {
        id: 4,
        question: "What radiographic feature best distinguishes a dental cyst from a granuloma?",
        options: ["Size of the lesion", "Location in the jaw", "Presence of a well-defined cortical border", "Associated tooth vitality"],
        correctAnswer: 2,
        difficulty: "intermediate",
        explanation: "A dental cyst typically shows a well-defined cortical border on radiographs."
    },
    {
        id: 5,
        question: "In a bitewing radiograph, which structure appears most radiopaque?",
        options: ["Enamel", "Dentin", "Pulp chamber", "Periodontal ligament space"],
        correctAnswer: 0,
        difficulty: "beginner",
        explanation: "Enamel is the most radiopaque structure due to its high mineral content."
    }
];

// Quiz State
let currentQuestionIndex = 0;
let userAnswers = [];
let quizStarted = false;
let uploadedImageData = null;
let uploadedImageName = '';
let imageExpanded = false;

// Marker State
let markers = [];
let canvas = null;
let ctx = null;
let markerTool = 'mark';

// Dark Mode - Using Global ThemeManager
function initializeDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const darkModeIcon = document.getElementById('darkModeIcon');
    const logoImg = document.getElementById('logoImage');
    
    if (logoImg) {
        // Set initial logo based on current theme
        const currentTheme = ThemeManager.getCurrentTheme();
        logoImg.src = currentTheme === 'dark' ? 'assets/Logo0.png' : 'assets/Logo.png';
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

// File Upload
function initializeFileUpload() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const generateBtn = document.getElementById('generateBtn');

    dropArea.addEventListener('click', () => fileInput.click());

    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.classList.add('drag-active');
    });

    dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('drag-active');
    });

    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.classList.remove('drag-active');
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    generateBtn.addEventListener('click', generateQuestions);
}

function handleFile(file) {
    if (file.size > 10 * 1024 * 1024) {
        showNotification('File size exceeds 10MB limit', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        uploadedImageData = e.target.result;
        uploadedImageName = file.name;
        
        document.getElementById('previewImage').src = e.target.result;
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent = formatFileSize(file.size);
        
        document.getElementById('uploadPrompt').classList.add('hidden');
        document.getElementById('filePreview').classList.remove('hidden');
        document.getElementById('generateBtn').disabled = false;

        showNotification('File uploaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
}

function removeFile() {
    uploadedImageData = null;
    uploadedImageName = '';
    
    document.getElementById('uploadPrompt').classList.remove('hidden');
    document.getElementById('filePreview').classList.add('hidden');
    document.getElementById('fileInput').value = '';
    document.getElementById('generateBtn').disabled = true;
    showNotification('File removed', 'info');
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// Generate Questions
function generateQuestions() {
    document.getElementById('uploadPrompt').classList.add('hidden');
    document.getElementById('filePreview').classList.add('hidden');
    document.getElementById('processingState').classList.remove('hidden');

    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        document.getElementById('progressBar').style.width = progress + '%';

        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => showQuestions(), 500);
        }
    }, 200);
}

function showQuestions() {
    document.getElementById('uploadSection').classList.add('hidden');
    document.getElementById('questionsSection').classList.remove('hidden');

    // Display uploaded image in quiz
    if (uploadedImageData) {
        document.getElementById('quizRadiographImage').src = uploadedImageData;
        document.getElementById('imageFileName').textContent = uploadedImageName;
        
        // Initialize canvas after image loads
        const img = document.getElementById('quizRadiographImage');
        img.onload = () => {
            initializeCanvas();
        };
    }

    userAnswers = new Array(sampleQuestions.length).fill(null);
    currentQuestionIndex = 0;
    quizStarted = true;

    renderQuestion();
    showNotification('Questions generated successfully!', 'success');
}

function renderQuestion() {
    const container = document.getElementById('questionContainer');
    const question = sampleQuestions[currentQuestionIndex];
    const questionNum = currentQuestionIndex + 1;

    // Update progress
    const answeredCount = userAnswers.filter(a => a !== null).length;
    document.getElementById('questionProgress').textContent = `Question ${questionNum} of ${sampleQuestions.length}`;
    document.getElementById('answeredCount').textContent = `• ${answeredCount} answered`;

    const difficultyColors = {
        beginner: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
        intermediate: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
        advanced: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
    };

    container.innerHTML = `
        <div class="bg-card dark:bg-dark-card rounded-2xl shadow-lg border border-border-color dark:border-dark-border-color p-6">
            <div class="flex justify-between items-start mb-6">
                <div class="flex items-start gap-3 flex-1">
                    <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span class="text-primary font-bold text-lg">${questionNum}</span>
                    </div>
                    <p class="text-lg font-semibold text-text-primary dark:text-dark-text-primary pt-2">${question.question}</p>
                </div>
                <span class="${difficultyColors[question.difficulty]} text-xs font-bold px-3 py-1.5 rounded-full border whitespace-nowrap ml-4">
                    ${question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                </span>
            </div>

            <div class="space-y-3">
                ${question.options.map((option, index) => `
                    <button onclick="selectAnswer(${index})" class="option-btn w-full p-4 text-left rounded-xl bg-background dark:bg-dark-background border-2 border-border-color dark:border-dark-border-color hover:border-primary hover:bg-primary/5 transition-all duration-300 flex items-center justify-between ${userAnswers[currentQuestionIndex] === index ? 'selected !border-primary !bg-primary/10 dark:!bg-primary/20' : ''}">
                        <div class="flex items-center flex-1">
                            <span class="font-bold mr-3 ${userAnswers[currentQuestionIndex] === index ? 'text-primary' : 'text-text-secondary dark:text-dark-text-secondary'}">${String.fromCharCode(65 + index)}.</span>
                            <span class="text-text-primary dark:text-dark-text-primary">${option}</span>
                        </div>
                        ${userAnswers[currentQuestionIndex] === index ? `
                            <span class="material-symbols-outlined text-primary text-2xl animate-pulse">check_circle</span>
                        ` : ''}
                    </button>
                `).join('')}
            </div>
        </div>
    `;

    document.getElementById('prevBtn').disabled = currentQuestionIndex === 0;
    document.getElementById('nextBtn').disabled = currentQuestionIndex === sampleQuestions.length - 1;
}

function selectAnswer(answerIndex) {
    const previousAnswer = userAnswers[currentQuestionIndex];
    userAnswers[currentQuestionIndex] = answerIndex;
    
    // Show confirmation
    const optionLetter = String.fromCharCode(65 + answerIndex);
    if (previousAnswer === null) {
        showNotification(`Answer ${optionLetter} selected ✓`, 'success');
    } else {
        showNotification(`Answer changed to ${optionLetter} ✓`, 'info');
    }
    
    renderQuestion();
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
    }
}

function nextQuestion() {
    if (currentQuestionIndex < sampleQuestions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
    }
}

function submitQuiz() {
    const unanswered = userAnswers.filter(a => a === null).length;
    const answered = sampleQuestions.length - unanswered;
    
    if (unanswered > 0) {
        // Show custom modal
        document.getElementById('unansweredCountModal').textContent = unanswered;
        document.getElementById('unansweredCountModal2').textContent = unanswered;
        document.getElementById('answeredCountModal').textContent = answered;
        document.getElementById('totalQuestionsModal').textContent = sampleQuestions.length;
        document.getElementById('submitModal').classList.remove('hidden');
        return;
    }

    // If all answered, submit directly
    processQuizSubmission();
}

function closeSubmitModal() {
    document.getElementById('submitModal').classList.add('hidden');
}

function confirmSubmit() {
    closeSubmitModal();
    processQuizSubmission();
}

function processQuizSubmission() {
    const unanswered = userAnswers.filter(a => a === null).length;
    const correct = userAnswers.filter((answer, index) => 
        answer !== null && answer === sampleQuestions[index].correctAnswer
    ).length;
    const incorrect = userAnswers.filter((answer, index) => 
        answer !== null && answer !== sampleQuestions[index].correctAnswer
    ).length;

    document.getElementById('questionsSection').classList.add('hidden');
    document.getElementById('resultsSection').classList.remove('hidden');

    const scorePercent = Math.round((correct / sampleQuestions.length) * 100);
    document.getElementById('scorePercent').textContent = scorePercent + '%';
    document.getElementById('correctCount').textContent = correct;
    document.getElementById('incorrectCount').textContent = incorrect;
    document.getElementById('unansweredCount').textContent = unanswered;

    const circumference = 2 * Math.PI * 70;
    const offset = circumference - (scorePercent / 100) * circumference;
    document.getElementById('scoreCircle').style.strokeDashoffset = offset;

    let message = '';
    if (scorePercent >= 90) message = 'Excellent work! You have mastered this topic!';
    else if (scorePercent >= 70) message = 'Good job! Keep practicing to improve.';
    else if (scorePercent >= 50) message = 'Not bad! Review the concepts and try again.';
    else message = 'Keep learning! Practice makes perfect.';

    document.getElementById('resultMessage').textContent = message;
    showNotification('Quiz submitted successfully!', 'success');
}

function resetQuiz() {
    if (confirm('Start over? Your progress will be lost.')) {
        currentQuestionIndex = 0;
        userAnswers = new Array(sampleQuestions.length).fill(null);
        clearMarkers();
        renderQuestion();
        showNotification('Quiz reset', 'info');
    }
}

function viewReview() {
    document.getElementById('resultsSection').classList.add('hidden');
    document.getElementById('reviewSection').classList.remove('hidden');
    
    // Render all questions with answers
    renderReview();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderReview() {
    const container = document.getElementById('reviewContainer');
    
    const reviewHTML = sampleQuestions.map((question, index) => {
        const userAnswer = userAnswers[index];
        const correctAnswer = question.correctAnswer;
        const isCorrect = userAnswer === correctAnswer;
        const isUnanswered = userAnswer === null;
        
        const difficultyColors = {
            beginner: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
            intermediate: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
            advanced: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
        };
        
        return `
            <div class="bg-card dark:bg-dark-card rounded-2xl shadow-lg border border-border-color dark:border-dark-border-color p-6">
                <!-- Header -->
                <div class="flex justify-between items-start mb-4">
                    <div class="flex items-start gap-3 flex-1">
                        <div class="w-10 h-10 ${isCorrect ? 'bg-green-100 dark:bg-green-900/30' : isUnanswered ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-red-100 dark:bg-red-900/30'} rounded-full flex items-center justify-center flex-shrink-0">
                            <span class="font-bold ${isCorrect ? 'text-green-600 dark:text-green-400' : isUnanswered ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}">${index + 1}</span>
                        </div>
                        <p class="text-lg font-semibold text-text-primary dark:text-dark-text-primary pt-1">${question.question}</p>
                    </div>
                    <div class="flex items-center gap-2 ml-4">
                        <span class="${difficultyColors[question.difficulty]} text-xs font-bold px-3 py-1 rounded-full border whitespace-nowrap">
                            ${question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                        </span>
                        ${isCorrect 
                            ? '<span class="material-symbols-outlined text-green-600 dark:text-green-400 text-2xl">check_circle</span>'
                            : isUnanswered
                            ? '<span class="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">help</span>'
                            : '<span class="material-symbols-outlined text-red-600 dark:text-red-400 text-2xl">cancel</span>'
                        }
                    </div>
                </div>
                
                <!-- Options -->
                <div class="space-y-2 mb-4">
                    ${question.options.map((option, optIndex) => {
                        const isUserAnswer = userAnswer === optIndex;
                        const isCorrectOption = correctAnswer === optIndex;
                        
                        let classes = 'p-3 rounded-lg border-2 flex items-center justify-between ';
                        let iconHTML = '';
                        
                        if (isCorrectOption && isUserAnswer) {
                            // Correct answer selected
                            classes += 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-600';
                            iconHTML = '<span class="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>';
                        } else if (isCorrectOption) {
                            // Correct answer not selected
                            classes += 'bg-green-50 dark:bg-green-900/10 border-green-300 dark:border-green-700';
                            iconHTML = '<span class="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>';
                        } else if (isUserAnswer) {
                            // Wrong answer selected
                            classes += 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-600';
                            iconHTML = '<span class="material-symbols-outlined text-red-600 dark:text-red-400">cancel</span>';
                        } else {
                            // Not selected
                            classes += 'bg-background dark:bg-dark-background border-border-color dark:border-dark-border-color opacity-60';
                        }
                        
                        return `
                            <div class="${classes}">
                                <div class="flex items-center">
                                    <span class="font-bold mr-3 ${isCorrectOption ? 'text-green-600 dark:text-green-400' : isUserAnswer ? 'text-red-600 dark:text-red-400' : 'text-text-secondary dark:text-dark-text-secondary'}">${String.fromCharCode(65 + optIndex)}.</span>
                                    <span class="text-text-primary dark:text-dark-text-primary">${option}</span>
                                </div>
                                ${iconHTML}
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <!-- Status Badge -->
                <div class="mb-4">
                    ${isCorrect 
                        ? '<div class="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-semibold"><span class="material-symbols-outlined text-sm">check_circle</span> Correct Answer</div>'
                        : isUnanswered
                        ? '<div class="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold"><span class="material-symbols-outlined text-sm">help</span> Not Answered</div>'
                        : `<div class="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm font-semibold"><span class="material-symbols-outlined text-sm">cancel</span> Incorrect - Correct Answer: ${String.fromCharCode(65 + correctAnswer)}</div>`
                    }
                </div>
                
                <!-- Explanation -->
                <div class="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <div class="flex items-start gap-3">
                        <span class="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl mt-0.5">info</span>
                        <div>
                            <p class="font-semibold text-blue-900 dark:text-blue-300 mb-1">Explanation</p>
                            <p class="text-sm text-blue-800 dark:text-blue-300">${question.explanation}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = reviewHTML;
}

function backToResults() {
    document.getElementById('reviewSection').classList.add('hidden');
    document.getElementById('resultsSection').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function downloadResults() {
    showNotification('Downloading results...', 'success');
}

function startNewQuiz() {
    document.getElementById('resultsSection').classList.add('hidden');
    document.getElementById('uploadSection').classList.remove('hidden');
    
    document.getElementById('uploadPrompt').classList.remove('hidden');
    document.getElementById('filePreview').classList.add('hidden');
    document.getElementById('processingState').classList.add('hidden');
    document.getElementById('fileInput').value = '';
    document.getElementById('generateBtn').disabled = true;
    document.getElementById('progressBar').style.width = '0%';

    // Reset image and markers
    uploadedImageData = null;
    uploadedImageName = '';
    imageExpanded = false;
    markers = [];

    quizStarted = false;
    showNotification('Ready for a new quiz!', 'info');
}

function toggleImageSize() {
    const img = document.getElementById('quizRadiographImage');
    const zoomIcon = document.getElementById('zoomIcon');
    const zoomText = document.getElementById('zoomText');
    
    imageExpanded = !imageExpanded;
    
    if (imageExpanded) {
        img.style.maxHeight = '600px';
        zoomIcon.textContent = 'zoom_out';
        zoomText.textContent = 'Collapse';
    } else {
        img.style.maxHeight = '300px';
        zoomIcon.textContent = 'zoom_in';
        zoomText.textContent = 'Expand';
    }
    
    // Reinitialize canvas with new size
    setTimeout(() => {
        initializeCanvas();
        redrawMarkers();
    }, 350);
}

// Canvas and Marker Functions
function initializeCanvas() {
    canvas = document.getElementById('markerCanvas');
    if (!canvas) return;
    
    ctx = canvas.getContext('2d');
    const img = document.getElementById('quizRadiographImage');
    const container = document.getElementById('imageContainer');
    
    // Set canvas size to match image
    canvas.width = img.offsetWidth;
    canvas.height = img.offsetHeight;
    
    // Add click event listener
    canvas.onclick = handleCanvasClick;
    
    // Redraw existing markers
    redrawMarkers();
}

function handleCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Add marker
    markers.push({ x, y, id: Date.now() });
    
    // Draw the new marker
    drawMarker(x, y);
    
    // Update counter
    updateMarkerCount();
    
    showNotification('Area marked successfully', 'success');
}

function drawMarker(x, y) {
    if (!ctx) return;
    
    // Draw crosshair marker
    ctx.strokeStyle = '#5BCBA7';
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(91, 203, 167, 0.5)';
    ctx.shadowBlur = 10;
    
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(x, y - 15);
    ctx.lineTo(x, y + 15);
    ctx.stroke();
    
    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(x - 15, y);
    ctx.lineTo(x + 15, y);
    ctx.stroke();
    
    // Center circle
    ctx.fillStyle = '#5BCBA7';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fill();
    
    // Outer circle
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Reset shadow
    ctx.shadowBlur = 0;
}

function redrawMarkers() {
    if (!ctx || !canvas) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Redraw all markers
    markers.forEach(marker => {
        drawMarker(marker.x, marker.y);
    });
}

function clearMarkers() {
    markers = [];
    if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    updateMarkerCount();
    showNotification('All markers cleared', 'info');
}

function setMarkerTool(tool) {
    markerTool = tool;
    const markBtn = document.getElementById('markTool');
    if (tool === 'mark') {
        markBtn.classList.add('bg-primary/20', 'text-primary');
    }
}

function updateMarkerCount() {
    const count = markers.length;
    const text = count === 1 ? 'Click to mark areas • 1 marker' : `Click to mark areas • ${count} markers`;
    document.getElementById('markerCount').textContent = text;
}

// Notifications
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeMobileMenu();
    initializeDarkMode();
    initializeDropdowns();
    hideCurrentPageFromDropdown();
    initializeFileUpload();
    
    // Close modal when clicking outside
    document.getElementById('submitModal').addEventListener('click', (e) => {
        if (e.target.id === 'submitModal') {
            closeSubmitModal();
        }
    });
});