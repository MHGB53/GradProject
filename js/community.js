

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

// Dark Mode Toggle - Copied from working dashboard.js
function initializeDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const darkModeIcon = document.getElementById('darkModeIcon');
    const logoImage = document.getElementById('logoImage');
    const htmlElement = document.documentElement;
    
    // Return early if elements don't exist
    if (!darkModeToggle || !darkModeIcon || !logoImage) {
        console.warn('Dark mode elements not found');
        return;
    }
    
    // Logo paths
    const lightLogo = '../assets/Logo.png';
    const darkLogo = '../assets/Logo0.png';
    
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
    const currentPage = 'community';
    
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
    
    // Only set up notification/profile handlers if elements exist
    if (notificationBtn && notificationDropdown) {
        // Toggle notification dropdown
        notificationBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            notificationDropdown.classList.toggle('hidden');
            if (profileDropdown) {
                profileDropdown.classList.add('hidden'); // Close profile dropdown
            }
        });
    }
    
    if (profileBtn && profileDropdown) {
        // Toggle profile dropdown
        profileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            profileDropdown.classList.toggle('hidden');
            if (notificationDropdown) {
                notificationDropdown.classList.add('hidden'); // Close notification dropdown
            }
        });
    }
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (notificationBtn && notificationDropdown) {
            if (!notificationBtn.contains(e.target) && !notificationDropdown.contains(e.target)) {
                notificationDropdown.classList.add('hidden');
            }
        }
        if (profileBtn && profileDropdown) {
            if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.classList.add('hidden');
            }
        }
    });
    
    // Close dropdowns when pressing Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (notificationDropdown) {
                notificationDropdown.classList.add('hidden');
            }
            if (profileDropdown) {
                profileDropdown.classList.add('hidden');
            }
        }
    });
    
    // ===== FILE UPLOAD FUNCTIONALITY =====
    let uploadedFiles = [];
    
    function updateFilePreview() {
      const filePreview = document.getElementById('filePreview');
      const fileList = document.getElementById('fileList');
      
      if (uploadedFiles.length > 0) {
        filePreview.classList.remove('hidden');
        fileList.innerHTML = uploadedFiles.map((file, index) => {
          let icon = 'insert_drive_file';
          let color = 'text-gray-500';
          
          if (file.type.startsWith('image/')) {
            icon = 'image';
            color = 'text-green-500';
          } else if (file.type.startsWith('video/')) {
            icon = 'videocam';
            color = 'text-blue-500';
          } else if (file.type === 'application/pdf') {
            icon = 'picture_as_pdf';
            color = 'text-red-500';
          } else if (file.type.includes('word') || file.type.includes('document')) {
            icon = 'description';
            color = 'text-blue-600';
          }
          
          return `
            <div class="flex items-center justify-between p-2 rounded-lg bg-card dark:bg-dark-card">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-sm ${color}">${icon}</span>
                <span class="text-xs text-text-primary dark:text-dark-text-primary font-medium">${file.name}</span>
                <span class="text-xs text-text-secondary dark:text-dark-text-secondary">(${(file.size / 1024).toFixed(1)} KB)</span>
              </div>
              <button type="button" onclick="removeFile(${index})" class="text-red-500 hover:text-red-700">
                <span class="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          `;
        }).join('');
        } else {
        filePreview.classList.add('hidden');
      }
    }
    
    function removeFile(index) {
      uploadedFiles.splice(index, 1);
      updateFilePreview();
    }
    
    function handleFileUpload(input) {
      if (input.files.length > 0) {
        Array.from(input.files).forEach(file => {
          uploadedFiles.push(file);
        });
        updateFilePreview();
        input.value = ''; // Reset input
      }
    }
    
    // Attach event listeners
    const photoUpload = document.getElementById('photo-upload');
    const videoUpload = document.getElementById('video-upload');
    const pdfUpload = document.getElementById('pdf-upload');
    const docUpload = document.getElementById('doc-upload');
    const clearFilesBtn = document.getElementById('clearFiles');
    
    if (photoUpload) {
      photoUpload.addEventListener('change', function() {
        handleFileUpload(this);
      });
    }
    
    if (videoUpload) {
      videoUpload.addEventListener('change', function() {
        handleFileUpload(this);
      });
    }
    
    if (pdfUpload) {
      pdfUpload.addEventListener('change', function() {
        handleFileUpload(this);
      });
    }
    
    if (docUpload) {
      docUpload.addEventListener('change', function() {
        handleFileUpload(this);
      });
    }
    
    if (clearFilesBtn) {
      clearFilesBtn.addEventListener('click', function() {
        uploadedFiles = [];
        updateFilePreview();
      });
    }
});

// Toggle Like
function toggleLike(button) {
      const likeCount = button.querySelector('.like-count');
      const currentCount = parseInt(likeCount.textContent);
      const icon = button.querySelector('.material-symbols-outlined');
      
      if (button.classList.contains('liked')) {
        button.classList.remove('liked', 'text-primary');
        likeCount.textContent = currentCount - 1;
        icon.style.fontVariationSettings = "'FILL' 0";
      } else {
        button.classList.add('liked', 'text-primary');
        likeCount.textContent = currentCount + 1;
        icon.style.fontVariationSettings = "'FILL' 1";
      }
    }
    
    // Toggle Comment Like
    function toggleCommentLike(button) {
      const likeCount = button.querySelector('.like-count');
      const currentCount = parseInt(likeCount.textContent);
      const icon = button.querySelector('.material-symbols-outlined');
      
      if (button.classList.contains('liked')) {
        button.classList.remove('liked', 'text-primary');
        likeCount.textContent = currentCount - 1;
        icon.style.fontVariationSettings = "'FILL' 0";
        } else {
        button.classList.add('liked', 'text-primary');
        likeCount.textContent = currentCount + 1;
        icon.style.fontVariationSettings = "'FILL' 1";
      }
    }
    
    // Toggle Reply Input
    function toggleReply(commentId) {
      const replySection = document.getElementById('reply-' + commentId);
      replySection.classList.toggle('hidden');
      if (!replySection.classList.contains('hidden')) {
        replySection.querySelector('input').focus();
      }
    }
    
    // Sample likes data
    const likesData = {
      post1: [
        { name: 'Dr. John Smith', image: 'https://randomuser.me/api/portraits/men/1.jpg', role: 'Periodontist', id: 'U-DENT-10245', level: 'Level 5 - Expert' },
        { name: 'Dr. Lisa Wong', image: 'https://randomuser.me/api/portraits/women/2.jpg', role: 'Orthodontist', id: 'U-DENT-10892', level: 'Level 4 - Advanced' },
        { name: 'Dr. Mike Taylor', image: 'https://randomuser.me/api/portraits/men/3.jpg', role: 'Endodontist', id: 'U-DENT-11456', level: 'Level 6 - Master' },
        { name: 'Dr. Anna Brown', image: 'https://randomuser.me/api/portraits/women/4.jpg', role: 'Prosthodontist', id: 'U-DENT-10673', level: 'Level 3 - Intermediate' },
        { name: 'Dr. Tom Harris', image: 'https://randomuser.me/api/portraits/men/6.jpg', role: 'Oral Surgeon', id: 'U-DENT-12098', level: 'Level 7 - Legend' }
      ],
      post2: [
        { name: 'Dr. Amanda Green', image: 'https://randomuser.me/api/portraits/women/10.jpg', role: 'Pediatric Dentist', id: 'U-DENT-10334', level: 'Level 4 - Advanced' },
        { name: 'Dr. Robert Chen', image: 'https://randomuser.me/api/portraits/men/12.jpg', role: 'General Dentist', id: 'U-DENT-11789', level: 'Level 3 - Intermediate' },
        { name: 'Dr. Sarah Kim', image: 'https://randomuser.me/api/portraits/women/14.jpg', role: 'Cosmetic Dentist', id: 'U-DENT-10556', level: 'Level 5 - Expert' }
      ],
      post3: [
        { name: 'Dr. Maria Garcia', image: 'https://randomuser.me/api/portraits/women/15.jpg', role: 'Orthodontist', id: 'U-DENT-11234', level: 'Level 6 - Master' },
        { name: 'Dr. James Wilson', image: 'https://randomuser.me/api/portraits/men/20.jpg', role: 'Periodontist', id: 'U-DENT-10987', level: 'Level 4 - Advanced' },
        { name: 'Dr. Patricia Lee', image: 'https://randomuser.me/api/portraits/women/25.jpg', role: 'Endodontist', id: 'U-DENT-12456', level: 'Level 5 - Expert' }
      ]
    };
    
    // Sample comments data with full user info
    const commentsData = {
      post1: [
        {
          user: 'Dr. Mark Anderson',
          image: 'https://randomuser.me/api/portraits/men/5.jpg',
          text: 'Have you considered a combination of scaling, root planing, and possibly surgical intervention?',
          likes: 3,
          time: '1 hour ago',
          id: 'U-DENT-10567',
          level: 'Level 6 - Master'
        },
        {
          user: 'Dr. Jennifer Lee',
          image: 'https://randomuser.me/api/portraits/women/8.jpg',
          text: "Great case! I'd also recommend involving a periodontist for comprehensive treatment planning.",
          likes: 5,
          time: '30 min ago',
          id: 'U-DENT-11890',
          level: 'Level 5 - Expert'
        }
      ],
      post2: [],
      post3: []
    };
    
    // Open Likes Modal
    function openLikesModal(postId) {
      const modal = document.getElementById('likesModal');
      const content = document.getElementById('likesModalContent');
      const likes = likesData[postId] || [];
      
      content.innerHTML = likes.map((user, index) => `
        <div onclick="showUserInfo('${postId}', ${index})" class="flex items-center gap-3 p-3 rounded-xl hover:bg-background dark:hover:bg-dark-background transition-colors cursor-pointer group">
          <img src="${user.image}" class="w-10 h-10 rounded-full" />
          <span class="text-sm text-text-primary dark:text-dark-text-primary font-medium group-hover:text-primary transition-colors">${user.name}</span>
          <span class="material-symbols-outlined text-text-secondary dark:text-dark-text-secondary ml-auto opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
        </div>
      `).join('');
      
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
    
    // Close Likes Modal
    function closeLikesModal() {
      document.getElementById('likesModal').classList.add('hidden');
      document.body.style.overflow = 'auto';
    }
    
    // Show User Info
    function showUserInfo(postId, userIndex) {
      const user = likesData[postId][userIndex];
      const modal = document.getElementById('userInfoModal');
      
      // Update user info
      document.getElementById('userInfoAvatar').src = user.image;
      document.getElementById('userInfoName').textContent = user.name;
      document.getElementById('userInfoId').textContent = user.id;
      document.getElementById('userInfoLevel').textContent = user.level;
      
      // Show modal with animation
      modal.classList.remove('hidden');
      setTimeout(() => {
        modal.querySelector('div').classList.remove('scale-95');
        modal.querySelector('div').classList.add('scale-100');
      }, 10);
    }
    
    // Close User Info Modal
    function closeUserInfoModal() {
      const modal = document.getElementById('userInfoModal');
      modal.querySelector('div').classList.remove('scale-100');
      modal.querySelector('div').classList.add('scale-95');
      setTimeout(() => {
        modal.classList.add('hidden');
      }, 200);
    }
    
    // Show Comment User Info
    function showCommentUserInfo(postId, commentIndex) {
      const comment = commentsData[postId][commentIndex];
      const modal = document.getElementById('userInfoModal');
      
      // Update user info from comment data
      document.getElementById('userInfoAvatar').src = comment.image;
      document.getElementById('userInfoName').textContent = comment.user;
      document.getElementById('userInfoId').textContent = comment.id;
      document.getElementById('userInfoLevel').textContent = comment.level;
      
      // Show modal with animation
      modal.classList.remove('hidden');
      setTimeout(() => {
        modal.querySelector('div').classList.remove('scale-95');
        modal.querySelector('div').classList.add('scale-100');
      }, 10);
    }
    
    // Post authors data
    const postAuthors = {
      author1: {
        name: 'Dr. Emily Carter',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCkPQ_esLk8kw4T6Y2ZjTYEWqtcEgQAt3D1T3jKt-tAcx5Dv7J2PEPg3Kb2FB4yuFx05KhIfs5RGhVtm5LHIFOt5Qyw5eDM2DgY06kBMwcv0oIAL6sxfR60xTEoakWpq87vqHRypgT3K4TRL1gTferezy8VCl-WvvWLOK4faHJFsJRFZ34Uwz9UCMWCaytntQP7U6-nd2nzd7sIPCDrip2tK-s6QkzVsMPPUPSFhTRhr9THNj0O2Y5nTJZIWk9t_2IMFMZcyxkf8k6f',
        id: 'U-DENT-11234',
        level: 'Level 6 - Master'
      },
      author2: {
        name: 'Dr. David Lee',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDoFloEAtTb7T_2Hmz9mEPmk2LD1wpliFrMM9gpYkRKj2WT3VPbujXprjG_i1lJSksdPDsT0XrpQ4BlDvPz--cZvKgYmOI7x70bNLVgT3rMWTusKRxs_Nnj4NGdP4gnNxrIDZjiNTFYrkUo_a-3x26-EMAPYvebm90CrQTfa4HQ5XCUWXZEOfHahjwc9m4TQunRMRyhh9qqiOEKQs2L6YaPT7XgFq_soPGtHH_gMR5Qj4kfHKch8w6eRR0aEAh4MDjhZXzdjn5FxSaa',
        id: 'U-DENT-10789',
        level: 'Level 5 - Expert'
      },
      author3: {
        name: 'Dr. Sarah Johnson',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAAkX5kcQBHWhpFxl7ctja81v5w4jOA_CYAs7l51fMOGheVVhHvnYZ_7oQ-py3qvT8buAD7oxB74qLikSeOIZ8s5a3sv_Etq3QTIJtzT6SejT4odh53XshWkdSYWBBQTPcnkxAAjAFFn7kG9cmcNfeXxSBVGIlpLNbaSXCZSKNpmexRo_Ez_qVLdaL7gbibPFp7nmEi12rYkP7EVFpjjhtamPPlU8b3LMdVI9AxJUvhBZd7WgVL1v8twA6tMLfRr0R6GP3tXFDCJa9J',
        id: 'U-DENT-12456',
        level: 'Level 7 - Legend'
      }
    };
    
    // Show Post Author Info
    function showPostAuthorInfo(authorId) {
      const author = postAuthors[authorId];
      const modal = document.getElementById('userInfoModal');
      
      // Update user info
      document.getElementById('userInfoAvatar').src = author.image;
      document.getElementById('userInfoName').textContent = author.name;
      document.getElementById('userInfoId').textContent = author.id;
      document.getElementById('userInfoLevel').textContent = author.level;
      
      // Show modal with animation
      modal.classList.remove('hidden');
      setTimeout(() => {
        modal.querySelector('div').classList.remove('scale-95');
        modal.querySelector('div').classList.add('scale-100');
      }, 10);
    }
    
    // Open Comments Modal
    let currentPostId = null;
    
    function openCommentsModal(postId, count) {
      currentPostId = postId;
      const modal = document.getElementById('commentsModal');
      const content = document.getElementById('commentsModalContent');
      const countSpan = document.getElementById('commentsCount');
      const comments = commentsData[postId] || [];
      
      countSpan.textContent = `(${count})`;
      
      content.innerHTML = comments.map((comment, index) => `
        <div class="mb-4">
          <div class="flex gap-3">
            <img src="${comment.image}" onclick="showCommentUserInfo('${postId}', ${index})" class="w-8 h-8 rounded-full flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary transition-all" />
            <div class="flex-1">
              <div class="bg-background dark:bg-dark-background rounded-xl p-3">
                <p onclick="showCommentUserInfo('${postId}', ${index})" class="text-xs font-semibold text-text-primary dark:text-dark-text-primary mb-1 cursor-pointer hover:text-primary transition-colors">${comment.user}</p>
                <p class="text-xs text-text-secondary dark:text-dark-text-secondary">${comment.text}</p>
              </div>
              <div class="flex items-center gap-4 mt-2 ml-3">
                <button onclick="toggleCommentLike(this)" class="text-xs text-text-secondary dark:text-dark-text-secondary hover:text-primary transition-colors flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm">thumb_up</span>
                  <span class="like-count">${comment.likes}</span>
                </button>
                <button onclick="toggleReply('modal-comment-${index}')" class="text-xs text-text-secondary dark:text-dark-text-secondary hover:text-primary transition-colors">Reply</button>
                <span class="text-xs text-text-secondary dark:text-dark-text-secondary">${comment.time}</span>
              </div>
              
              <!-- Reply Input -->
              <div id="reply-modal-comment-${index}" class="hidden mt-3 flex items-center gap-2">
                <input class="flex-1 border-none focus:ring-0 text-xs bg-card dark:bg-dark-card text-text-primary dark:text-dark-text-primary rounded-full px-3 py-2 placeholder:text-text-secondary dark:placeholder:text-dark-text-secondary border border-border-color dark:border-dark-border-color" placeholder="Write a reply..." />
                <button type="button" class="flex items-center justify-center rounded-full bg-primary text-white w-7 h-7 hover:bg-primary-dark transition-colors">
                  <span class="material-symbols-outlined text-sm">send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      `).join('') || '<p class="text-center text-text-secondary dark:text-dark-text-secondary text-sm py-8">No comments yet. Be the first to comment!</p>';
      
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
    
    // Close Comments Modal
    function closeCommentsModal() {
      document.getElementById('commentsModal').classList.add('hidden');
      document.body.style.overflow = 'auto';
      currentPostId = null;
    }
    
    // Add Comment
    function addComment() {
      const input = document.getElementById('newCommentInput');
      const text = input.value.trim();
      
      if (text && currentPostId) {
        const newComment = {
          user: 'John Doe',
          image: 'https://randomuser.me/api/portraits/men/32.jpg',
          text: text,
          likes: 0,
          time: 'Just now'
        };
        
        commentsData[currentPostId] = commentsData[currentPostId] || [];
        commentsData[currentPostId].push(newComment);
        
        input.value = '';
        
        // Refresh modal
        const count = commentsData[currentPostId].length;
        openCommentsModal(currentPostId, count);
      }
    }
    
    // Close modals on background click
    document.getElementById('likesModal').addEventListener('click', function(e) {
      if (e.target === this) {
        closeLikesModal();
      }
    });
    
    document.getElementById('commentsModal').addEventListener('click', function(e) {
      if (e.target === this) {
        closeCommentsModal();
      }
    });
    
    // Close modals on background click
    document.getElementById('userInfoModal').addEventListener('click', function(e) {
      if (e.target === this) {
        closeUserInfoModal();
      }
    });
    
    // Close modals on Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeLikesModal();
        closeCommentsModal();
        closeUserInfoModal();
      }
    });

    // Auto-resize textarea with animation
    const composerTextarea = document.getElementById('composer-textarea');
    if (composerTextarea) {
      const minHeight = '2.5rem';
      composerTextarea.addEventListener('input', function() {
        this.style.height = minHeight; // Always reset to min height first
        if (this.value.trim() === '') {
          this.style.height = minHeight;
        } else {
          this.style.height = (this.scrollHeight) + 'px';
        }
      });
      // Optional: Animate on page load if there's pre-filled text
      window.addEventListener('DOMContentLoaded', function() {
        composerTextarea.style.height = minHeight;
        if (composerTextarea.value.trim() !== '') {
          composerTextarea.style.height = (composerTextarea.scrollHeight) + 'px';
        }
      });
    }