/**
 * Dentor page transition loader.
 * Self-contained: injects its own styles + overlay, so any page only needs:
 *   <script src="../js/pageloader.js"></script>
 *
 * Behaviour:
 *  - Shows the loading screen immediately while the new page is loading.
 *  - Fades it out once the page has finished loading.
 *  - Shows it again when the user navigates to another screen (link / form / JS).
 */
(function () {
  // Avoid double-injection if the script is included twice.
  if (window.__dentorLoader) return;
  window.__dentorLoader = true;

  // Resolve the assets path relative to this script's own location so it works
  // regardless of which folder the current page lives in.
  var basePath = '../';
  try {
    var thisScript = document.currentScript;
    if (thisScript && thisScript.src) {
      // .../js/pageloader.js -> .../
      basePath = thisScript.src.replace(/js\/pageloader\.js.*$/, '');
    }
  } catch (e) { /* keep default */ }

  var css = '' +
    '#dentorLoadingScreen{position:fixed;inset:0;z-index:99999;background:#fff;' +
    'display:flex;align-items:center;justify-content:center;flex-direction:column;' +
    'transition:opacity .5s cubic-bezier(.4,0,.2,1);opacity:1;}' +
    '#dentorLoadingScreen.dentor-fade-out{opacity:0;pointer-events:none;}' +
    '#dentorLoadingScreen .dentor-logo-container{position:relative;width:520px;max-width:80vw;' +
    'height:320px;display:flex;align-items:center;justify-content:center;}' +
    '#dentorLoadingScreen .dentor-logo-img{width:520px;max-width:80vw;height:auto;display:block;' +
    'position:relative;z-index:1;filter:drop-shadow(0 2px 24px rgba(102,205,170,0.10));}' +
    '#dentorLoadingScreen .dentor-green-dot{position:absolute;left:72%;top:100px;width:12px;height:12px;' +
    'background:#47ebb4;border-radius:50%;box-shadow:0 2px 8px rgba(102,205,170,0.18);z-index:2;' +
    'animation:dentorDotBounce 1.2s cubic-bezier(.7,0,.3,1) infinite;}' +
    '@keyframes dentorDotBounce{0%{top:100px}20%{top:85px}50%{top:120px}80%{top:85px}100%{top:100px}}' +
    'html.dark #dentorLoadingScreen{background:#111827;}';

  var style = document.createElement('style');
  style.id = 'dentorLoadingStyle';
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);

  function buildOverlay() {
    if (document.getElementById('dentorLoadingScreen')) return;
    var screen = document.createElement('div');
    screen.id = 'dentorLoadingScreen';
    screen.innerHTML =
      '<div class="dentor-logo-container">' +
      '<img src="' + basePath + 'assets/Loading.png" alt="Dentor" class="dentor-logo-img"/>' +
      '<div class="dentor-green-dot"></div>' +
      '</div>';
    (document.body || document.documentElement).appendChild(screen);
  }

  function showLoader() {
    var screen = document.getElementById('dentorLoadingScreen');
    if (!screen) { buildOverlay(); screen = document.getElementById('dentorLoadingScreen'); }
    if (screen) screen.classList.remove('dentor-fade-out');
  }

  function hideLoader() {
    var screen = document.getElementById('dentorLoadingScreen');
    if (!screen) return;
    screen.classList.add('dentor-fade-out');
    setTimeout(function () {
      if (screen && screen.parentNode) screen.style.display = 'none';
    }, 500);
  }

  // Inject the overlay as early as possible so the incoming page is covered.
  if (document.body) {
    buildOverlay();
  } else {
    document.addEventListener('DOMContentLoaded', buildOverlay);
  }

  // Fade out once the page has fully loaded.
  if (document.readyState === 'complete') {
    setTimeout(hideLoader, 300);
  } else {
    window.addEventListener('load', function () { setTimeout(hideLoader, 300); });
  }

  // Re-show the loader when navigating to another screen via a link.
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#') return;                 // in-page anchor
    if (a.target && a.target !== '_self') return;                // new tab/window
    if (a.hasAttribute('download')) return;
    if (/^(mailto:|tel:|javascript:)/i.test(href)) return;       // non-navigations
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    // Only show for same-origin navigations.
    try {
      var dest = new URL(href, window.location.href);
      if (dest.origin !== window.location.origin) return;
    } catch (err) { /* relative URL -> same origin, continue */ }
    showLoader();
  }, true);

  // Catch programmatic navigations / form submits that leave the page.
  window.addEventListener('beforeunload', showLoader);

  // When restored from the back/forward cache, make sure the loader is hidden.
  window.addEventListener('pageshow', function (ev) {
    if (ev.persisted) hideLoader();
  });

  // Expose for manual control if a page wants it (e.g. before a fetch redirect).
  window.dentorLoader = { show: showLoader, hide: hideLoader };
})();
