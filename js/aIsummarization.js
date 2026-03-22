

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
    const currentPage = 'summarizer';
    
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

// File upload functionality
function initializeFileUpload() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const removeFile = document.getElementById('removeFile');
    const summarizeBtn = document.getElementById('summarizeBtn');
    
    let selectedFile = null;
    
    // Browse button click
    browseBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        fileInput.click();
    });
    
    // Drop zone click
    dropZone.addEventListener('click', function() {
        fileInput.click();
    });
    
    // File input change
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });
    
    // Drag and drop
    dropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('drag-over');
    });
    
    dropZone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.classList.remove('drag-over');
    });
    
    dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('drag-over');
        
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });
    
    // Handle file
    function handleFile(file) {
        selectedFile = file;
        fileName.textContent = file.name;
        fileSize.textContent = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
        fileInfo.classList.remove('hidden');
        fileInfo.classList.add('fade-in');
        summarizeBtn.disabled = false;
        
        showNotification('File uploaded successfully!', 'success');
    }
    
    // Remove file
    removeFile.addEventListener('click', function() {
        selectedFile = null;
        fileInfo.classList.add('hidden');
        fileInput.value = '';
        summarizeBtn.disabled = true;
        showNotification('File removed', 'info');
    });
}

// Summarize functionality
function initializeSummarize() {
    const summarizeBtn = document.getElementById('summarizeBtn');
    const summarizeIcon = document.getElementById('summarizeIcon');
    const summarizeText = document.getElementById('summarizeText');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressPercent = document.getElementById('progressPercent');
    const summaryContent = document.getElementById('summaryContent');
    const summaryStats = document.getElementById('summaryStats');
    
    summarizeBtn.addEventListener('click', function() {
        if (this.disabled) return;
        
        // Expand and show loading in summary section
        showSummaryLoading();
        
        // Show progress
        progressContainer.classList.remove('hidden');
        this.disabled = true;
        summarizeIcon.classList.add('loading-spinner');
        summarizeText.textContent = 'Processing...';
        
        // Scroll to summary section
        document.getElementById('summaryContent').scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Simulate progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            progressBar.style.width = progress + '%';
            progressPercent.textContent = progress + '%';
            
            if (progress >= 100) {
                clearInterval(interval);
                
                // Show summary
                setTimeout(() => {
                    progressContainer.classList.add('hidden');
                    this.disabled = false;
                    summarizeIcon.classList.remove('loading-spinner');
                    summarizeText.textContent = 'Summarize Lecture';
                    
                    // Display sample summary
                    displaySummary();
                    showNotification('Summary generated successfully!', 'success');
                }, 500);
            }
        }, 50);
    });
}

// Show loading state in summary
function showSummaryLoading() {
    const summaryContent = document.getElementById('summaryContent');
    
    summaryContent.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-center py-16 space-y-6">
            <div class="relative">
                <span class="material-symbols-outlined text-7xl text-primary loading-spinner">auto_awesome</span>
                <div class="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
            </div>
            <div class="space-y-3">
                <p class="text-xl font-bold text-text-primary dark:text-dark-text-primary">AI is analyzing your document...</p>
                <p class="text-sm text-text-secondary dark:text-dark-text-secondary">Extracting key points and generating comprehensive summary</p>
                <p class="text-xs text-text-secondary dark:text-dark-text-secondary italic">This may take a few moments for large documents</p>
            </div>
            <div class="flex gap-2">
                <span class="w-3 h-3 bg-primary rounded-full animate-pulse"></span>
                <span class="w-3 h-3 bg-primary rounded-full animate-pulse" style="animation-delay: 0.2s;"></span>
                <span class="w-3 h-3 bg-primary rounded-full animate-pulse" style="animation-delay: 0.4s;"></span>
            </div>
        </div>
    `;
    
    // Expand the summary section with animation
    summaryContent.style.minHeight = '500px';
    summaryContent.classList.add('fade-in');
}

// Display summary
function displaySummary() {
    const summaryContent = document.getElementById('summaryContent');
    const summaryStats = document.getElementById('summaryStats');
    
    summaryContent.innerHTML = `
        <div class="text-left space-y-6">
            <h4 class="text-2xl font-bold text-text-primary dark:text-dark-text-primary border-b border-border-color dark:border-dark-border-color pb-3">Summary: Comprehensive Dental Anatomy and Physiology Lecture</h4>
            
            <div class="space-y-5 text-text-primary dark:text-dark-text-primary">
                <section>
                    <h5 class="text-lg font-bold text-primary mb-2">1. Introduction to Dental Anatomy</h5>
                    <p class="text-text-secondary dark:text-dark-text-secondary leading-relaxed">This comprehensive lecture covers the fundamental aspects of dental anatomy and physiology, focusing on tooth structure, development, classification, and their clinical significance in modern dentistry. Understanding dental anatomy is essential for proper diagnosis, treatment planning, and execution of dental procedures.</p>
                </section>
                
                <section>
                    <h5 class="text-lg font-bold text-primary mb-2">2. Tooth Structure and Composition</h5>
                    <p class="text-text-secondary dark:text-dark-text-secondary leading-relaxed mb-3">Teeth are complex structures composed of multiple specialized tissues, each serving specific functions:</p>
                    <ul class="list-disc list-inside space-y-2 ml-4 text-text-secondary dark:text-dark-text-secondary">
                        <li><strong>Enamel:</strong> The hardest substance in the human body, providing protection and resistance to wear. It is composed of 96% hydroxyapatite crystals and is produced by ameloblasts during tooth development.</li>
                        <li><strong>Dentin:</strong> Forms the bulk of the tooth structure, supporting the enamel and enclosing the pulp chamber. It is a living tissue that can respond to stimuli and continues to form throughout life.</li>
                        <li><strong>Pulp:</strong> The vital center of the tooth containing nerves, blood vessels, and connective tissue. It plays crucial roles in tooth nutrition, sensation, and defense mechanisms.</li>
                        <li><strong>Cementum:</strong> Covers the root surface and facilitates tooth attachment to the periodontal ligament and alveolar bone through Sharpey's fibers.</li>
                    </ul>
                </section>
                
                <section>
                    <h5 class="text-lg font-bold text-primary mb-2">3. Dentition Types and Development</h5>
                    <p class="text-text-secondary dark:text-dark-text-secondary leading-relaxed mb-3">Human dentition undergoes two main phases:</p>
                    <ul class="list-disc list-inside space-y-2 ml-4 text-text-secondary dark:text-dark-text-secondary">
                        <li><strong>Primary Dentition:</strong> Consists of 20 teeth (10 maxillary, 10 mandibular). Eruption typically begins around 6 months and completes by age 3. These teeth serve critical functions in speech development, nutrition, and maintaining space for permanent teeth.</li>
                        <li><strong>Permanent Dentition:</strong> Comprises 32 teeth including incisors, canines, premolars, and molars. Eruption begins around age 6 with first molars and continues until wisdom teeth emerge (typically ages 17-25).</li>
                    </ul>
                </section>
                
                <section>
                    <h5 class="text-lg font-bold text-primary mb-2">4. Tooth Notation Systems</h5>
                    <p class="text-text-secondary dark:text-dark-text-secondary leading-relaxed mb-3">Three primary systems are used internationally for tooth identification:</p>
                    <ul class="list-disc list-inside space-y-2 ml-4 text-text-secondary dark:text-dark-text-secondary">
                        <li><strong>Universal System:</strong> Numbers teeth from 1-32 (permanent) or A-T (primary), commonly used in the United States.</li>
                        <li><strong>Palmer Notation:</strong> Uses quadrant symbols and numbers 1-8, providing visual representation of tooth location.</li>
                        <li><strong>FDI World Dental Federation System:</strong> Two-digit system where first digit indicates quadrant and second indicates tooth position. Widely used internationally.</li>
                    </ul>
                </section>
                
                <section>
                    <h5 class="text-lg font-bold text-primary mb-2">5. Clinical Significance</h5>
                    <p class="text-text-secondary dark:text-dark-text-secondary leading-relaxed">Comprehensive knowledge of dental anatomy is fundamental for:</p>
                    <ul class="list-disc list-inside space-y-2 ml-4 text-text-secondary dark:text-dark-text-secondary">
                        <li>Accurate diagnosis of dental pathologies and abnormalities</li>
                        <li>Effective treatment planning for restorative, endodontic, and surgical procedures</li>
                        <li>Understanding radiographic interpretation and imaging</li>
                        <li>Proper execution of local anesthesia techniques</li>
                        <li>Recognition of anatomical variations and their clinical implications</li>
                        <li>Prevention and management of complications during dental procedures</li>
                    </ul>
                </section>
                
                <section>
                    <h5 class="text-lg font-bold text-primary mb-2">6. Anatomical Variations and Considerations</h5>
                    <p class="text-text-secondary dark:text-dark-text-secondary leading-relaxed">Clinicians must be aware of common anatomical variations including accessory canals, extra cusps, root curvatures, and developmental anomalies. These variations can significantly impact treatment outcomes and require careful assessment through clinical examination and imaging.</p>
                </section>
                
                <section>
                    <h5 class="text-lg font-bold text-primary mb-2">7. Conclusion</h5>
                    <p class="text-text-secondary dark:text-dark-text-secondary leading-relaxed">Mastery of dental anatomy forms the foundation for all aspects of clinical dental practice. A thorough understanding enables practitioners to provide optimal patient care, anticipate potential complications, and achieve predictable treatment outcomes. Continuous study and application of anatomical principles are essential for professional development and clinical excellence.</p>
                </section>
            </div>
        </div>
    `;
    
    summaryStats.classList.remove('hidden');
    summaryStats.querySelector('.text-2xl:nth-of-type(1)').textContent = '487';
    summaryStats.querySelector('.text-2xl:nth-of-type(2)').textContent = '12';
    summaryStats.querySelector('.text-2xl:nth-of-type(3)').textContent = '68%';
}

// Copy functionality
function initializeCopyBtn() {
    const copyBtn = document.getElementById('copyBtn');
    
    copyBtn.addEventListener('click', function() {
        const summaryContent = document.getElementById('summaryContent');
        const text = summaryContent.innerText;
        
        navigator.clipboard.writeText(text).then(() => {
            const originalText = this.querySelector('span:last-child').textContent;
            this.querySelector('span:last-child').textContent = 'Copied!';
            showNotification('Summary copied to clipboard!', 'success');
            
            setTimeout(() => {
                this.querySelector('span:last-child').textContent = originalText;
            }, 2000);
        });
    });
}

// Download PDF functionality
function initializeDownloadPdf() {
    const downloadBtn = document.getElementById('downloadPdfBtn');
    
    downloadBtn.addEventListener('click', function() {
        const icon = this.querySelector('.material-symbols-outlined');
        const text = this.querySelector('span:last-child');
        
        icon.classList.add('loading-spinner');
        text.textContent = 'Downloading...';
        
        setTimeout(() => {
            icon.classList.remove('loading-spinner');
            text.textContent = 'Downloaded!';
            showNotification('Summary downloaded as PDF!', 'success');
            
            setTimeout(() => {
                text.textContent = 'Download PDF';
            }, 2000);
        }, 1500);
    });
}

// Translate functionality
function initializeTranslate() {
    const translateBtn = document.getElementById('translateBtn');
    let isTranslated = false;
    
    translateBtn.addEventListener('click', function() {
        const icon = this.querySelector('.material-symbols-outlined');
        const text = this.querySelector('span:last-child');
        
        icon.classList.add('loading-spinner');
        
        setTimeout(() => {
            icon.classList.remove('loading-spinner');
            
            if (isTranslated) {
                text.textContent = 'Translate to Arabic';
                showNotification('Reverted to original language', 'info');
                isTranslated = false;
            } else {
                text.textContent = 'Revert to Original';
                showNotification('Translated to Arabic!', 'success');
                isTranslated = true;
            }
        }, 1000);
    });
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
    
    // Initialize file upload
    initializeFileUpload();
    
    // Initialize summarize
    initializeSummarize();
    
    // Initialize copy button
    initializeCopyBtn();
    
    // Initialize download PDF
    initializeDownloadPdf();
    
    // Initialize translate
    initializeTranslate();
    
    // Disable summarize button initially
    document.getElementById('summarizeBtn').disabled = true;
    
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