// Notifications Page Functionality

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

// Notification Tabs
const notificationTabs = document.querySelectorAll('.tab-button');
const notificationList = document.getElementById('notificationList');
const markAllReadBtn = document.getElementById('markAllRead');
const dismissButtons = document.querySelectorAll('.dismiss-btn');

if (notificationTabs.length > 0) {
  notificationTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      filterNotifications(tabName);

      // Update active tab styling
      notificationTabs.forEach(t => {
        t.classList.remove('border-b-2', 'border-primary', 'text-text-primary', 'dark:text-dark-text-primary');
        t.classList.add('text-text-secondary', 'dark:text-dark-text-secondary', 'hover:text-text-primary', 'dark:hover:text-dark-text-primary');
      });
      tab.classList.remove('text-text-secondary', 'dark:text-dark-text-secondary', 'hover:text-text-primary', 'dark:hover:text-dark-text-primary');
      tab.classList.add('border-b-2', 'border-primary', 'text-text-primary', 'dark:text-dark-text-primary');
    });
  });
}

function filterNotifications(type) {
  const items = document.querySelectorAll('.notification-item');
  items.forEach(item => {
    const status = item.getAttribute('data-status');
    if (type === 'all') {
      item.style.display = 'block';
    } else if (type === 'unread' && status === 'unread') {
      item.style.display = 'block';
    } else if (type === 'read' && status === 'read') {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
}

// Mark all as read
if (markAllReadBtn) {
  markAllReadBtn.addEventListener('click', () => {
    const items = document.querySelectorAll('.notification-item');
    items.forEach(item => {
      item.setAttribute('data-status', 'read');
      const indicator = item.querySelector('.w-3.h-3');
      if (indicator) {
        indicator.classList.remove('bg-red-500');
        indicator.classList.add('bg-gray-300');
      }
    });
  });
}

// Dismiss individual notifications
if (dismissButtons.length > 0) {
  dismissButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const item = btn.closest('.notification-item');
      item.style.opacity = '0.5';
      item.style.textDecoration = 'line-through';
    });
  });
}
