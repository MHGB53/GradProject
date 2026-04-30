/* Dentor – AI Diagnosis Wizard | aIdiagnosis.js */
'use strict';


// ── API endpoints on the Dentor FastAPI backend (no Mercury needed) ─────
// These match backend/routers/ai_diagnosis.py
const DENTOR_API = 'http://127.0.0.1:8000'; // same host as your FastAPI server

const API = {
  xray: `${DENTOR_API}/api/ai-diagnosis/xray`,  // handles both panorama & periapical
  lab: `${DENTOR_API}/api/ai-diagnosis/lab`,
};

// ── State ────────────────────────────────────────────────────────────────
const S = {
  step: 1,
  xrayType: null,
  xrayFile: null,
  labFile: null,
  historyAnswers: {},
};

const QUESTIONS = [
  'Were you referred to this clinic by a physician or a colleague?',
  'When was your last dental visit? (More than 6 months ago?)',
  'Do you visit the dentist regularly (more than once a year)?',
  'Do you brush and floss your teeth daily? (Good oral hygiene)',
  'Are you currently taking any medications or do you have any systemic disease or known allergies?',
  'Do you have any bad oral habits (e.g. nail biting, teeth grinding, pen chewing, mouth breathing)?',
  'Have you noticed any jaw-related abnormalities or tooth deformities?',
  'What is your chief complaint — what is the main reason you came to see the dentist today?',
  'Do you experience any pain? If yes, please describe its location, intensity, and when it occurs.',
];

// ── Wizard navigation ────────────────────────────────────────────────────
function goToStep(n) {
  if (n < 1 || n > 3) return;
  // Validate before advancing
  if (n > S.step) {
    if (S.step === 1 && !validateStep1()) return;
    if (S.step === 2 && !validateStep2()) return;
  }
  S.step = n;
  document.querySelectorAll('.wizard-panel').forEach((p, i) => {
    p.classList.toggle('active', i + 1 === n);
  });
  // Update step indicators
  document.querySelectorAll('.wizard-step').forEach((el, i) => {
    el.classList.remove('active', 'completed');
    if (i + 1 === n) el.classList.add('active');
    if (i + 1 < n) el.classList.add('completed');
  });
  // Update connectors
  document.querySelectorAll('.wizard-step-connector-fill').forEach((el, i) => {
    el.style.width = i < n - 1 ? '100%' : '0%';
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function validateStep1() {
  if (!S.xrayType) { showToast('Please select an X-ray type (Panorama or Periapical).', 'error'); return false; }
  if (!S.xrayFile) { showToast('Please upload an X-ray image.', 'error'); return false; }
  return true;
}
function validateStep2() {
  if (!S.labFile) { showToast('Please upload a lab results document.', 'error'); return false; }
  return true;
}

// ── X-ray type selection ─────────────────────────────────────────────────
function selectXrayType(type) {
  S.xrayType = type;
  ['panorama', 'periapical'].forEach(t => {
    document.getElementById(`xt-${t}`)?.classList.toggle('selected', t === type);
  });
  document.getElementById('xray-upload-section').classList.remove('hidden');
  const hint = document.getElementById('xray-hint');
  if (hint) hint.textContent = type === 'panorama'
    ? 'Upload a panoramic (full-mouth) radiograph — JPG, PNG, or DICOM.'
    : 'Upload a periapical (single-tooth) radiograph — JPG, PNG, or DICOM.';
}

// ── Drop zone setup ──────────────────────────────────────────────────────
function setupDropZone(zoneId, inputId, onFile) {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(inputId);
  if (!zone || !input) return;
  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('drag-over');
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  });
  input.addEventListener('change', e => { if (e.target.files[0]) onFile(e.target.files[0]); });
}

function handleXrayFile(file) {
  if (file.size > 25 * 1024 * 1024) { showToast('File too large (max 25 MB)', 'error'); return; }
  S.xrayFile = file;
  showFileCard('xray-prompt', 'xray-card', file, 'clearXray');
  showToast(`X-Ray loaded: ${file.name}`, 'success');
}
function clearXray() {
  S.xrayFile = null;
  resetFileZone('xray-prompt', 'xray-card');
  document.getElementById('xray-file-input').value = '';
}

function handleLabFile(file) {
  if (file.size > 25 * 1024 * 1024) { showToast('File too large (max 25 MB)', 'error'); return; }
  S.labFile = file;
  showFileCard('lab-prompt', 'lab-card', file, 'clearLab');
  showToast(`Lab document loaded: ${file.name}`, 'success');
}
function clearLab() {
  S.labFile = null;
  resetFileZone('lab-prompt', 'lab-card');
  document.getElementById('lab-file-input').value = '';
}

function showFileCard(promptId, cardId, file, removeFn) {
  document.getElementById(promptId)?.classList.add('hidden');
  const card = document.getElementById(cardId);
  if (!card) return;
  card.classList.remove('hidden');
  card.innerHTML = `
    <div class="file-card">
      <div class="fc-icon"><span class="material-symbols-outlined text-primary">description</span></div>
      <div class="fc-info">
        <div class="fc-name">${file.name}</div>
        <div class="fc-size">${fmtSize(file.size)}</div>
      </div>
      <button class="fc-remove" onclick="${removeFn}()">
        <span class="material-symbols-outlined" style="font-size:15px">delete</span>Remove
      </button>
    </div>`;
}
function resetFileZone(promptId, cardId) {
  document.getElementById(promptId)?.classList.remove('hidden');
  const card = document.getElementById(cardId);
  if (card) { card.classList.add('hidden'); card.innerHTML = ''; }
}

// ── Patient history ──────────────────────────────────────────────────────
function buildHistory() {
  const list = document.getElementById('hq-list');
  if (!list) return;
  list.innerHTML = QUESTIONS.map((q, i) => `
    <div class="hq-item">
      <div class="hq-text">
        <span class="hq-num">${i + 1}</span>${q}
      </div>
      <div class="yn-pill">
        <input type="radio" name="hq${i}" id="hq${i}y" value="yes" onchange="recordAnswer(${i},'yes')">
        <label for="hq${i}y">YES</label>
        <input type="radio" name="hq${i}" id="hq${i}n" value="no" onchange="recordAnswer(${i},'no')">
        <label for="hq${i}n">NO</label>
      </div>
    </div>`).join('');
}

function recordAnswer(idx, val) {
  S.historyAnswers[idx] = val;
  const answered = Object.keys(S.historyAnswers).length;
  const pct = Math.round(answered / QUESTIONS.length * 100);
  const bar = document.getElementById('hq-bar');
  const lbl = document.getElementById('hq-label');
  if (bar) bar.style.width = pct + '%';
  if (lbl) lbl.textContent = `${answered} / ${QUESTIONS.length} answered`;
}

function resetHistory() {
  S.historyAnswers = {};
  document.querySelectorAll('.yn-pill input').forEach(r => r.checked = false);
  recordAnswer(-1, ''); // trigger counter update
  delete S.historyAnswers[-1];
  const bar = document.getElementById('hq-bar');
  const lbl = document.getElementById('hq-label');
  if (bar) bar.style.width = '0%';
  if (lbl) lbl.textContent = `0 / ${QUESTIONS.length} answered`;
}

// ── MAIN: Generate Final Diagnosis ───────────────────────────────────────
async function generateDiagnosis() {
  if (!validateStep1()) { goToStep(1); return; }
  if (!validateStep2()) { goToStep(2); return; }

  const unanswered = QUESTIONS.length - Object.keys(S.historyAnswers).length;
  if (unanswered > 0) {
    showToast(`Please answer all ${QUESTIONS.length} questions (${unanswered} remaining).`, 'warning');
    return;
  }

  showOverlay();

  // Build FormData for each file upload
  // FastAPI UploadFile requires multipart/form-data – do NOT use JSON/Base64
  const xrayForm = new FormData();
  xrayForm.append('file', S.xrayFile);
  xrayForm.append('xray_type', S.xrayType); // 'panorama' | 'periapical'

  const labForm = new FormData();
  labForm.append('file', S.labFile);

  const [xrayRes, labRes] = await Promise.all([
    fetchModule('X-Ray Analysis', API.xray, xrayForm, 1),
    fetchModule('Lab Results', API.lab, labForm, 2),
  ]);

  updateGloStep(3, 'done');
  setProgress(100);

  setTimeout(() => {
    hideOverlay();
    renderDashboard(xrayRes, labRes, S.historyAnswers);
  }, 600);
}

async function fetchModule(label, url, body, stepNum) {
  updateGloStep(stepNum, 'running');
  setProgress((stepNum - 1) / 3 * 100);

  try {
    // body is FormData – do NOT set Content-Type, browser adds multipart boundary automatically
    const res = await fetch(url, {
      method: 'POST',
      body: body,
      headers: { 'Accept': 'application/json' },
      mode: 'cors',
    });

    setProgress(stepNum / 3 * 100);

    if (!res.ok) {
      const errText = await res.text().catch(() => 'Unknown error');
      throw new Error(`HTTP ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    updateGloStep(stepNum, 'done');
    return { ok: true, label, data };

  } catch (err) {
    updateGloStep(stepNum, 'failed');
    // CORS detection
    if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) {
      console.warn(
        `[Dentor CORS] ${label} blocked.\n` +
        'Ensure FastAPI runs with allow_origins=["*"] and the server is reachable at ' + url
      );
      return { ok: false, label, error: 'Cannot reach server — check FastAPI is running and CORS is enabled.' };
    }
    console.error(`[Dentor] ${label} failed:`, err);
    return { ok: false, label, error: err.message };
  }
}

// ── Loading Overlay helpers ──────────────────────────────────────────────
function showOverlay() {
  const el = document.getElementById('globalLoadingOverlay');
  if (el) el.classList.add('active');
  // Reset all steps
  [1, 2, 3].forEach(n => updateGloStep(n, 'pending'));
  setProgress(0);
}
function hideOverlay() {
  const el = document.getElementById('globalLoadingOverlay');
  if (el) el.classList.remove('active');
}
function updateGloStep(n, state) {
  const el = document.getElementById(`glo-step-${n}`);
  if (!el) return;
  el.classList.remove('running', 'done', 'failed');
  if (state !== 'pending') el.classList.add(state);
  const icon = el.querySelector('.glo-step-icon');
  if (!icon) return;
  const icons = { running: 'pending', done: 'check_circle', failed: 'error', pending: 'radio_button_unchecked' };
  const colors = { running: 'text-primary animate-pulse', done: 'text-green-400', failed: 'text-red-400', pending: 'text-gray-500' };
  icon.innerHTML = `<span class="material-symbols-outlined ${colors[state]}">${icons[state]}</span>`;
}
function setProgress(pct) {
  const bar = document.getElementById('glo-progress-fill');
  if (bar) bar.style.width = Math.min(100, pct) + '%';
}

// ── Results Dashboard ────────────────────────────────────────────────────
function renderDashboard(xrayRes, labRes, history) {
  document.getElementById('wizardForm')?.classList.add('hidden');
  const dash = document.getElementById('resultsDashboard');
  if (!dash) return;
  dash.classList.add('active');

  // Collect all yes-answers
  const yesAnswers = Object.entries(history)
    .filter(([, v]) => v === 'yes')
    .map(([i]) => QUESTIONS[i]);

  // Build X-ray section
  let xrayHTML = '';
  if (xrayRes.ok) {
    const findings = xrayRes.data?.findings || xrayRes.data?.labels || xrayRes.data?.result || [];
    const annotatedImg = xrayRes.data?.annotated_image || null;

    // Annotated image (periapical YOLO bounding boxes)
    const imgSection = annotatedImg ? `
      <div style="margin-bottom:16px;border-radius:10px;overflow:hidden;border:1px solid rgba(91,203,167,.2);">
        <div style="padding:6px 10px;background:rgba(91,203,167,.08);font-size:.72rem;color:#5BCBA7;font-weight:700;letter-spacing:.04em;">
          YOLO DETECTION — ANNOTATED IMAGE
        </div>
        <img src="${annotatedImg}" alt="YOLO annotated X-ray"
             style="width:100%;display:block;object-fit:contain;max-height:320px;background:#000;">
      </div>` : '';

    // Each finding as its own card
    const fList = Array.isArray(findings) && findings.length
      ? findings.map((f, idx) => {
        const conf = f.confidence || f.prob || 0;
        const pct = (conf * 100).toFixed(1);
        const clr = conf >= 0.7 ? '#ef4444' : conf >= 0.4 ? '#f59e0b' : '#10b981';
        const hasBox = f.bbox && f.bbox.length === 4;
        return `<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-left:3px solid ${clr};border-radius:8px;padding:10px 14px;margin-bottom:8px;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">
              <span style="font-size:.88rem;font-weight:700;color:#e2e8f0;">${idx + 1}. ${f.label || f.name || f}</span>
              <span style="background:${clr}22;color:${clr};border:1px solid ${clr}55;border-radius:20px;padding:2px 10px;font-size:.75rem;font-weight:800;white-space:nowrap;">${pct}%</span>
            </div>
            <div style="background:rgba(255,255,255,.07);border-radius:4px;height:4px;overflow:hidden;">
              <div style="width:${pct}%;height:100%;background:${clr};border-radius:4px;"></div>
            </div>
            ${hasBox ? `<div style="font-size:.68rem;color:#94a3b8;font-family:monospace;margin-top:5px;">bbox [${f.bbox.map(v => Math.round(v)).join(', ')}]</div>` : ''}
          </div>`;
      }).join('')
      : `<p style="font-size:.82rem;opacity:.7;padding:8px 0;">No significant findings detected.</p>`;

    xrayHTML = `
      <div class="result-module-card xray-card">
        <div class="rmc-header">
          <span class="material-symbols-outlined text-blue-400">radiology</span>
          <strong>${S.xrayType === 'panorama' ? 'Panoramic' : 'Periapical'} X-Ray</strong>
          <span class="rmc-badge ok">ANALYZED</span>
        </div>
        ${imgSection}
        <div style="font-size:.72rem;color:#94a3b8;margin-bottom:10px;font-weight:700;letter-spacing:.05em;">
          FINDINGS &middot; ${Array.isArray(findings) ? findings.length : 0} DETECTED
        </div>
        ${fList}
      </div>`;
  } else {
    xrayHTML = moduleErrorCard('X-Ray Analysis', xrayRes.error);
  }


  // Build lab section
  let labHTML = '';
  if (labRes.ok) {
    const d = labRes.data || {};
    const summary = d.summary || d.result || d.interpretation || 'Lab results processed.';
    const flags = Array.isArray(d.flags) ? d.flags : [];
    const flagHTML = flags.length
      ? flags.map(f => `
          <div class="finding-item">
            <span class="finding-label">${f.condition || f.marker || String(f)}</span>
            <span class="conf-pill warn">${f.status || f.value || 'Abnormal'}${f.confidence ? ` · ${(f.confidence * 100).toFixed(0)}%` : ''}</span>
          </div>`).join('')
      : '';
    labHTML = `
      <div class="result-module-card lab-card">
        <div class="rmc-header">
          <span class="material-symbols-outlined text-purple-400">science</span>
          <strong>Lab Results</strong>
          <span class="rmc-badge ok">ANALYZED</span>
        </div>
        <p style="font-size:.82rem;opacity:.85;margin-bottom:12px">${summary}</p>
        ${flagHTML}
      </div>`;
  } else {
    labHTML = moduleErrorCard('Lab Results', labRes.error);
  }

  // History section
  const histHTML = `
    <div class="result-module-card history-card">
      <div class="rmc-header">
        <span class="material-symbols-outlined text-green-400">history_edu</span>
        <strong>Patient History</strong>
        <span class="rmc-badge ok">${QUESTIONS.length} ANSWERED</span>
      </div>
      ${yesAnswers.length
      ? `<p style="font-size:.78rem;font-weight:700;color:#f59e0b;margin-bottom:8px">⚠ ${yesAnswers.length} Positive Flag${yesAnswers.length > 1 ? 's' : ''}</p>
           ${yesAnswers.map(q => `<div class="finding-item"><span class="finding-label" style="font-size:.78rem">${q}</span></div>`).join('')}`
      : `<p style="font-size:.82rem;color:#10b981">✓ No significant risk factors reported.</p>`}
    </div>`;

  // Integrated summary
  const allFailed = !xrayRes.ok && !labRes.ok;
  const summaryHTML = allFailed
    ? `<div class="summary-card"><p style="color:#ef4444;font-weight:700">⚠ All AI modules failed. Please check the Mercury server and CORS settings (see browser console for details).</p></div>`
    : `<div class="summary-card">
        <h3 style="font-size:1rem;font-weight:800;margin-bottom:12px;color:#5BCBA7">🧠 Integrated Diagnosis Overview</h3>
        <p style="font-size:.86rem;line-height:1.7;opacity:.9">
          ${buildSummaryText(xrayRes, labRes, yesAnswers)}
        </p>
       </div>`;

  dash.innerHTML = `
    <div class="result-hero">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
        <span style="font-size:3rem">✅</span>
        <div>
          <h2 style="font-size:1.5rem;font-weight:800;color:#fff">Diagnosis Complete</h2>
          <p style="font-size:.84rem;opacity:.75;color:#ccc">AI analysis finished · ${new Date().toLocaleString()}</p>
        </div>
        <button onclick="startOver()" style="margin-left:auto;padding:8px 18px;border-radius:10px;border:1px solid rgba(91,203,167,.3);background:rgba(91,203,167,.1);color:#5BCBA7;font-weight:700;font-size:.8rem;cursor:pointer">
          New Case ↺
        </button>
      </div>
      ${summaryHTML}
    </div>
    <div class="result-grid">${xrayHTML}${labHTML}${histHTML}</div>
    <div style="text-align:center;margin-top:8px">
      <button onclick="window.print()" class="btn-next" style="width:auto;padding:12px 28px">
        <span class="material-symbols-outlined">print</span>Print Report
      </button>
    </div>`;
}

function moduleErrorCard(label, errMsg) {
  return `
    <div class="result-module-card failed-card">
      <div class="rmc-header">
        <span class="material-symbols-outlined text-red-400">error</span>
        <strong>${label}</strong>
        <span class="rmc-badge fail">FAILED</span>
      </div>
      <p style="font-size:.8rem;color:#f87171">${errMsg}</p>
      <p style="font-size:.72rem;opacity:.6;margin-top:6px">Check Mercury server & CORS settings. See browser console for details.</p>
    </div>`;
}

function buildSummaryText(xrayRes, labRes, yesAnswers) {
  const parts = [];
  if (xrayRes.ok) {
    const findings = xrayRes.data?.findings || xrayRes.data?.labels || xrayRes.data?.result || [];
    const count = Array.isArray(findings) ? findings.length : 0;
    parts.push(`The ${S.xrayType} X-ray analysis identified <strong>${count} finding${count !== 1 ? 's' : ''}</strong> requiring clinical attention.`);
  }
  if (labRes.ok) {
    const d = labRes.data || {};
    const summary = d.summary || d.result || d.interpretation || '';
    if (summary) parts.push(`Lab results indicate: <strong>${summary.slice(0, 120)}${summary.length > 120 ? '…' : ''}</strong>`);
  }
  if (yesAnswers.length) {
    parts.push(`Patient history reveals <strong>${yesAnswers.length} systemic risk factor${yesAnswers.length > 1 ? 's' : ''}</strong> that may influence treatment planning.`);
  } else {
    parts.push('No systemic risk factors were reported in the patient history.');
  }
  parts.push('<em>This report is AI-generated for clinical reference only. A qualified dentist must confirm all findings.</em>');
  return parts.join(' ');
}

function startOver() {
  S.step = 1; S.xrayType = null; S.xrayFile = null; S.labFile = null; S.historyAnswers = {};
  document.getElementById('resultsDashboard').classList.remove('active');
  document.getElementById('wizardForm').classList.remove('hidden');
  clearXray(); clearLab(); resetHistory();
  ['xt-panorama', 'xt-periapical'].forEach(id => document.getElementById(id)?.classList.remove('selected'));
  document.getElementById('xray-upload-section')?.classList.add('hidden');
  goToStep(1);
}

// ── Toast ────────────────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const icons = { success: 'check_circle', error: 'error', warning: 'warning', info: 'info' };
  const c = document.getElementById('toastContainer');
  if (!c) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px;flex-shrink:0">${icons[type]}</span><span>${msg}</span><span class="toast-close material-symbols-outlined" onclick="this.closest('.toast').remove()">close</span>`;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('leaving'); setTimeout(() => t.remove(), 320); }, 3800);
}

// ── Utilities ────────────────────────────────────────────────────────────
function fmtSize(b) { if (b < 1024) return b + ' B'; if (b < 1048576) return (b / 1024).toFixed(1) + ' KB'; return (b / 1048576).toFixed(1) + ' MB'; }

// ── Nav (unchanged) ──────────────────────────────────────────────────────
function initializeMobileMenu() { const b = document.getElementById('mobileMenuBtn'), p = document.getElementById('mobileSidebarPanel'), o = document.getElementById('mobileSidebar'), c = document.getElementById('closeMobileMenu'); const open = () => { o?.classList.remove('hidden'); setTimeout(() => p?.classList.remove('-translate-x-full'), 10); }; const close = () => { p?.classList.add('-translate-x-full'); setTimeout(() => o?.classList.add('hidden'), 300); }; b?.addEventListener('click', open); c?.addEventListener('click', close); o?.addEventListener('click', e => { if (e.target === o) close(); }); }
function initializeDarkMode() { const tgl = document.getElementById('darkModeToggle'), icon = document.getElementById('darkModeIcon'), logo = document.getElementById('logoImage'); const set = t => { if (logo) logo.src = t === 'dark' ? '../assets/Logo0.png' : '../assets/Logo.png'; if (icon) icon.textContent = t === 'dark' ? 'dark_mode' : 'light_mode'; }; if (typeof ThemeManager !== 'undefined') set(ThemeManager.getCurrentTheme()); tgl?.addEventListener('click', () => { const t = typeof ThemeManager !== 'undefined' ? ThemeManager.toggleTheme() : 'light'; set(t); }); }
function initializeDropdowns() { const nb = document.getElementById('notificationBtn'), nd = document.getElementById('notificationDropdown'), pb = document.getElementById('profileBtn'), pd = document.getElementById('profileDropdown'); if (!nb || !pb) return; nb.addEventListener('click', e => { e.stopPropagation(); nd?.classList.toggle('active'); pd?.classList.add('hidden'); }); pb.addEventListener('click', e => { e.stopPropagation(); pd?.classList.toggle('hidden'); nd?.classList.remove('active'); }); document.addEventListener('click', () => { nd?.classList.remove('active'); pd?.classList.add('hidden'); }); }
function loadUserProfile() { try { const u = JSON.parse(localStorage.getItem('user') || '{}'); if (!u.name) return; document.querySelectorAll('.profile-name').forEach(el => el.textContent = u.name); document.querySelectorAll('.profile-email').forEach(el => el.textContent = u.email || ''); if (u.avatar) { const s = `background-image:url('${u.avatar}')`; document.getElementById('profileBtn')?.setAttribute('style', s); } } catch (_) { } }

// ── Init ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initializeMobileMenu();
  initializeDarkMode();
  initializeDropdowns();
  loadUserProfile();
  buildHistory();
  setupDropZone('xray-drop-zone', 'xray-file-input', handleXrayFile);
  setupDropZone('lab-drop-zone', 'lab-file-input', handleLabFile);
  goToStep(1);
});