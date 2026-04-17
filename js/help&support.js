// Help & Support Page Functionality

// Dark Mode Toggle
const darkModeToggle = document.getElementById('darkModeToggle');
const darkModeIcon = document.getElementById('darkModeIcon');

if (darkModeToggle) {
  darkModeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    darkModeIcon.textContent = isDark ? 'dark_mode' : 'light_mode';
  });

  // Set initial icon based on saved preference
  const currentMode = localStorage.getItem('theme') || 'light';
  darkModeIcon.textContent = currentMode === 'dark' ? 'dark_mode' : 'light_mode';
}

// Notification Button
const notificationBtn = document.getElementById('notificationBtn');
const notificationDropdown = document.getElementById('notificationDropdown');

if (notificationBtn && notificationDropdown) {
  notificationBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    notificationDropdown.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    notificationDropdown.classList.add('hidden');
  });
}

// Profile Button
const profileBtn = document.getElementById('profileBtn');
const profileDropdown = document.getElementById('profileDropdown');

if (profileBtn && profileDropdown) {
  profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    profileDropdown.classList.add('hidden');
  });
}

// Mobile Menu
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileSidebar = document.getElementById('mobileSidebar');
const mobileSidebarPanel = document.getElementById('mobileSidebarPanel');
const closeMobileMenu = document.getElementById('closeMobileMenu');

if (mobileMenuBtn && mobileSidebar) {
  mobileMenuBtn.addEventListener('click', () => {
    mobileSidebar.classList.remove('hidden');
    setTimeout(() => {
      mobileSidebarPanel.classList.remove('-translate-x-full');
    }, 10);
  });

  if (closeMobileMenu) {
    closeMobileMenu.addEventListener('click', () => {
      mobileSidebarPanel.classList.add('-translate-x-full');
      setTimeout(() => {
        mobileSidebar.classList.add('hidden');
      }, 300);
    });
  }

  mobileSidebar.addEventListener('click', (e) => {
    if (e.target === mobileSidebar) {
      mobileSidebarPanel.classList.add('-translate-x-full');
      setTimeout(() => {
        mobileSidebar.classList.add('hidden');
      }, 300);
    }
  });
}

// Support Form Submission
const supportForm = document.getElementById('supportForm');
const messageContainer = document.getElementById('messageContainer');

if (supportForm && messageContainer) {
  supportForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const complaintType = document.getElementById('complaintType').value;
    const subject = document.getElementById('subject').value;
    const description = document.getElementById('description').value;
    const email = document.getElementById('email').value;
    const urgent = document.getElementById('urgent').checked;

    if (!complaintType || !subject || !description || !email) {
      showMessage('Please fill in all required fields', 'error');
      return;
    }

    // Show success message
    showMessage('Thank you for your complaint! We will get back to you soon.', 'success');
    
    // Reset form
    supportForm.reset();

    // Log form data (in production, this would be sent to a server)
    console.log({
      complaintType,
      subject,
      description,
      email,
      urgent,
      timestamp: new Date().toISOString()
    });
  });

  function showMessage(message, type) {
    messageContainer.className = `p-4 rounded-lg ${type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`;
    messageContainer.textContent = message;
    messageContainer.classList.remove('hidden');
    
    setTimeout(() => {
      messageContainer.classList.add('hidden');
    }, 5000);
  }
}
