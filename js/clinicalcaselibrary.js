

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
    renderLibraryProgress();
    renderLibraryRatings();
    initializeResetProgress();
});

// Student ratings + completion counts (written by the Case Simulator) -------
const RATINGS_KEY = 'dentor_case_ratings';
const COMPLETIONS_KEY = 'dentor_case_completions';

function getRatings() {
    try {
        return JSON.parse(localStorage.getItem(RATINGS_KEY)) || {};
    } catch (e) {
        return {};
    }
}

function getCompletions() {
    try {
        return JSON.parse(localStorage.getItem(COMPLETIONS_KEY)) || {};
    } catch (e) {
        return {};
    }
}

// Overall rating for a case = average of all student ratings (0 until rated).
function caseAverage(id) {
    const entry = getRatings()[id];
    if (!entry || !entry.studentCount) return 0;
    return entry.studentSum / entry.studentCount;
}

// Update each card's rating, completion count, and the overall "Avg Rating".
function renderLibraryRatings() {
    const cards = document.querySelectorAll('.case-card');
    const completions = getCompletions();
    let sum = 0;
    let rated = 0;

    cards.forEach(card => {
        const id = card.getAttribute('data-case');
        if (!id) return;

        const avg = caseAverage(id);
        card.querySelectorAll('.card-rating').forEach(el => {
            el.textContent = avg.toFixed(1);
        });
        if (avg > 0) { sum += avg; rated += 1; }

        const count = completions[id] || 0;
        card.querySelectorAll('.card-count').forEach(el => {
            el.textContent = count;
        });
    });

    const avgEl = document.getElementById('statAvgRating');
    if (avgEl) avgEl.textContent = rated > 0 ? (sum / rated).toFixed(1) : '0.0';
}

// Shared progress storage (written by the Case Simulator)
const PROGRESS_KEY = 'dentor_case_progress';

function getProgress() {
    try {
        return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
    } catch (e) {
        return {};
    }
}

// Read saved progress and update the stats, "Your Progress", specialty mastery,
// and each case card's status.
function renderLibraryProgress() {
    const progress = getProgress();
    const cards = document.querySelectorAll('.case-card');
    const totalCases = cards.length || 1;

    let completedCount = 0;
    let scoreSum = 0;

    cards.forEach(card => {
        const id = card.getAttribute('data-case');
        const record = id ? progress[id] : null;
        const badge = card.querySelector('.status-badge');
        const cta = card.querySelector('.card-cta');

        if (record && record.completed) {
            completedCount += 1;
            scoreSum += record.score;

            if (badge) {
                badge.textContent = 'Completed';
                badge.className = 'status-badge bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg';
            }
            if (cta) cta.textContent = 'Review Case';
        }
    });

    const avgScore = completedCount > 0 ? Math.round(scoreSum / completedCount) : null;

    // Stats cards
    setText('statTotal', totalCases);
    setText('statCompleted', completedCount);

    // Your Progress card
    setText('progressCompleted', completedCount + '/' + totalCases);
    const bar = document.getElementById('progressBarFill');
    if (bar) bar.style.width = Math.round((completedCount / totalCases) * 100) + '%';
    setText('progressAvgScore', avgScore === null ? '—' : avgScore + '%');

    // Specialty mastery (one case per specialty in the current library)
    updateMastery('restorative', progress, 'masteryRestorativePct', 'masteryRestorativeBar');
    updateMastery('orthodontics', progress, 'masteryOrthodonticsPct', 'masteryOrthodonticsBar');
}

function updateMastery(specialtyKey, progress, pctId, barId) {
    let best = 0;
    Object.keys(progress).forEach(id => {
        const rec = progress[id];
        if (rec && rec.completed && rec.specialty === specialtyKey) {
            best = Math.max(best, rec.score);
        }
    });
    setText(pctId, best + '%');
    const bar = document.getElementById(barId);
    if (bar) bar.style.width = best + '%';
}

function initializeResetProgress() {
    const btn = document.getElementById('resetProgressBtn');
    if (!btn) return;
    btn.addEventListener('click', function() {
        localStorage.removeItem(PROGRESS_KEY);
        renderLibraryProgress();
    });
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// Dark Mode - Using Global ThemeManager
function initializeDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const darkModeIcon = document.getElementById('darkModeIcon');
    const logoImage = document.getElementById('logoImage');
    
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
            
            // Update logo
            logoImage.src = newTheme === 'dark' ? darkLogo : lightLogo;
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