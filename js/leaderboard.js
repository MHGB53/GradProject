/* =========================================================
   leaderboard.js  –  Dentor Leaderboard
   Connects leaderboard.html → /api/leaderboard/* endpoints
   ========================================================= */

const LB_API = 'http://localhost:8000/api/leaderboard';

function getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// ─────────────────────────────────────────────────────────────
//  Dark Mode
// ─────────────────────────────────────────────────────────────
function initializeDarkMode() {
    const toggle   = document.getElementById('darkModeToggle');
    const icon     = document.getElementById('darkModeIcon');
    const logoImg  = document.getElementById('logoImage');
    const lightLogo = '../assets/Logo.png';
    const darkLogo  = '../assets/Logo0.png';

    const current = localStorage.getItem('theme') || 'light';
    if (current === 'dark') {
        document.documentElement.classList.add('dark');
        if (icon)    icon.textContent = 'dark_mode';
        if (logoImg) logoImg.src = darkLogo;
    }

    toggle?.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        if (icon)    icon.textContent = isDark ? 'dark_mode' : 'light_mode';
        if (logoImg) {
            logoImg.style.opacity = '0';
            setTimeout(() => { logoImg.src = isDark ? darkLogo : lightLogo; logoImg.style.opacity = '1'; }, 150);
        }
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}

// ─────────────────────────────────────────────────────────────
//  Mobile Menu
// ─────────────────────────────────────────────────────────────
function initializeMobileMenu() {
    const btn   = document.getElementById('mobileMenuBtn');
    const sb    = document.getElementById('mobileSidebar');
    const panel = document.getElementById('mobileSidebarPanel');
    const close = document.getElementById('closeMobileMenu');
    const closeSb = () => { panel.classList.add('-translate-x-full'); setTimeout(() => sb.classList.add('hidden'), 300); };
    btn?.addEventListener('click', () => { sb.classList.remove('hidden'); setTimeout(() => panel.classList.remove('-translate-x-full'), 10); });
    close?.addEventListener('click', closeSb);
    sb?.addEventListener('click', e => { if (e.target === sb) closeSb(); });
}

// ─────────────────────────────────────────────────────────────
//  Dropdowns
// ─────────────────────────────────────────────────────────────
function initializeDropdowns() {
    const notifBtn  = document.getElementById('notificationBtn');
    const notifDrop = document.getElementById('notificationDropdown');
    const profBtn   = document.getElementById('profileBtn');
    const profDrop  = document.getElementById('profileDropdown');
    notifBtn?.addEventListener('click', e => { e.stopPropagation(); notifDrop.classList.toggle('hidden'); profDrop.classList.add('hidden'); });
    profBtn?.addEventListener('click',  e => { e.stopPropagation(); profDrop.classList.toggle('hidden');  notifDrop.classList.add('hidden'); });
    document.addEventListener('click', () => { notifDrop?.classList.add('hidden'); profDrop?.classList.add('hidden'); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { notifDrop?.classList.add('hidden'); profDrop?.classList.add('hidden'); closeUserInfo(); } });
}

// ─────────────────────────────────────────────────────────────
//  Rank badge HTML
// ─────────────────────────────────────────────────────────────
function rankBadge(rank) {
    if (rank === 1) return `<div class="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-500 text-white font-bold shadow-md"><span class="material-symbols-outlined">emoji_events</span></div>`;
    if (rank === 2) return `<div class="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-gray-300 to-gray-400 text-white font-bold shadow-md"><span class="material-symbols-outlined">workspace_premium</span></div>`;
    if (rank === 3) return `<div class="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 text-white font-bold shadow-md"><span class="material-symbols-outlined">workspace_premium</span></div>`;
    return `<div class="flex items-center justify-center w-10 h-10 rounded-xl bg-card dark:bg-dark-card border-2 border-border-color dark:border-dark-border-color font-bold text-text-primary dark:text-dark-text-primary">${rank}</div>`;
}

function barColor(rank) {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-500';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400';
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-500';
    return 'bg-primary';
}

function levelFromPoints(pts) {
    if (pts >= 500) return 'Expert';
    if (pts >= 300) return 'Advanced';
    if (pts >= 150) return 'Intermediate';
    if (pts >= 50)  return 'Beginner';
    return 'Newcomer';
}

// ─────────────────────────────────────────────────────────────
//  Avatar helper
//  Returns an HTML string for a circular avatar:
//   - <img> if photoUrl is a non-empty string
//   - Coloured initials circle otherwise
// ─────────────────────────────────────────────────────────────
function avatarHtml(photoUrl, displayName, sizeClass = 'w-24 h-24', textClass = 'text-2xl') {
    const BASE = 'http://localhost:8000';
    // Build an absolute URL for relative paths coming from the backend
    let src = '';
    if (photoUrl) {
        src = photoUrl.startsWith('http') ? photoUrl : BASE + photoUrl;
    }

    if (src) {
        return `<img src="${src}" alt="${displayName}" class="w-full h-full object-cover"
                    onerror="this.outerHTML=window._initialsAvatar('${displayName}','${textClass}')">`;
    }
    return _initialsAvatar(displayName, textClass);
}

// Exposed on window so the onerror fallback can call it
window._initialsAvatar = function(name, textClass = 'text-2xl') {
    const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const palette  = ['#5bcba7','#6366f1','#f59e0b','#ec4899','#3b82f6','#10b981','#8b5cf6'];
    const color    = palette[(name || '').charCodeAt(0) % palette.length];
    return `<div class="w-full h-full flex items-center justify-center ${textClass} font-bold text-white" style="background:${color}">${initials}</div>`;
};


// ─────────────────────────────────────────────────────────────
//  Render podium (top 3)
// ─────────────────────────────────────────────────────────────
function renderPodium(users) {
    const podium = document.getElementById('podiumSection');
    if (!podium) return;

    const top3   = users.slice(0, 3);
    // pad to 3 with empty slots
    while (top3.length < 3) top3.push(null);

    const [first, second, third] = [top3[0], top3[1], top3[2]];

    const medal = (u, place, extraMt, gradient, borderColor, textColor, numSize, badgeIcon) => {
        if (!u) return `<div class="flex flex-col items-center opacity-30"><div class="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 mb-4 flex items-center justify-center"><span class="material-symbols-outlined text-3xl text-gray-400">person</span></div><p class="text-sm text-text-secondary dark:text-dark-text-secondary">No one yet</p></div>`;
        const youBadge = u.is_me ? `<div class="absolute top-3 right-3 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">You</div>` : '';
        return `
        <div class="${gradient} rounded-2xl p-6 w-full text-center shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border-4 ${borderColor} relative overflow-hidden cursor-pointer"
             onclick="showUserInfo(${u.user_id}, ${JSON.stringify(u).replace(/"/g, '&quot;')})">
          <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-white/30 via-white/60 to-white/30"></div>
          ${youBadge}
          <div class="relative">
            <div class="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white shadow-xl bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
              ${avatarHtml(u.profile_photo, u.display_name, 'w-24 h-24', 'text-3xl')}
            </div>
            <div class="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full w-12 h-12 flex items-center justify-center border-4 border-white shadow-lg bg-white/30">
              <span class="material-symbols-outlined text-white text-2xl">${badgeIcon}</span>
            </div>
          </div>
          <div class="rounded-xl py-2 px-3 mb-3 bg-white/20">
            <span class="font-extrabold ${textColor} ${numSize}">${place}</span>
          </div>
          <h4 class="font-bold text-lg ${textColor} mb-1 truncate">${u.display_name}</h4>
          <div class="flex items-center justify-center gap-2 mt-3">
            <span class="material-symbols-outlined text-yellow-300 text-xl">stars</span>
            <p class="text-2xl font-bold ${textColor}">${u.total_points}</p>
            <span class="text-xs ${textColor} opacity-80">pts</span>
          </div>
        </div>`;
    };

    podium.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <div class="md:order-1 order-2 flex flex-col items-center">
          ${medal(second, '2nd', '', 'bg-gradient-to-br from-gray-300 to-gray-400', 'border-gray-300 dark:border-gray-600', 'text-gray-900 dark:text-white', 'text-4xl', 'workspace_premium')}
        </div>
        <div class="md:order-2 order-1 flex flex-col items-center md:-mt-6">
          ${medal(first, '1st', '-mt-6', 'bg-gradient-to-br from-yellow-400 to-yellow-500', 'border-yellow-400 dark:border-yellow-500', 'text-yellow-900 dark:text-white', 'text-5xl', 'emoji_events')}
        </div>
        <div class="md:order-3 order-3 flex flex-col items-center">
          ${medal(third, '3rd', '', 'bg-gradient-to-br from-orange-400 to-orange-500', 'border-orange-400 dark:border-orange-600', 'text-orange-900 dark:text-white', 'text-4xl', 'workspace_premium')}
        </div>
      </div>`;
}

// ─────────────────────────────────────────────────────────────
//  Render full rankings table
// ─────────────────────────────────────────────────────────────
function renderTable(users) {
    const tbody = document.getElementById('rankingsTbody');
    if (!tbody) return;

    if (users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-text-secondary dark:text-dark-text-secondary">No users yet. Complete study tasks to appear here!</td></tr>`;
        return;
    }

    const maxPts = Math.max(...users.map(u => u.total_points), 1);

    tbody.innerHTML = users.map(u => {
        const rowClass = u.is_me
            ? 'bg-primary/10 dark:bg-primary/20 border-y-2 border-primary hover:bg-primary/20 dark:hover:bg-primary/30'
            : 'hover:bg-background dark:hover:bg-dark-background';
        const ptClass  = u.is_me ? 'text-primary' : 'text-text-primary dark:text-dark-text-primary';
        const youBadge = u.is_me ? `<span class="text-xs font-bold bg-primary text-white px-2 py-0.5 rounded-full ml-2">You</span>` : '';
        const pct      = maxPts > 0 ? Math.round((u.total_points / maxPts) * 100) : 0;

        return `
        <tr class="${rowClass} transition-all duration-300 group cursor-pointer"
            onclick="showUserInfo(${u.user_id}, ${JSON.stringify(u).replace(/"/g, '&quot;')})">
          <td class="p-4">${rankBadge(u.rank)}</td>
          <td class="p-4">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 border-2 ${u.is_me ? 'border-primary' : 'border-gray-200 dark:border-gray-600'} shadow-md flex items-center justify-center flex-shrink-0 overflow-hidden">
                ${avatarHtml(u.profile_photo, u.display_name, 'w-12 h-12', 'text-base')}
              </div>
              <div>
                <p class="font-bold text-text-primary dark:text-dark-text-primary text-base flex items-center">
                  ${u.display_name}${youBadge}
                </p>
                <p class="text-xs text-text-secondary dark:text-dark-text-secondary">@${u.username} · ${u.tasks_completed} tasks completed</p>
              </div>
            </div>
          </td>
          <td class="p-4">
            <div class="flex items-center gap-2">
              <span class="text-2xl font-bold ${ptClass}">${u.total_points}</span>
              <span class="text-xs text-text-secondary dark:text-dark-text-secondary">pts</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
              <div class="${barColor(u.rank)} h-2 rounded-full transition-all duration-700" style="width: ${pct}%"></div>
            </div>
          </td>
          <td class="p-4">
            <span class="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
          </td>
        </tr>`;
    }).join('');
}

// ─────────────────────────────────────────────────────────────
//  Update stats bar at the top
// ─────────────────────────────────────────────────────────────
function updateStats(users, me) {
    const totalEl   = document.getElementById('statTotalStudents');
    const avgEl     = document.getElementById('statAvgScore');
    const rankEl    = document.getElementById('statMyRank');

    if (totalEl) totalEl.textContent = me ? me.total_users : users.length;

    if (avgEl && users.length) {
        const avg = Math.round(users.reduce((s, u) => s + u.total_points, 0) / users.length);
        avgEl.textContent = avg;
    }

    if (rankEl && me) rankEl.textContent = `#${me.rank}`;
}

// ─────────────────────────────────────────────────────────────
//  User Info Modal
// ─────────────────────────────────────────────────────────────
function showUserInfo(userId, userObj) {
    const modal = document.getElementById('userInfoModal');
    if (!modal) return;

    document.getElementById('modalUserName').textContent  = userObj.display_name;
    document.getElementById('modalUserId').textContent    = `@${userObj.username}`;
    document.getElementById('modalUserLevel').textContent = `${levelFromPoints(userObj.total_points)} · ${userObj.total_points} pts`;
    document.getElementById('modalTasksDone').textContent = `${userObj.tasks_completed} tasks`;

    // ── Dynamic avatar ────────────────────────────────────────
    const avatarEl = document.getElementById('modalAvatar');
    if (avatarEl) {
        avatarEl.innerHTML = avatarHtml(userObj.profile_photo, userObj.display_name, 'w-24 h-24', 'text-3xl');
    }

    modal.classList.remove('hidden');
}

function closeUserInfo() {
    document.getElementById('userInfoModal')?.classList.add('hidden');
}

// ─────────────────────────────────────────────────────────────
//  Main load
// ─────────────────────────────────────────────────────────────
async function loadLeaderboard() {
    // Show skeletons
    const tbody = document.getElementById('rankingsTbody');
    if (tbody) {
        tbody.innerHTML = Array(5).fill(`
          <tr class="animate-pulse">
            <td class="p-4"><div class="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700"></div></td>
            <td class="p-4"><div class="flex items-center gap-3"><div class="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700"></div><div class="space-y-2"><div class="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div><div class="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div></div></div></td>
            <td class="p-4"><div class="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div><div class="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded"></div></td>
            <td class="p-4"></td>
          </tr>`).join('');
    }

    try {
        const [lbRes, meRes] = await Promise.all([
            fetch(LB_API,       { headers: getAuthHeaders() }),
            fetch(`${LB_API}/me`, { headers: getAuthHeaders() }),
        ]);

        if (!lbRes.ok) throw new Error('Could not load leaderboard');

        const users = await lbRes.json();
        const me    = meRes.ok ? await meRes.json() : null;

        renderPodium(users);
        renderTable(users);
        updateStats(users, me);

    } catch (err) {
        console.error(err);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-red-500">Failed to load leaderboard. Is the server running?</td></tr>`;
        }
    }
}

// ─────────────────────────────────────────────────────────────
//  Boot
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initializeDarkMode();
    initializeMobileMenu();
    initializeDropdowns();
    loadLeaderboard();

    // Modal close on backdrop click
    document.getElementById('userInfoModal')?.addEventListener('click', e => {
        if (e.target === document.getElementById('userInfoModal')) closeUserInfo();
    });
});