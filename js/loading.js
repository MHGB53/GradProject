window.addEventListener('load', function() {
      setTimeout(function() {
        const loadingScreen = document.getElementById('loadingScreen');
        const homepage = document.getElementById('homepage');
        loadingScreen.classList.add('fade-out');
        setTimeout(function() {
          loadingScreen.style.display = 'none';
          homepage.classList.add('visible');
        }, 700);
      }, 1800);
    });