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
  // 1. Update text labels inside the viewer panel
  const nameEl = document.getElementById('modelName');
  const descEl = document.getElementById('modelDescription');
  if (nameEl) nameEl.textContent = title;
  if (descEl) descEl.textContent = description;

  // 2. Update the header description line in the Model Viewer card
  const viewerDesc = document.getElementById('viewerDescription');
  if (viewerDesc) viewerDesc.textContent = 'Interactive 3D visualization of ' + title.toLowerCase();

  // 3. Swap the <model-viewer> src to load the selected .glb file
  const viewer = document.getElementById('dentalModelViewer');
  if (viewer) {
    viewer.src = '../assets/models/' + modelId + '.glb';
  }

  // 4. Smooth-scroll down to the viewer section
  const viewerSection = document.getElementById('modelViewer');
  if (viewerSection) {
    viewerSection.scrollIntoView({ behavior: 'smooth' });

    // 5. Pulse a green ring around the viewer as visual feedback
    viewerSection.classList.add('ring-2', 'ring-primary', 'rounded-2xl');
    setTimeout(() => {
      viewerSection.classList.remove('ring-2', 'ring-primary');
    }, 2000);
  }
}
