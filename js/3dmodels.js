// 3D Models Interactive Functionality

// Dark Mode Toggle - Using Global ThemeManager
const darkModeToggle = document.getElementById('darkModeToggle');
const darkModeIcon = document.getElementById('darkModeIcon');

if (darkModeToggle) {
  // Use global ThemeManager for theme toggling
  ThemeManager.initThemeToggle('#darkModeToggle', '#darkModeIcon');
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

// 3D Model Selection
function selectModel(modelId, title, description) {
  console.log('Model selected:', {modelId, title, description});
  // Add your 3D model viewer integration here
}
