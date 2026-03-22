

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

// Initialize navigation with active states
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Set current page
    const currentPage = 'flashcards';
    
    // Add click handlers for navigation
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Don't prevent default if it's a link with href
            if (this.getAttribute('href') === '#') {
                e.preventDefault();
            }
            
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

// Initialize card form
function initializeCardForm() {
    const form = document.getElementById('cardForm');
    const frontInput = document.getElementById('front');
    const backInput = document.getElementById('back');
    const categorySelect = document.getElementById('category');
    const cardsContainer = document.getElementById('cardsContainer');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const topic = frontInput.value.trim();
        const description = backInput.value.trim();
        const category = categorySelect.value;
        
        if (!topic || !description) {
            showNotification('Please fill in both topic and description', 'error');
            return;
        }
        
        // Create new card
        const newCard = createFlashcard(topic, description, category);
        cardsContainer.insertBefore(newCard, cardsContainer.firstChild);
        
        // Clear form
        frontInput.value = '';
        backInput.value = '';
        categorySelect.selectedIndex = 0;
        
        // Update statistics
        updateStatistics();
        
        // Re-initialize flip for new card
        initializeCardFlip();
        
        // Show success message
        showNotification('Flashcard created successfully!', 'success');
    });
}

// Create flashcard element
function createFlashcard(topic, description, category) {
    const categoryColors = {
        'Anatomy': { bg: 'bg-primary/20 dark:bg-primary/30', text: 'text-primary' },
        'Pathology': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
        'Pharmacology': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
        'Radiology': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400' }
    };
    
    const colors = categoryColors[category] || categoryColors['Anatomy'];
    
    const cardDiv = document.createElement('div');
    cardDiv.className = 'flashcard aspect-[3/2] perspective-[1000px] card-flip fade-in';
    cardDiv.setAttribute('data-category', category.toLowerCase());
    cardDiv.setAttribute('data-mastered', 'false');
    
    cardDiv.innerHTML = `
        <div class="relative w-full h-full duration-500 transform-style-preserve-3d transition-transform card-inner">
            <!-- Front -->
            <div class="absolute w-full h-full bg-card dark:bg-dark-card rounded-2xl p-5 flex flex-col justify-between shadow-subtle border-2 border-border-color dark:border-dark-border-color backface-hidden hover:border-primary transition-colors">
                <div>
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-xs font-semibold px-2 py-1 rounded-full ${colors.bg} ${colors.text}">${category}</span>
                    </div>
                    <p class="font-bold text-xl text-text-primary dark:text-dark-text-primary mt-2">${topic}</p>
                </div>
                <div class="flex justify-between items-end">
                    <span class="text-xs text-text-secondary dark:text-dark-text-secondary flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs">touch_app</span>
                        Click to flip
                    </span>
                    <div class="flex gap-1">
                        <button class="p-1.5 rounded-full hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors" onclick="event.stopPropagation(); openEditModal(this.closest('.flashcard'))">
                            <span class="material-symbols-outlined text-sm text-text-secondary dark:text-dark-text-secondary">edit</span>
                        </button>
                        <button class="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors" onclick="event.stopPropagation(); openDeleteModal(this.closest('.flashcard'))">
                            <span class="material-symbols-outlined text-sm text-red-500">delete</span>
                        </button>
                    </div>
                </div>
            </div>
            <!-- Back -->
            <div class="absolute w-full h-full bg-gradient-to-br from-primary to-primary-dark text-white rounded-2xl p-6 flex flex-col shadow-subtle border-2 border-primary backface-hidden card-back">
                <div class="flex items-center justify-between mb-4">
                    <span class="text-xs font-semibold px-2 py-1 rounded-full bg-white/20">Description</span>
                    <button class="text-white/80 hover:text-white transition-colors" onclick="event.stopPropagation(); this.closest('.flashcard').classList.toggle('card-flipped')">
                        <span class="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>
                <div class="flex-1 flex items-center justify-center">
                    <p class="text-sm text-center leading-relaxed">${description}</p>
                </div>
            </div>
        </div>
    `;
    
    return cardDiv;
}

// Initialize card flip on click
function initializeCardFlip() {
    const cards = document.querySelectorAll('.card-flip');
    
    cards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Don't flip if clicking on edit or delete buttons
            if (e.target.closest('button')) {
                return;
            }
            
            // Toggle flip
            this.classList.toggle('card-flipped');
        });
    });
    
    // Keyboard shortcut - Space bar to flip focused/first visible card
    document.addEventListener('keydown', function(e) {
        if (e.code === 'Space' && !e.target.matches('input, textarea, select')) {
            e.preventDefault();
            const visibleCards = Array.from(cards).filter(card => card.style.display !== 'none');
            if (visibleCards.length > 0) {
                visibleCards[0].classList.toggle('card-flipped');
            }
        }
    });
}

// Update statistics
function updateStatistics() {
    const cards = document.querySelectorAll('.flashcard');
    const totalCards = cards.length;
    const masteredCards = Array.from(cards).filter(card => card.getAttribute('data-mastered') === 'true').length;
    const successRate = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;
    
    document.getElementById('totalCards').textContent = totalCards;
    document.getElementById('masteredCards').textContent = masteredCards;
    document.getElementById('successRate').textContent = successRate + '%';
}

// Open delete modal
let cardToDelete = null;

function openDeleteModal(cardElement) {
    cardToDelete = cardElement;
    const modal = document.getElementById('deleteModal');
    modal.classList.remove('hidden');
}

// Close delete modal
function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    modal.classList.add('hidden');
    cardToDelete = null;
}

// Confirm delete
function confirmDelete() {
    if (cardToDelete) {
        cardToDelete.remove();
        updateStatistics();
        showNotification('Card deleted successfully', 'info');
        closeDeleteModal();
    }
}

// Open edit modal
function openEditModal(cardElement) {
    const modal = document.getElementById('editModal');
    const category = cardElement.getAttribute('data-category');
    const topicElement = cardElement.querySelector('.font-bold.text-xl');
    const descriptionElement = cardElement.querySelector('.card-back .text-sm.text-center');
    
    // Get current values
    const topic = topicElement.textContent;
    const description = descriptionElement.textContent;
    
    // Fill form
    document.getElementById('editTopic').value = topic;
    document.getElementById('editDescription').value = description;
    document.getElementById('editCategory').value = category.charAt(0).toUpperCase() + category.slice(1);
    
    // Store reference to card element
    modal.dataset.cardElement = Array.from(document.querySelectorAll('.flashcard')).indexOf(cardElement);
    
    // Show modal
    modal.classList.remove('hidden');
}

// Close edit modal
function closeEditModal() {
    const modal = document.getElementById('editModal');
    modal.classList.add('hidden');
}

// Initialize edit card form
function initializeEditCardForm() {
    const form = document.getElementById('editCardForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const topic = document.getElementById('editTopic').value.trim();
        const description = document.getElementById('editDescription').value.trim();
        const category = document.getElementById('editCategory').value;
        
        if (!topic || !description) {
            showNotification('Please fill in both topic and description', 'error');
            return;
        }
        
        // Get card element
        const modal = document.getElementById('editModal');
        const cardIndex = parseInt(modal.dataset.cardElement);
        const cardElement = document.querySelectorAll('.flashcard')[cardIndex];
        
        // Update category
        const categoryLower = category.toLowerCase();
        cardElement.setAttribute('data-category', categoryLower);
        
        // Update topic
        const topicElement = cardElement.querySelector('.font-bold.text-xl');
        topicElement.textContent = topic;
        
        // Update description
        const descriptionElement = cardElement.querySelector('.card-back .text-sm.text-center');
        descriptionElement.textContent = description;
        
        // Update category badge
        const categoryBadge = cardElement.querySelector('.text-xs.font-semibold.px-2');
        categoryBadge.textContent = category;
        
        // Update category colors
        const categoryColors = {
            'Anatomy': { bg: 'bg-primary/20 dark:bg-primary/30', text: 'text-primary' },
            'Pathology': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
            'Pharmacology': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
            'Radiology': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400' }
        };
        
        const colors = categoryColors[category] || categoryColors['Anatomy'];
        categoryBadge.className = `text-xs font-semibold px-2 py-1 rounded-full ${colors.bg} ${colors.text}`;
        
        // Close modal
        closeEditModal();
        
        // Show success message
        showNotification('Card updated successfully!', 'success');
    });
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const editModal = document.getElementById('editModal');
    const deleteModal = document.getElementById('deleteModal');
    
    if (e.target === editModal) {
        closeEditModal();
    }
    if (e.target === deleteModal) {
        closeDeleteModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeEditModal();
        closeDeleteModal();
    }
});
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
    
    notification.style.transform = 'translateX(400px)';
    document.body.appendChild(notification);
    
    // Animate in
    requestAnimationFrame(() => {
        notification.style.transform = 'translateX(0)';
    });
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
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
    
    // Initialize card form
    initializeCardForm();
    
    // Initialize edit card form
    initializeEditCardForm();
    
    // Initialize card flip
    initializeCardFlip();
    
    // Update statistics on page load
    updateStatistics();
    
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