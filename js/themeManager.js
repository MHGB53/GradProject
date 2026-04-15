// Global Theme Manager - Apply theme immediately on page load
// This must be loaded in the <head> before other scripts

(function() {
  // Get saved theme preference or use light as default
  const savedTheme = localStorage.getItem('theme') || 'light';
  
  // Apply theme immediately to avoid flash
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
})();

// Global theme functions that any page can use
const ThemeManager = {
  // Get current theme
  getCurrentTheme() {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  },

  // Set theme explicitly
  setTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    // Dispatch event so other pages/components know theme changed
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
  },

  // Toggle between light and dark
  toggleTheme() {
    const newTheme = this.getCurrentTheme() === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    return newTheme;
  },

  // Initialize theme toggle button
  initThemeToggle(toggleButtonSelector, iconSelector) {
    const toggleBtn = document.querySelector(toggleButtonSelector);
    const icon = document.querySelector(iconSelector);

    if (toggleBtn) {
      // Update icon with current theme
      this.updateThemeIcon(icon);

      // Add click listener
      toggleBtn.addEventListener('click', () => {
        const newTheme = this.toggleTheme();
        this.updateThemeIcon(icon);
      });

      // Listen for theme changes from other pages/components
      window.addEventListener('themeChanged', (e) => {
        this.updateThemeIcon(icon);
      });
    }
  },

  // Update icon based on current theme
  updateThemeIcon(iconElement) {
    if (iconElement) {
      const currentTheme = this.getCurrentTheme();
      iconElement.textContent = currentTheme === 'dark' ? 'light_mode' : 'dark_mode';
    }
  }
};
