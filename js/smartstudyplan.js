/* =========================================================
   smartstudyplan.js  –  Dentor Smart Study Plan
   Connects smartstudyplan.html → /api/study-plan/* endpoints
   ========================================================= */

const API_BASE = "http://127.0.0.1:8000/api/study-plan";
const ALL_DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

// Subject colour palette (cycles for any number of subjects)
const PALETTE = [
  { bg:"bg-primary/20",      text:"text-primary-dark dark:text-primary",        dot:"bg-primary",      border:"border-primary"      },
  { bg:"bg-yellow-400/20",   text:"text-yellow-800 dark:text-yellow-200",       dot:"bg-yellow-500",   border:"border-yellow-500"   },
  { bg:"bg-red-400/20",      text:"text-red-800 dark:text-red-200",             dot:"bg-red-500",      border:"border-red-500"      },
  { bg:"bg-blue-400/20",     text:"text-blue-800 dark:text-blue-200",           dot:"bg-blue-500",     border:"border-blue-500"     },
  { bg:"bg-purple-400/20",   text:"text-purple-800 dark:text-purple-200",       dot:"bg-purple-500",   border:"border-purple-500"   },
  { bg:"bg-pink-400/20",     text:"text-pink-800 dark:text-pink-200",           dot:"bg-pink-500",     border:"border-pink-500"     },
  { bg:"bg-orange-400/20",   text:"text-orange-800 dark:text-orange-200",       dot:"bg-orange-500",   border:"border-orange-500"   },
  { bg:"bg-teal-400/20",     text:"text-teal-800 dark:text-teal-200",           dot:"bg-teal-500",     border:"border-teal-500"     },
  { bg:"bg-indigo-400/20",   text:"text-indigo-800 dark:text-indigo-200",       dot:"bg-indigo-500",   border:"border-indigo-500"   },
  { bg:"bg-lime-400/20",     text:"text-lime-800 dark:text-lime-200",           dot:"bg-lime-500",     border:"border-lime-500"     },
];

// Map: subjectName → palette index (set when subjects are loaded)
let subjectColorMap = {};
let curriculumCache = null;

// ─────────────────────────────────────────────────────────────
//  Mobile Menu
// ─────────────────────────────────────────────────────────────
function initializeMobileMenu() {
  const mobileMenuBtn    = document.getElementById("mobileMenuBtn");
  const mobileSidebar    = document.getElementById("mobileSidebar");
  const mobileSidebarPanel = document.getElementById("mobileSidebarPanel");
  const closeMobileMenu  = document.getElementById("closeMobileMenu");

  mobileMenuBtn?.addEventListener("click", () => {
    mobileSidebar.classList.remove("hidden");
    setTimeout(() => mobileSidebarPanel.classList.remove("-translate-x-full"), 10);
  });

  const closeSidebar = () => {
    mobileSidebarPanel.classList.add("-translate-x-full");
    setTimeout(() => mobileSidebar.classList.add("hidden"), 300);
  };
  closeMobileMenu?.addEventListener("click", closeSidebar);
  mobileSidebar?.addEventListener("click", e => { if (e.target === mobileSidebar) closeSidebar(); });
}

// ─────────────────────────────────────────────────────────────
//  Dark Mode
// ─────────────────────────────────────────────────────────────
function initializeDarkMode() {
  const toggle   = document.getElementById("darkModeToggle");
  const icon     = document.getElementById("darkModeIcon");
  const logoImg  = document.getElementById("logoImage");
  const lightLogo = "../assets/Logo.png";
  const darkLogo  = "../assets/Logo0.png";
  const html = document.documentElement;

  const current = localStorage.getItem("theme") || "light";
  if (current === "dark") { html.classList.add("dark"); icon.textContent = "dark_mode"; logoImg.src = darkLogo; }

  toggle?.addEventListener("click", () => {
    html.classList.toggle("dark");
    const isDark = html.classList.contains("dark");
    icon.textContent = isDark ? "dark_mode" : "light_mode";
    logoImg.style.opacity = "0";
    setTimeout(() => { logoImg.src = isDark ? darkLogo : lightLogo; logoImg.style.opacity = "1"; }, 150);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });
}

// ─────────────────────────────────────────────────────────────
//  Navigation active state
// ─────────────────────────────────────────────────────────────
function initializeNavigation() {
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach(link => {
    if (link.getAttribute("data-page") === "smartstudyplan") {
      link.classList.add("text-white","bg-primary","shadow-lg","shadow-primary/30");
      link.classList.remove("text-text-secondary","dark:text-dark-text-secondary");
    }
  });
}

// ─────────────────────────────────────────────────────────────
//  Notification / Profile dropdowns
// ─────────────────────────────────────────────────────────────
function initializeDropdowns() {
  const notifBtn  = document.getElementById("notificationBtn");
  const notifDrop = document.getElementById("notificationDropdown");
  const profBtn   = document.getElementById("profileBtn");
  const profDrop  = document.getElementById("profileDropdown");

  notifBtn?.addEventListener("click", e => { e.stopPropagation(); notifDrop.classList.toggle("hidden"); profDrop.classList.add("hidden"); });
  profBtn?.addEventListener("click",  e => { e.stopPropagation(); profDrop.classList.toggle("hidden");  notifDrop.classList.add("hidden"); });

  document.addEventListener("click", () => { notifDrop?.classList.add("hidden"); profDrop?.classList.add("hidden"); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") { notifDrop?.classList.add("hidden"); profDrop?.classList.add("hidden"); } });
}

// ─────────────────────────────────────────────────────────────
//  Notification toast
// ─────────────────────────────────────────────────────────────
function showNotification(message, type = "info") {
  const n = document.createElement("div");
  n.className = `fixed top-24 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-96 ${
    type === "success" ? "bg-primary text-white"
    : type === "error" ? "bg-red-500 text-white"
    : "bg-card dark:bg-dark-card text-text-primary dark:text-dark-text-primary border border-border-color dark:border-dark-border-color"
  }`;
  n.innerHTML = `<span class="material-symbols-outlined">${type==="success"?"check_circle":type==="error"?"error":"info"}</span>
                 <span class="font-medium">${message}</span>`;
  document.body.appendChild(n);
  requestAnimationFrame(() => n.classList.remove("translate-x-96"));
  setTimeout(() => { n.classList.add("translate-x-96","opacity-0"); setTimeout(() => n.remove(), 300); }, 3500);
}

// ─────────────────────────────────────────────────────────────
//  Fetch curriculum once and cache it
// ─────────────────────────────────────────────────────────────
async function fetchCurriculum() {
  if (curriculumCache) return curriculumCache;
  const res = await fetch(`${API_BASE}/curriculum`);
  if (!res.ok) throw new Error("Failed to load curriculum");
  curriculumCache = await res.json();
  return curriculumCache;
}

// ─────────────────────────────────────────────────────────────
//  Populate Level / Semester dropdowns in the config panel
// ─────────────────────────────────────────────────────────────
async function populateLevelSemester() {
  const levelSel   = document.getElementById("levelSelect");
  const semSel     = document.getElementById("semesterSelect");
  if (!levelSel || !semSel) return;

  const curriculum = await fetchCurriculum();

  Object.keys(curriculum).forEach(lvl => {
    const opt = document.createElement("option");
    opt.value = lvl; opt.textContent = lvl;
    levelSel.appendChild(opt);
  });

  const updateSemesters = () => {
    semSel.innerHTML = "";
    const sems = Object.keys(curriculum[levelSel.value] || {});
    sems.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s; opt.textContent = s;
      semSel.appendChild(opt);
    });
    loadSubjectsUI();
  };

  levelSel.addEventListener("change", updateSemesters);
  semSel.addEventListener("change",   loadSubjectsUI);
  updateSemesters();
}

// ─────────────────────────────────────────────────────────────
//  Render subjects into #subjectsContainer
// ─────────────────────────────────────────────────────────────
async function loadSubjectsUI() {
  const levelSel  = document.getElementById("levelSelect");
  const semSel    = document.getElementById("semesterSelect");
  const container = document.getElementById("subjectsContainer");
  if (!container || !levelSel || !semSel) return;

  container.innerHTML = `<div class="col-span-full flex justify-center py-8">
    <div class="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
  </div>`;

  try {
    const curriculum = await fetchCurriculum();
    const subjects   = curriculum[levelSel.value]?.[semSel.value] || [];

    // Assign palette colours
    subjectColorMap = {};
    subjects.forEach((s, i) => { subjectColorMap[s.name] = i % PALETTE.length; });

    container.innerHTML = "";
    subjects.forEach(sub => {
      const key   = sub.name.replace(/[^a-zA-Z0-9]/g, "_");
      const color = PALETTE[subjectColorMap[sub.name]];
      const card  = document.createElement("div");
      card.className = "slide-in rounded-xl border border-border-color dark:border-dark-border-color bg-card dark:bg-dark-card p-4 space-y-3";
      card.innerHTML = `
        <div class="flex items-center justify-between">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" id="sub_${key}" data-subject="${sub.name}" checked
              class="w-4 h-4 accent-primary rounded">
            <span class="text-sm font-semibold text-text-primary dark:text-dark-text-primary">${sub.name}</span>
          </label>
          ${sub.hard ? `<span class="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full">Hard</span>` : ""}
        </div>
        <div>
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs text-text-secondary dark:text-dark-text-secondary">My Level</span>
            <span id="lvl_val_${key}" class="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">3</span>
          </div>
          <input type="range" id="lvl_${key}" data-subject="${sub.name}" min="1" max="5" value="3"
            class="h-2 w-full cursor-pointer appearance-none rounded-full bg-primary/20 accent-primary">
          <div class="flex justify-between text-xs text-text-secondary dark:text-dark-text-secondary mt-0.5">
            <span>Weak</span><span>Strong</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" id="exam_${key}" data-subject="${sub.name}"
            class="w-4 h-4 accent-primary rounded">
          <label for="exam_${key}" class="text-xs text-text-secondary dark:text-dark-text-secondary cursor-pointer">Exam this week?</label>
        </div>
        <div id="examday_wrap_${key}" class="hidden">
          <select id="examday_${key}" data-subject="${sub.name}"
            class="w-full text-xs rounded-lg border border-border-color dark:border-dark-border-color bg-input-bg dark:bg-dark-input-bg text-text-primary dark:text-dark-text-primary px-2 py-1.5">
            <option value="None">Select exam day…</option>
            ${ALL_DAYS.map(d => `<option value="${d}">${d}</option>`).join("")}
          </select>
        </div>`;

      container.appendChild(card);

      // Slider live value
      const slider   = card.querySelector(`#lvl_${key}`);
      const valLabel = card.querySelector(`#lvl_val_${key}`);
      slider.addEventListener("input", () => valLabel.textContent = slider.value);

      // Toggle exam day dropdown
      const examCb  = card.querySelector(`#exam_${key}`);
      const dayWrap = card.querySelector(`#examday_wrap_${key}`);
      examCb.addEventListener("change", () => dayWrap.classList.toggle("hidden", !examCb.checked));
    });

  } catch (err) {
    container.innerHTML = `<p class="col-span-full text-center text-red-500">Failed to load subjects. Is the server running?</p>`;
    console.error(err);
  }
}

// ─────────────────────────────────────────────────────────────
//  Gather form values and POST to backend
// ─────────────────────────────────────────────────────────────
async function generatePlan() {
  const levelSel  = document.getElementById("levelSelect");
  const semSel    = document.getElementById("semesterSelect");
  const startTime = document.getElementById("startTimeInput")?.value || "09:00";
  const breakMin  = parseInt(document.getElementById("breakMinInput")?.value  || "30", 10);
  const weekHours = parseInt(document.getElementById("weeklyHoursInput")?.value || "20", 10);

  // Days off
  const daysOff = [];
  document.querySelectorAll(".dayoff-cb:checked").forEach(cb => daysOff.push(cb.value));

  // Subjects
  const subjects = [];
  document.querySelectorAll("#subjectsContainer input[type=checkbox][data-subject]").forEach(cb => {
    if (!cb.checked) return;                    // skip unchecked subjects
    const subName = cb.dataset.subject;
    const key     = subName.replace(/[^a-zA-Z0-9]/g, "_");
    const level   = parseInt(document.getElementById(`lvl_${key}`)?.value || "3", 10);
    const examCb  = document.getElementById(`exam_${key}`);
    const hasExam = examCb?.checked || false;
    const examDay = document.getElementById(`examday_${key}`)?.value || "None";
    subjects.push({ name: subName, level, has_exam: hasExam, exam_day: examDay });
  });

  if (subjects.length === 0) { showNotification("Please select at least one subject.", "error"); return; }

  const payload = {
    level:        levelSel.value,
    semester:     semSel.value,
    start_time:   startTime,
    break_minutes: breakMin,
    weekly_hours: weekHours,
    days_off:     daysOff,
    subjects,
  };

  // Button loading state
  const btn       = document.getElementById("generatePlanBtn");
  const btnIcon   = document.getElementById("generateIcon");
  const btnText   = document.getElementById("generateText");
  btn.disabled    = true;
  btn.classList.add("opacity-75","cursor-not-allowed");
  btnIcon.classList.add("animate-spin");
  btnText.textContent = "Generating…";

  try {
    const res  = await fetch(`${API_BASE}/generate`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Unknown error" }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }

    const data = await res.json();
    renderResults(data);
    showNotification("Study plan generated! 🎉", "success");

    // ── Persist to database ───────────────────────────────────────
    await savePlan(data, payload);

    // Scroll to results
    document.getElementById("resultsSection")?.scrollIntoView({ behavior: "smooth", block: "start" });

  } catch (err) {
    showNotification(`Error: ${err.message}`, "error");
    console.error(err);
  } finally {
    btn.disabled    = false;
    btn.classList.remove("opacity-75","cursor-not-allowed");
    btnIcon.classList.remove("animate-spin");
    btnText.textContent = "Generate Plan";
  }
}

// ─────────────────────────────────────────────────────────────
//  Auth header helper (reads JWT stored by the login flow)
// ─────────────────────────────────────────────────────────────
function getAuthHeaders() {
  // The auth router stores the token under the key "access_token"
  const token = localStorage.getItem("access_token");
  if (!token) return {};
  return { "Authorization": `Bearer ${token}` };
}

// ─────────────────────────────────────────────────────────────
//  Save plan to database after generation
// ─────────────────────────────────────────────────────────────
async function savePlan(generatedData, formPayload) {
  try {
    const body = {
      level:        formPayload.level,
      semester:     formPayload.semester,
      weekly_hours: formPayload.weekly_hours,
      start_time:   formPayload.start_time,
      total_hours:  generatedData.total_hours,
      study_days:   generatedData.study_days,
      schedule:     generatedData.schedule,
      summary:      generatedData.summary,
    };
    await fetch(`${API_BASE}/save`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body:    JSON.stringify(body),
    });
    // Silently ignore save errors — the user already has the plan visible
  } catch (_) { /* silent */ }
}

// ─────────────────────────────────────────────────────────────
//  Load saved plan on page load (auto-restore after refresh)
// ─────────────────────────────────────────────────────────────
async function loadSavedPlan() {
  try {
    const res = await fetch(`${API_BASE}/saved`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return;  // 404 = no saved plan yet, nothing to show

    const data = await res.json();

    // Rebuild the subjectColorMap from the summary so colours match
    subjectColorMap = {};
    data.summary.forEach((s, i) => { subjectColorMap[s.subject] = i % PALETTE.length; });

    // Render the schedule and summary panels (same function as after generate)
    renderResults({
      schedule:    data.schedule,
      summary:     data.summary,
      total_hours: data.total_hours,
      study_days:  data.study_days,
    });

    // ── Restore form fields to match the saved plan settings ─────
    // Level
    const levelSel = document.getElementById("levelSelect");
    if (levelSel) {
      // Wait for curriculum dropdown to have options
      const trySelect = setInterval(() => {
        const opt = [...levelSel.options].find(o => o.value === data.level);
        if (opt) {
          levelSel.value = data.level;
          levelSel.dispatchEvent(new Event("change"));  // triggers semester reload
          clearInterval(trySelect);

          // Semester (set after change event repopulates it)
          setTimeout(() => {
            const semSel = document.getElementById("semesterSelect");
            if (semSel) {
              semSel.value = data.semester;
              semSel.dispatchEvent(new Event("change"));
            }
          }, 100);
        }
      }, 50);
    }

    // Start time & weekly hours
    const startEl = document.getElementById("startTimeInput");
    if (startEl && data.start_time) startEl.value = data.start_time;

    const hoursEl = document.getElementById("weeklyHoursInput");
    const hoursLbl = document.getElementById("weeklyHoursVal");
    if (hoursEl && data.weekly_hours) {
      hoursEl.value = data.weekly_hours;
      if (hoursLbl) hoursLbl.textContent = data.weekly_hours;
    }

    showNotification("📅 Your saved study plan has been restored.", "info");

  } catch (_) { /* network error or no plan — silent */ }
}

// ─────────────────────────────────────────────────────────────
//  Render API response → schedule table + summary cards
// ─────────────────────────────────────────────────────────────
function renderResults(data) {
  renderScheduleTable(data.schedule, data.total_hours);
  renderSummaryCards(data.summary, data.total_hours, data.study_days);
  renderSubjectFilters(data.summary);

  // Show results section
  const sec = document.getElementById("resultsSection");
  if (sec) { sec.classList.remove("hidden"); sec.classList.add("fade-in"); }
}

function renderScheduleTable(schedule, totalHours) {
  // Update total-hours badge
  const totalBadge = document.getElementById("totalHoursBadge");
  if (totalBadge) totalBadge.textContent = `${totalHours} hrs`;

  // Determine which days have sessions
  const activeDays = ALL_DAYS.filter(d => schedule.some(r => r.day === d));

  // Collect all unique time slots
  const timeSlots = [...new Set(schedule.map(r => r.from_time))].sort((a, b) => {
    const toMin = t => { const [hm, ap] = t.split(" "); let [h,m] = hm.split(":").map(Number); if (ap==="PM"&&h!==12) h+=12; if (ap==="AM"&&h===12) h=0; return h*60+m; };
    return toMin(a) - toMin(b);
  });

  const thead = document.getElementById("scheduleHead");
  const tbody = document.getElementById("scheduleBody");
  if (!thead || !tbody) return;

  // Build header
  thead.innerHTML = `<tr>
    <th class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-text-primary dark:text-dark-text-primary sm:pl-6" scope="col">Time</th>
    ${activeDays.map(d => `<th class="px-3 py-3.5 text-left text-sm font-semibold text-text-primary dark:text-dark-text-primary" scope="col">${d}</th>`).join("")}
  </tr>`;

  // Index: day → fromTime → entry
  const idx = {};
  schedule.forEach(r => { (idx[r.day] = idx[r.day]||{})[r.from_time] = r; });

  // Build body
  tbody.innerHTML = timeSlots.map(slot => {
    const cells = activeDays.map(day => {
      const entry = idx[day]?.[slot];
      if (!entry) return `<td class="schedule-cell px-3 py-4 text-sm"><div class="text-center text-xs opacity-30">—</div></td>`;

      const ci    = subjectColorMap[entry.subject] ?? 0;
      const color = PALETTE[ci % PALETTE.length];
      const slug  = entry.subject.replace(/[^a-zA-Z0-9]/g,"_").toLowerCase();
      return `<td class="schedule-cell whitespace-nowrap px-3 py-4 text-sm cursor-pointer relative group"
                  data-subject="${slug}" data-time="${slot}" data-day="${day}">
        <span class="inline-block rounded-full ${color.bg} px-3 py-1 text-xs font-semibold ${color.text} transition-all hover:scale-105 hover:shadow-md">${entry.subject}</span>
        <div class="schedule-tooltip hidden absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-3 rounded-lg bg-gray-900 dark:bg-gray-800 text-white text-xs shadow-xl pointer-events-none">
          <div class="font-bold mb-1">${entry.subject}</div>
          <div class="text-gray-300">${day}, ${entry.from_time} – ${entry.to_time}</div>
          <div class="text-gray-300 mt-1">Duration: ${entry.hours} hrs</div>
          <div class="text-green-400 mt-1 flex items-center gap-1">✓ Click to mark complete</div>
          <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-800"></div>
        </div>
      </td>`;
    }).join("");
    return `<tr class="hover:bg-background/50 dark:hover:bg-dark-background/50 transition-colors">
      <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-text-secondary dark:text-dark-text-secondary sm:pl-6">
        <div class="flex items-center gap-2"><span class="material-symbols-outlined text-xs text-primary">schedule</span>${slot}</div>
      </td>
      ${cells}
    </tr>`;
  }).join("");

  // Re-attach cell click (mark complete)
  initializeScheduleCells();
}

function renderSummaryCards(summary, totalHours, studyDays) {
  const container = document.getElementById("summaryCards");
  if (!container) return;

  container.innerHTML = summary.map(s => {
    const ci    = subjectColorMap[s.subject] ?? 0;
    const color = PALETTE[ci % PALETTE.length];
    return `<div class="text-center">
      <div class="flex items-center justify-center gap-2 mb-1">
        <span class="w-3 h-3 rounded-full ${color.dot}"></span>
        <span class="text-xs font-semibold text-text-primary dark:text-dark-text-primary truncate max-w-[90px]" title="${s.subject}">${s.subject}</span>
      </div>
      <div class="text-xl font-bold" style="color:inherit">${s.weekly_hours} hrs</div>
      <div class="text-xs text-text-secondary dark:text-dark-text-secondary">${s.percentage}% of total</div>
    </div>`;
  }).join("");

  // Update sidebar insights
  const focusAreas = document.getElementById("insightFocusAreas");
  const studyDaysEl= document.getElementById("insightStudyDays");
  if (focusAreas) focusAreas.textContent = `${summary.filter(s=>s.is_hard).length} subjects`;
  if (studyDaysEl) studyDaysEl.textContent = `${studyDays} days/week`;
}

function renderSubjectFilters(summary) {
  const container = document.getElementById("filterPills");
  if (!container) return;

  container.innerHTML = `
    <button class="subject-filter active flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all bg-primary/20 text-primary-dark dark:text-primary border-2 border-primary" data-subject="all">
      <span class="material-symbols-outlined text-sm">apps</span>All Subjects
    </button>
    ${summary.map(s => {
      const ci    = subjectColorMap[s.subject] ?? 0;
      const color = PALETTE[ci % PALETTE.length];
      const slug  = s.subject.replace(/[^a-zA-Z0-9]/g,"_").toLowerCase();
      return `<button class="subject-filter flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${color.bg} ${color.text} border-2 border-transparent hover:${color.border}" data-subject="${slug}">
        <span class="w-2 h-2 rounded-full ${color.dot}"></span>
        <span class="truncate max-w-[100px]">${s.subject}</span>
      </button>`;
    }).join("")}`;

  initializeSubjectFilters();
}

// ─────────────────────────────────────────────────────────────
//  Subject filter pills (show/hide table cells)
// ─────────────────────────────────────────────────────────────
function initializeSubjectFilters() {
  const container = document.getElementById("filterPills");
  if (!container) return;
  const filterBtns = container.querySelectorAll(".subject-filter");

  filterBtns.forEach(btn => {
    btn.addEventListener("click", function() {
      filterBtns.forEach(b => { b.classList.remove("active","border-primary"); b.classList.add("border-transparent"); });
      this.classList.add("active","border-primary");

      const subject = this.dataset.subject;
      document.querySelectorAll(".schedule-cell[data-subject]").forEach(cell => {
        if (subject === "all") { cell.style.opacity = ""; cell.style.pointerEvents = ""; }
        else                   { const match = cell.dataset.subject === subject; cell.style.opacity = match ? "" : "0.15"; cell.style.pointerEvents = match ? "" : "none"; }
      });
    });
  });
}

// ─────────────────────────────────────────────────────────────
//  Schedule cell click → mark complete
// ─────────────────────────────────────────────────────────────
function initializeScheduleCells() {
  document.querySelectorAll(".schedule-cell[data-subject]").forEach(cell => {
    cell.addEventListener("click", function() {
      const isCompleted = this.classList.contains("schedule-completed");
      this.classList.toggle("schedule-completed", !isCompleted);
      const subName = this.querySelector("span")?.textContent || "Subject";
      showNotification(isCompleted ? `${subName} marked incomplete` : `${subName} completed! ✓`, isCompleted ? "info" : "success");

      if (!isCompleted) {
        const badge = this.querySelector("span");
        if (badge) { badge.style.animation = "pulse 0.5s ease-in-out"; setTimeout(() => badge.style.animation = "", 500); }
      }

      // Check if every session is now marked done
      checkAllCompleted();
    });

    // Tooltip on hover
    cell.addEventListener("mouseenter", () => cell.querySelector(".schedule-tooltip")?.classList.remove("hidden"));
    cell.addEventListener("mouseleave", () => cell.querySelector(".schedule-tooltip")?.classList.add("hidden"));
  });
}

// ─────────────────────────────────────────────────────────────
//  Completion check – show banner when all sessions are marked
// ─────────────────────────────────────────────────────────────
function checkAllCompleted() {
  const banner = document.getElementById("completionBanner");
  if (!banner) return;

  const allCells       = document.querySelectorAll(".schedule-cell[data-subject]");
  const completedCells = document.querySelectorAll(".schedule-cell[data-subject].schedule-completed");

  // Must have at least one session and every one must be completed
  const allDone = allCells.length > 0 && allCells.length === completedCells.length;

  if (allDone) {
    banner.classList.remove("hidden");
    // Smooth scroll so the user actually sees the banner
    banner.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } else {
    banner.classList.add("hidden");
  }
}

// ─────────────────────────────────────────────────────────────
//  Create New Plan – reset results and return to form
// ─────────────────────────────────────────────────────────────
function createNewPlan() {
  // 1. Hide the completion banner
  document.getElementById("completionBanner")?.classList.add("hidden");

  // 2. Hide the entire results section and clear table content
  const sec = document.getElementById("resultsSection");
  if (sec) {
    sec.classList.add("hidden");
    sec.classList.remove("fade-in");
  }

  const thead = document.getElementById("scheduleHead");
  const tbody = document.getElementById("scheduleBody");
  if (thead) thead.innerHTML = "";
  if (tbody) tbody.innerHTML = "";

  // Reset summary cards and filter pills back to defaults
  const summaryCards = document.getElementById("summaryCards");
  if (summaryCards) summaryCards.innerHTML = "";

  const filterPills = document.getElementById("filterPills");
  if (filterPills) filterPills.innerHTML = `
    <button class="subject-filter active flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold
      transition-all bg-primary/20 text-primary-dark dark:text-primary border-2 border-primary" data-subject="all">
      <span class="material-symbols-outlined text-sm">apps</span>All Subjects
    </button>`;

  // Reset total-hours badge
  const badge = document.getElementById("totalHoursBadge");
  if (badge) badge.textContent = "— hrs";

  // Reset insight sidebar
  const focusAreas = document.getElementById("insightFocusAreas");
  const studyDaysEl = document.getElementById("insightStudyDays");
  if (focusAreas) focusAreas.textContent = "— subjects";
  if (studyDaysEl) studyDaysEl.textContent = "— days/week";

  // 3. Scroll smoothly back up to the form
  document.querySelector(".mb-8.rounded-xl.border")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ─────────────────────────────────────────────────────────────
//  Hide current page from Features dropdown
// ─────────────────────────────────────────────────────────────
function hideCurrentPageFromDropdown() {
  const currentPage = window.location.pathname.split("/").pop() || "";
  document.querySelectorAll(".absolute.left-0.mt-2 a[href]").forEach(link => {
    const href = link.getAttribute("href");
    link.parentElement.style.display = (href === currentPage) ? "none" : "";
  });
}

// ─────────────────────────────────────────────────────────────
//  DOMContentLoaded – wire everything together
// ─────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  initializeMobileMenu();
  initializeDarkMode();
  initializeNavigation();
  initializeDropdowns();
  hideCurrentPageFromDropdown();

  // Load curriculum into dropdowns and subject cards
  try {
    await populateLevelSemester();
  } catch (err) {
    showNotification("Could not connect to server. Is it running?", "error");
  }

  // Auto-restore the user's last saved plan (silent if none exists)
  await loadSavedPlan();

  // Generate Plan button
  document.getElementById("generatePlanBtn")?.addEventListener("click", generatePlan);

  // Create New Plan button
  document.getElementById("createNewPlanBtn")?.addEventListener("click", createNewPlan);
});