

// Daily Wisdom Quotes
const dailyQuotes = [
    {
        quote: "The only way to do great work is to love what you do.",
        author: "Steve Jobs"
    },
    {
        quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        author: "Winston Churchill"
    },
    {
        quote: "The future belongs to those who believe in the beauty of their dreams.",
        author: "Eleanor Roosevelt"
    },
    {
        quote: "In the middle of difficulty lies opportunity.",
        author: "Albert Einstein"
    },
    {
        quote: "Be yourself; everyone else is already taken.",
        author: "Oscar Wilde"
    },
    {
        quote: "Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.",
        author: "Albert Einstein"
    },
    {
        quote: "So many books, so little time.",
        author: "Frank Zappa"
    },
    {
        quote: "A room without books is like a body without a soul.",
        author: "Marcus Tullius Cicero"
    },
    {
        quote: "You only live once, but if you do it right, once is enough.",
        author: "Mae West"
    },
    {
        quote: "siz hepiniz ben tek",
        author: "Eşref Tek"
    },
    {
        quote: "If you tell the truth, you don't have to remember anything.",
        author: "Mark Twain"
    },
    {
        quote: "A friend is someone who knows all about you and still loves you.",
        author: "Elbert Hubbard"
    },
    {
        quote: "To live is the rarest thing in the world. Most people just exist.",
        author: "Oscar Wilde"
    },
    {
        quote: "Without music, life would be a mistake.",
        author: "Friedrich Nietzsche"
    },
    {
        quote: "It is during our darkest moments that we must focus to see the light.",
        author: "Aristotle"
    },
    {
        quote: "The way to get started is to quit talking and begin doing.",
        author: "Walt Disney"
    },
    {
        quote: "Don't be pushed around by the fears in your mind. Be led by the dreams in your heart.",
        author: "Roy T. Bennett"
    },
    {
        quote: "Life is what happens to you while you're busy making other plans.",
        author: "John Lennon"
    },
    {
        quote: "The world is a book and those who do not travel read only one page.",
        author: "Saint Augustine"
    },
    {
        quote: "That which does not kill us makes us stronger.",
        author: "Friedrich Nietzsche"
    },
    {
        quote: "We are all in the gutter, but some of us are looking at the stars.",
        author: "Oscar Wilde"
    },
    {
        quote: "When you reach the end of your rope, tie a knot in it and hang on.",
        author: "Franklin D. Roosevelt"
    },
    {
        quote: "Always remember that you are absolutely unique. Just like everyone else.",
        author: "Margaret Mead"
    },
    {
        quote: "Don't judge each day by the harvest you reap but by the seeds that you plant.",
        author: "Robert Louis Stevenson"
    },
    {
        quote: "The future belongs to those who believe in the beauty of their dreams.",
        author: "Eleanor Roosevelt"
    },
    {
        quote: "It is better to be hated for what you are than to be loved for what you are not.",
        author: "André Gide"
    },
    {
        quote: "A person who never made a mistake never tried anything new.",
        author: "Albert Einstein"
    },
    {
        quote: "The only impossible journey is the one you never begin.",
        author: "Tony Robbins"
    },
    {
        quote: "In three words I can sum up everything I've learned about life: it goes on.",
        author: "Robert Frost"
    },
    {
        quote: "The cure for boredom is curiosity. There is no cure for curiosity.",
        author: "Dorothy Parker"
    }
];

// Get current date for daily rotation
function getCurrentDay() {
    const today = new Date();
    return today.getDate();
}

// Get quote for today
function getTodaysQuote() {
    const dayOfMonth = getCurrentDay();
    const quoteIndex = dayOfMonth % dailyQuotes.length;
    return dailyQuotes[quoteIndex];
}

// Update quote display
function updateQuote(quoteData) {
    const quoteElement = document.querySelector('#dailyQuote blockquote');
    const authorElement = document.querySelector('#dailyQuote cite');
    const quoteContainer = document.getElementById('dailyQuote');
    
    // Add fade out effect with scale
    quoteContainer.style.opacity = '0';
    quoteContainer.style.transform = 'translateY(20px) scale(0.95)';
    
    setTimeout(() => {
        // Update quote with decorative quotes
        const quoteText = quoteData.quote;
        quoteElement.innerHTML = `<span class="text-primary/40 text-3xl absolute -top-2 -left-1">"</span>${quoteText}<span class="text-primary/40 text-3xl absolute -bottom-4 -right-1">"</span>`;
        authorElement.innerHTML = `<span class="material-symbols-outlined text-sm text-primary">account_circle</span> — ${quoteData.author}`;
        
        // Add fade in effect with scale
        quoteContainer.style.opacity = '1';
        quoteContainer.style.transform = 'translateY(0) scale(1)';
        quoteContainer.classList.add('quote-fade-in');
        
        // Remove animation class after animation completes
        setTimeout(() => {
            quoteContainer.classList.remove('quote-fade-in');
        }, 800);
    }, 400);
}

// Refresh Quote Button
function initializeQuoteRefresh() {
    const refreshBtn = document.getElementById('refreshQuoteBtn');
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            // Get random quote instead of today's quote
            const randomIndex = Math.floor(Math.random() * dailyQuotes.length);
            const randomQuote = dailyQuotes[randomIndex];
            updateQuote(randomQuote);
            
            // Add rotation animation to button
            const icon = this.querySelector('.material-symbols-outlined');
            icon.style.transform = 'rotate(360deg)';
            setTimeout(() => {
                icon.style.transform = 'rotate(0deg)';
            }, 500);
        });
    }
}

// Animate progress circle
function animateProgressCircle() {
    const progressCircle = document.getElementById('progressCircle');
    const progressPercentage = document.getElementById('progressPercentage');
    const targetPercentage = 85;
    const circumference = 2 * Math.PI * 45; // radius = 45
    const targetOffset = circumference - (targetPercentage / 100) * circumference;
    
    // Animate the percentage counter
    let currentPercentage = 0;
    const counterInterval = setInterval(() => {
        currentPercentage += 1;
        progressPercentage.textContent = currentPercentage + '%';
        
        if (currentPercentage >= targetPercentage) {
            clearInterval(counterInterval);
        }
    }, 25);
    
    // Animate the circle
    setTimeout(() => {
        progressCircle.style.strokeDashoffset = targetOffset;
    }, 100);
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
    // For now, we'll just show a simple message
    switch(pageName) {
        case 'dashboard':
            // Already on dashboard
            break;
        case 'features':
            // Navigate to features page
            break;
        case 'community':
            // Navigate to community page
            break;
        case 'leaderboard':
            // Navigate to leaderboard page
            break;
        case 'chatbot':
            // Navigate to chatbot page
            break;
        default:
            console.log('Unknown page:', pageName);
    }
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
    const currentMode = localStorage.getItem('darkMode') || 'light';
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
        localStorage.setItem('darkMode', isDark ? 'dark' : 'light');
    });
}

// Time-based Greeting
function updateGreeting() {
    const greetingElement = document.getElementById('greetingText');
    const hour = new Date().getHours();
    let greeting = 'Welcome Back';
    
    if (hour < 12) {
        greeting = 'Good Morning';
    } else if (hour < 18) {
        greeting = 'Good Afternoon';
    } else {
        greeting = 'Good Evening';
    }
    
    greetingElement.textContent = greeting + ', Student!';
}

// Update Current Date
function updateCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    dateElement.textContent = today.toLocaleDateString('en-US', options);
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

// Notification and Profile dropdown functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeMobileMenu();
    
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    
    // Initialize dark mode
    initializeDarkMode();
    
    // Update greeting and date
    updateGreeting();
    updateCurrentDate();
    
    // Load today's quote
    const todaysQuote = getTodaysQuote();
    updateQuote(todaysQuote);
    
    // Initialize quote refresh button
    initializeQuoteRefresh();
    
    // Animate progress circle
    animateProgressCircle();
    
    // Initialize navigation
    initializeNavigation();
    
    // Only setup dropdown handlers if elements exist
    if (notificationBtn && notificationDropdown && profileBtn && profileDropdown) {
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
    }
});