


// Quiz data - will be populated from AI response ONLY
let quizData = [];


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

// Initialize quiz
document.addEventListener('DOMContentLoaded', function() {
    // Initialize mobile menu
    initializeMobileMenu();
    
    // Initialize dark mode
    initializeDarkMode();
    
    // Initialize navigation
    initializeNavigation();
    
    // Hide current page from Features dropdown
    hideCurrentPageFromDropdown();
    
    // Initialize dropdowns
    initializeDropdowns();
    
    // Review mode: ?review=<id> reopens a saved exam straight to its results.
    const reviewId = new URLSearchParams(window.location.search).get('review');
    if (reviewId) {
        loadSavedExamReview(reviewId);
    } else {
        // Load exam configuration
        loadExamConfig();
        // Start quiz
        startQuiz();
    }
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

    // Try to parse AI generated quiz
    const generatedRaw = localStorage.getItem('generatedQuizRaw');
    if (generatedRaw) {
        try {
            console.log("Raw AI response from localStorage:", generatedRaw);
            quizData = parseAIResponse(generatedRaw);
            if (quizData.length === 0) {
                showQuizError("The AI didn't return any valid questions. Please go back and try again.");
            } else {
                console.log("Successfully loaded AI questions:", quizData);
                // Header must reflect the ACTUAL number of questions parsed,
                // not the number requested (the model may under/over-deliver).
                const difficultyName = (examConfig.difficulty || 'intermediate');
                const diffLabel = difficultyName.charAt(0).toUpperCase() + difficultyName.slice(1);
                const examInfo = document.getElementById('examInfo');
                if (examInfo) {
                    examInfo.textContent = `${diffLabel} Level • ${quizData.length} Question${quizData.length === 1 ? '' : 's'}`;
                }
            }
        } catch (e) {
            console.error("Failed to parse generated quiz:", e, "\nRaw:", generatedRaw);
            showQuizError("Failed to parse the AI-generated quiz. Please go back and try again.");
        }
    } else {
        // No AI data found at all - redirect back
        showQuizError("No quiz data found. Please go back to the Exam Generator and upload your lecture material.");
    }
}

/**
 * Robustly parses the AI model's response into a clean array of questions.
 * Handles: single JSON object, JSON array, markdown code fences, options-as-one-string.
 */
function parseAIResponse(raw) {
    // 1. Strip markdown code fences (```json ... ``` or ``` ... ```)
    let text = raw.trim();
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
        text = fenceMatch[1].trim();
    }

    // 2. Try to parse whatever JSON is in there
    let parsed = null;

    // Try full parse first
    try {
        parsed = JSON.parse(text);
    } catch(_) {
        // Try extracting a JSON array [...] first, then object {...}
        const arrMatch = text.match(/(\[[\s\S]*\])/);
        const objMatch = text.match(/(\{[\s\S]*\})/);
        if (arrMatch) {
            try { parsed = JSON.parse(arrMatch[1]); } catch(_) {}
        }
        if (!parsed && objMatch) {
            try { parsed = JSON.parse(objMatch[1]); } catch(_) {}
        }
    }

    if (!parsed) return [];

    // 3. Normalise to array
    const questions = Array.isArray(parsed) ? parsed : [parsed];

    // 4. Normalise each question according to its type
    return questions.map(normaliseQuestion).filter(Boolean);
}

/**
 * Convert a raw question object (any supported type) into a shape the quiz UI
 * can render and grade. Option-based types carry {options, correct};
 * open-ended types carry {answer} and are graded leniently.
 */
function normaliseQuestion(q) {
    if (!q || typeof q !== 'object') return null;

    // Decide the effective type. When the user selected exactly ONE question
    // type, trust THAT over the model's "type" field (the model often mislabels
    // everything "multiple-choice"). Otherwise fall back to the model's label.
    const requested = (examConfig && Array.isArray(examConfig.questionTypes)) ? examConfig.questionTypes : [];
    let type = (q.type || 'multiple-choice').toString().toLowerCase();
    if (requested.length === 1 && QUESTION_TYPE_LABELS[requested[0]]) {
        type = requested[0];
    } else if (!QUESTION_TYPE_LABELS[type]) {
        type = 'multiple-choice';
    }

    const question = (q.question || '').toString().trim();
    const scenario = (q.scenario || '').toString().trim();
    // If the model returned an MCQ shape but the type is open-ended, use the
    // correct option's text as the model answer (graceful shape mismatch).
    const correctOptionText = (Array.isArray(q.options) && typeof q.correct === 'number')
        ? String(q.options[q.correct] ?? '').trim() : '';

    // Open-ended: short-answer & case-study (free-text, no fixed options)
    if (type === 'short-answer' || type === 'case-study') {
        return {
            type,
            scenario,
            question: question || (scenario ? 'Answer based on the scenario above.' : 'Unknown question?'),
            answer: (q.answer || q.correct_answer || correctOptionText || '').toString().trim()
        };
    }

    // True / False -> two fixed options
    if (type === 'true-false') {
        let truthy = true;
        if (typeof q.answer === 'boolean') truthy = q.answer;
        else if (q.answer !== undefined && q.answer !== null) truthy = String(q.answer).toLowerCase().includes('true');
        return {
            type,
            question: question || 'Unknown statement?',
            options: ['True', 'False'],
            correct: truthy ? 0 : 1
        };
    }

    // Option-based: multiple-choice & image-based
    // Model sometimes puts all options in one string: "A) X\nB) Y\nC) Z\nD) W"
    let options = q.options || [];
    if (Array.isArray(options) && options.length === 1 && typeof options[0] === 'string') {
        options = options[0].split(/\n|(?=[A-D]\))/g).map(s => s.trim()).filter(s => s.length > 0);
    }
    options = (Array.isArray(options) ? options : [])
        .map(opt => String(opt).replace(/^[A-Da-d][).]\s*/, '').trim());
    if (options.length < 2) {
        options = ["Option A", "Option B", "Option C", "Option D"];
    }

    return {
        type,
        question: question || 'Unknown question?',
        options,
        correct: typeof q.correct === 'number' ? q.correct : 0,
        imagePrompt: (q.image_prompt || q.imagePrompt || '').toString().trim(),
        imageUrl: (q.image_url || q.imageUrl || '').toString().trim()
    };
}

/**
 * Grade a single answer. Option types compare the selected index; open-ended
 * types do a lenient normalised comparison against the model's answer.
 */
function isAnswerCorrect(question, userAnswer) {
    if (userAnswer === null || userAnswer === undefined) return false;
    if (Array.isArray(question.options)) {
        return userAnswer === question.correct;
    }
    const norm = s => s.toString().toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
    const u = norm(userAnswer);
    const a = norm(question.answer || '');
    if (!u || !a) return false;
    return u === a || (a.length >= 3 && (u.includes(a) || a.includes(u)));
}

function showQuizError(message) {
    const quizContainer = document.getElementById('quizContainer') || document.querySelector('main');
    if (quizContainer) {
        quizContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center min-h-64 text-center p-8">
                <span class="material-symbols-outlined text-6xl text-red-400 mb-4">error_outline</span>
                <h2 class="text-2xl font-bold text-text-primary dark:text-dark-text-primary mb-3">Quiz Not Available</h2>
                <p class="text-text-secondary dark:text-dark-text-secondary mb-6">${message}</p>
                <a href="examgen.html" class="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all">
                    <span class="material-symbols-outlined">arrow_back</span>
                    Go Back to Exam Generator
                </a>
            </div>
        `;
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

const QUESTION_TYPE_LABELS = {
    'multiple-choice': 'Multiple Choice',
    'true-false': 'True / False',
    'short-answer': 'Short Answer',
    'case-study': 'Case Study',
    'image-based': 'Image Based'
};

function loadQuestion() {
    const question = quizData[currentQuestionIndex];
    const questionCard = document.getElementById('questionCard');

    // Update progress
    updateProgress();

    const label = QUESTION_TYPE_LABELS[question.type] || 'Question';

    // Header + (optional) scenario + (optional) image prompt + question text
    let html = `
        <div class="mb-6">
            <div class="flex items-center gap-3 mb-4">
                <span class="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-lg">
                    ${currentQuestionIndex + 1}
                </span>
                <span class="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    ${label}
                </span>
            </div>`;

    if (question.scenario) {
        html += `
            <div class="mb-4 p-4 rounded-lg bg-primary/5 border border-primary/20 text-sm leading-relaxed text-text-secondary dark:text-dark-text-secondary">
                <span class="font-semibold text-primary">Clinical Scenario: </span>${question.scenario}
            </div>`;
    }

    if (question.type === 'image-based') {
        if (question.imageUrl) {
            // Real figure extracted from the uploaded lecture PDF
            html += `
                <div class="mb-4 flex justify-center">
                    <img src="${question.imageUrl}" alt="Lecture figure"
                         class="max-h-80 w-auto rounded-lg border border-border-color dark:border-dark-border-color object-contain"
                         onerror="this.parentElement.style.display='none'">
                </div>`;
        } else if (question.imagePrompt) {
            // No real image available — fall back to the model's description
            html += `
                <div class="mb-4 p-4 rounded-lg border border-dashed border-border-color dark:border-dark-border-color flex items-start gap-3">
                    <span class="material-symbols-outlined text-primary">image</span>
                    <p class="text-sm italic text-text-secondary dark:text-dark-text-secondary">${question.imagePrompt}</p>
                </div>`;
        }
    }

    html += `
            <h3 class="text-xl font-semibold text-text-primary dark:text-dark-text-primary mb-6">
                ${question.question}
            </h3>
        </div>`;

    if (Array.isArray(question.options)) {
        // Option-based: multiple-choice, true-false, image-based
        html += '<div class="space-y-3">';
        question.options.forEach((option, index) => {
            const isSelected = userAnswers[currentQuestionIndex] === index;
            const selectedClass = isSelected ? 'option-selected border-2' : '';
            html += `
                <label class="flex items-center p-4 rounded-lg border border-border-color dark:border-dark-border-color hover:border-primary hover:bg-primary/5 transition-all cursor-pointer ${selectedClass}"
                       onclick="selectAnswer(${index})">
                    <input type="radio" name="answer" value="${index}" class="h-5 w-5 text-primary focus:ring-primary" ${isSelected ? 'checked' : ''}>
                    <span class="ml-4 text-text-primary dark:text-dark-text-primary flex-1">${option}</span>
                </label>`;
        });
        html += '</div>';
    } else {
        // Open-ended: short-answer & case-study
        const current = typeof userAnswers[currentQuestionIndex] === 'string' ? userAnswers[currentQuestionIndex] : '';
        html += `
            <textarea id="textAnswer" rows="4" oninput="setTextAnswer(this.value)"
                placeholder="Type your answer here..."
                class="w-full p-4 rounded-lg border border-border-color dark:border-dark-border-color bg-card dark:bg-dark-card text-text-primary dark:text-dark-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none">${current}</textarea>`;
    }

    questionCard.innerHTML = html;

    // Restore focus & caret for open-ended answers after the re-render
    const ta = document.getElementById('textAnswer');
    if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
}

function selectAnswer(answerIndex) {
    userAnswers[currentQuestionIndex] = answerIndex;
    loadQuestion(); // Reload to show selection
}

function setTextAnswer(value) {
    // Store the raw text (preserves caret); blank counts as unanswered
    userAnswers[currentQuestionIndex] = value.trim().length ? value : null;
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

function saveRecentExam(score, timeTaken) {
    const cfg = examConfig || {};
    const title = cfg.fileName
        ? cfg.fileName.replace(/\.[^.]+$/, '') + ' Exam'
        : 'Custom Document Exam';
    const difficulty = cfg.difficulty || 'intermediate';
    const numQuestions = quizData.length;

    // 1) Persist server-side, tied to the user account (shared across devices).
    //    Stores the full questions + answers so the exam can be reopened later.
    const token = localStorage.getItem('access_token');
    if (token && token !== 'dummy_token_for_dev') {
        fetch('/api/exams', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title,
                difficulty,
                num_questions: numQuestions,
                score,
                time_taken: typeof timeTaken === 'number' ? timeTaken : null,
                questions: quizData,
                answers: userAnswers
            })
        })
            .then(res => {
                if (!res.ok) {
                    console.error(`Exam save failed: HTTP ${res.status}. Is the backend restarted with the exams router?`);
                    return null;
                }
                return res.json();
            })
            .then(data => { if (data && data.points_earned) showPointsToast(data.points_earned); })
            .catch(err => console.warn('Could not save exam to server:', err));
    }

    // 2) Local cache fallback (shows up even when offline / not logged in).
    try {
        let list = [];
        try { list = JSON.parse(localStorage.getItem('recentExams') || '[]'); } catch (_) { list = []; }
        list.unshift({ title, difficulty, numQuestions, score, completedAt: Date.now() });
        list = list.slice(0, 6);
        localStorage.setItem('recentExams', JSON.stringify(list));
    } catch (e) {
        console.warn('Could not cache recent exam:', e);
    }
}

function showPointsToast(points) {
    const toast = document.createElement('div');
    toast.className = 'fixed top-24 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg bg-primary text-white transition-all duration-300';
    toast.innerHTML = `<span class="material-symbols-outlined">military_tech</span><span class="font-semibold">+${points} points earned!</span>`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3500);
}

function submitQuiz() {
    clearInterval(timerInterval);
    const scorePercent = renderResults(elapsedTime);
    // Persist this completed exam (server-side + local cache) and award points
    saveRecentExam(scorePercent, elapsedTime);
}

// Renders the score + review screen from the current quizData / userAnswers.
// Display-only — it never saves, so re-opening a saved exam won't re-save it.
function renderResults(elapsedSeconds) {
    let correctCount = 0;
    quizData.forEach((question, index) => {
        if (isAnswerCorrect(question, userAnswers[index])) correctCount++;
    });

    const totalQuestions = quizData.length;
    const incorrectCount = totalQuestions - correctCount;
    const scorePercent = totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0;

    const timeTakenStr = (typeof elapsedSeconds === 'number')
        ? `${Math.floor(elapsedSeconds / 60)}:${(elapsedSeconds % 60).toString().padStart(2, '0')}`
        : '—';

    document.getElementById('quizContainer')?.classList.add('hidden');
    document.getElementById('resultsContainer')?.classList.remove('hidden');

    document.getElementById('scorePercent').textContent = scorePercent;
    document.getElementById('correctCount').textContent = correctCount;
    document.getElementById('totalCount').textContent = totalQuestions;
    document.getElementById('correctAnswers').textContent = correctCount;
    document.getElementById('incorrectAnswers').textContent = incorrectCount;
    document.getElementById('timeTaken').textContent = timeTakenStr;

    generateReview();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return scorePercent;
}

// Opens a previously saved exam (from "Recent Exams") straight into review mode.
async function loadSavedExamReview(examId) {
    const token = localStorage.getItem('access_token');
    try {
        const res = await fetch(`/api/exams/${encodeURIComponent(examId)}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error('Exam not found');
        const exam = await res.json();

        quizData = Array.isArray(exam.questions) ? exam.questions : [];
        userAnswers = Array.isArray(exam.answers) ? exam.answers : new Array(quizData.length).fill(null);
        examConfig = { difficulty: exam.difficulty, fileName: exam.title, numQuestions: exam.num_questions };

        if (!quizData.length) {
            showQuizError("This saved exam has no stored questions to review.");
            return;
        }

        const examTitle = document.getElementById('examTitle');
        if (examTitle) examTitle.textContent = exam.title || 'Exam Review';
        const examInfo = document.getElementById('examInfo');
        if (examInfo) {
            const d = exam.difficulty || 'intermediate';
            examInfo.textContent = `${d.charAt(0).toUpperCase() + d.slice(1)} Level • ${quizData.length} Questions • Review`;
        }

        renderResults(typeof exam.time_taken === 'number' ? exam.time_taken : null);
        addReviewDeleteButton(examId);
    } catch (err) {
        console.error('Could not load saved exam:', err);
        showQuizError("Could not load this saved exam. It may have been removed.");
    }
}

// Adds a "Delete Exam" button to the top of the results screen in review mode.
function addReviewDeleteButton(examId) {
    const results = document.getElementById('resultsContainer');
    if (!results || document.getElementById('deleteExamBtn')) return;

    const bar = document.createElement('div');
    bar.className = 'flex justify-end mb-4';
    bar.innerHTML = `
        <button id="deleteExamBtn" type="button"
            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white font-semibold transition-all">
            <span class="material-symbols-outlined">delete</span>Delete Exam
        </button>`;
    results.prepend(bar);

    document.getElementById('deleteExamBtn').addEventListener('click', async () => {
        if (!confirm('Delete this exam permanently? This cannot be undone.')) return;
        const token = localStorage.getItem('access_token');
        try {
            const res = await fetch(`/api/exams/${encodeURIComponent(examId)}`, {
                method: 'DELETE',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (res.ok || res.status === 204) {
                window.location.href = 'examgen.html';
            } else {
                alert('Could not delete the exam (status ' + res.status + ').');
            }
        } catch (e) {
            console.error('Delete failed:', e);
            alert('Could not delete the exam. Please try again.');
        }
    });
}

function generateReview() {
    const reviewContainer = document.getElementById('reviewAnswers');
    let html = '';
    
    quizData.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        const isCorrect = isAnswerCorrect(question, userAnswer);
        const optionBased = Array.isArray(question.options);

        let userAnswerText, correctAnswerText;
        if (optionBased) {
            userAnswerText = (typeof userAnswer === 'number' && question.options[userAnswer] !== undefined)
                ? question.options[userAnswer] : 'Not answered';
            correctAnswerText = question.options[question.correct];
        } else {
            userAnswerText = (typeof userAnswer === 'string' && userAnswer.trim()) ? userAnswer : 'Not answered';
            correctAnswerText = question.answer || '—';
        }

        html += `
            <div class="p-4 rounded-lg border-2 ${isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-red-500 bg-red-50 dark:bg-red-900/10'}">
                <div class="flex items-start gap-3 mb-3">
                    <span class="flex items-center justify-center w-8 h-8 rounded-full ${isCorrect ? 'bg-green-500' : 'bg-red-500'} text-white font-bold">
                        ${index + 1}
                    </span>
                    <div class="flex-1">
                        ${question.scenario ? `<p class="text-xs text-text-secondary dark:text-dark-text-secondary mb-2"><span class="font-semibold text-primary">Scenario:</span> ${question.scenario}</p>` : ''}
                        <h4 class="font-semibold text-text-primary dark:text-dark-text-primary mb-2">
                            ${question.question}
                        </h4>
                        <div class="space-y-2 text-sm">
                            <p class="flex items-start gap-2">
                                <span class="material-symbols-outlined text-xs ${isCorrect ? 'text-green-500' : 'text-red-500'}">
                                    ${isCorrect ? 'check_circle' : 'cancel'}
                                </span>
                                <span class="font-medium">Your answer:</span>
                                <span class="${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
                                    ${userAnswerText}
                                </span>
                            </p>
                            ${!isCorrect ? `
                                <p class="flex items-start gap-2">
                                    <span class="material-symbols-outlined text-xs text-green-500">check_circle</span>
                                    <span class="font-medium">Correct answer:</span>
                                    <span class="text-green-600 dark:text-green-400">
                                        ${correctAnswerText}
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