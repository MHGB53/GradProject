/**
 * aIsummarization.js
 * ==================
 * Full implementation for the Dentor AI Summarizer page.
 *
 * Features:
 *  • Drag-and-drop / browse: accepts PDF, DOCX, DOC, TXT
 *  • Client-side text extraction: pdf.js (PDF) + mammoth.js (DOCX)
 *  • Real API calls to /api/ai/summarize and /api/ai/translate (secure proxy)
 *  • Structured output rendering with headings, paragraphs, bullet points
 *  • Sliding Arabic translation card with dir="rtl"
 *  • Dual-language PDF export via html2pdf.js (only includes Arabic if available)
 */

// ─── Proxy API base (same origin — no HF URL or key here) ───────────────────
const PROXY_BASE = '';   // empty = same origin; adjust if backend is on a different port

// ─── Module-level state ──────────────────────────────────────────────────────
let _extractedText   = '';   // raw text from the uploaded file
let _englishSummary  = '';   // plain-text English summary from BioBART
let _arabicTranslation = ''; // plain-text Arabic translation from Helsinki
let _originalWordCount = 0;  // word count of the original extracted text

// ────────────────────────────────────────────────────────────────────────────
// 1. DARK MODE
// ────────────────────────────────────────────────────────────────────────────
function initializeDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const darkModeIcon   = document.getElementById('darkModeIcon');
    const logoImage      = document.getElementById('logoImage');
    const lightLogo = '../assets/Logo.png';
    const darkLogo  = '../assets/Logo0.png';

    if (darkModeToggle && logoImage) {
        const currentTheme = ThemeManager.getCurrentTheme();
        logoImage.src = currentTheme === 'dark' ? darkLogo : lightLogo;
        if (darkModeIcon) darkModeIcon.textContent = currentTheme === 'dark' ? 'dark_mode' : 'light_mode';

        darkModeToggle.addEventListener('click', function () {
            const newTheme = ThemeManager.toggleTheme();
            if (darkModeIcon) darkModeIcon.textContent = newTheme === 'dark' ? 'dark_mode' : 'light_mode';
            logoImage.style.opacity = '0';
            setTimeout(() => {
                logoImage.src = newTheme === 'dark' ? darkLogo : lightLogo;
                logoImage.style.opacity = '1';
            }, 150);
        });
    }
}

// ────────────────────────────────────────────────────────────────────────────
// 2. NAVIGATION
// ────────────────────────────────────────────────────────────────────────────
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            if (this.getAttribute('href') === '#') e.preventDefault();
            navLinks.forEach(nl => {
                nl.classList.remove('active', 'text-white', 'bg-primary', 'shadow-lg', 'shadow-primary/30');
                nl.classList.add('text-text-secondary', 'dark:text-dark-text-secondary');
            });
            this.classList.add('active', 'text-white', 'bg-primary', 'shadow-lg', 'shadow-primary/30');
            this.classList.remove('text-text-secondary', 'dark:text-dark-text-secondary');
        });
    });
    setActivePage('summarizer');
}

function setActivePage(pageName) {
    document.querySelectorAll('.nav-link').forEach(link => {
        const linkPage = link.getAttribute('data-page');
        if (linkPage === pageName) {
            link.classList.add('active', 'text-white', 'bg-primary', 'shadow-lg', 'shadow-primary/30');
            link.classList.remove('text-text-secondary', 'dark:text-dark-text-secondary');
        } else {
            link.classList.remove('active', 'text-white', 'bg-primary', 'shadow-lg', 'shadow-primary/30');
            link.classList.add('text-text-secondary', 'dark:text-dark-text-secondary');
        }
    });
}

// ────────────────────────────────────────────────────────────────────────────
// 3. FILE EXTRACTION
// ────────────────────────────────────────────────────────────────────────────

/** Extract plain text from a PDF file using pdf.js */
async function extractFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const pageTexts = [];
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        pageTexts.push(content.items.map(item => item.str).join(' '));
    }
    return pageTexts.join('\n\n');
}

/** Extract plain text from a DOCX file using mammoth.js */
async function extractFromDOCX(file) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
}

/** Extract plain text from a plain TXT file */
async function extractFromTXT(file) {
    return await file.text();
}

/** Pre-clean text BEFORE sending to the model to remove PDF slide artifacts */
function preCleanExtractedText(text) {
    if (!text) return "";
    return text
        // Remove weird geometric shapes often exported from PowerPoint bullets
        .replace(/[◦◧Φ▦◸◤◖►■□▪▫●○►◄▼▲◈◉◊]/g, ' ')
        // Remove standard bullets and stray indicators
        .replace(/[\u2022\u2023\u25E6\u25C6\u25CF]/g, ' ')
        // Collapse multiple spaces
        .replace(/[ \t]{2,}/g, ' ')
        // Remove stray single letters that might be list markers if they clutter
        .trim();
}

/** Dispatch to the correct extractor based on file type */
async function extractText(file) {
    const name = file.name.toLowerCase();
    let rawText = "";
    if (name.endsWith('.pdf')) {
        rawText = await extractFromPDF(file);
    } else if (name.endsWith('.docx')) {
        rawText = await extractFromDOCX(file);
    } else if (name.endsWith('.doc')) {
        // .doc (old binary format) — mammoth can handle some cases
        try { rawText = await extractFromDOCX(file); } catch (_) {
            throw new Error('Legacy .doc files may not be supported. Please save as .docx and try again.');
        }
    } else if (name.endsWith('.txt')) {
        rawText = await extractFromTXT(file);
    } else {
        throw new Error('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
    }
    
    return preCleanExtractedText(rawText);
}

// ────────────────────────────────────────────────────────────────────────────
// 4. DRAG & DROP / FILE INPUT

// ────────────────────────────────────────────────────────────────────────────
function initializeFileUpload() {
    const dropZone    = document.getElementById('dropZone');
    const fileInput   = document.getElementById('fileInput');
    const browseBtn   = document.getElementById('browseBtn');
    const fileInfo    = document.getElementById('fileInfo');
    const fileName    = document.getElementById('fileName');
    const fileSize    = document.getElementById('fileSize');
    const removeFile  = document.getElementById('removeFile');
    const summarizeBtn = document.getElementById('summarizeBtn');

    browseBtn.addEventListener('click', e => { e.stopPropagation(); fileInput.click(); });
    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', e => {
        if (e.target.files.length > 0) handleFile(e.target.files[0]);
    });

    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', e => { e.preventDefault(); dropZone.classList.remove('drag-over'); });
    dropZone.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    });

    function handleFile(file) {
        // Reset state
        _extractedText      = '';
        _englishSummary     = '';
        _arabicTranslation  = '';

        // Hide translation card if visible
        const transCard = document.getElementById('translationCard');
        if (transCard) transCard.classList.add('hidden');

        fileName.textContent = file.name;
        fileSize.textContent  = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
        fileInfo.classList.remove('hidden');
        fileInfo.classList.add('fade-in');
        summarizeBtn.disabled = false;

        // Show a brief extraction notice
        showNotification('File selected — ready to summarize!', 'success');

        // Eagerly extract text in the background so it's ready when button is clicked
        extractText(file).then(text => {
            _extractedText = text;
            _originalWordCount = text.split(/\s+/).filter(Boolean).length;
        }).catch(err => {
            showNotification('Could not pre-read file: ' + err.message, 'error');
        });
    }

    removeFile.addEventListener('click', () => {
        _extractedText      = '';
        _englishSummary     = '';
        _arabicTranslation  = '';
        fileInfo.classList.add('hidden');
        fileInput.value = '';
        summarizeBtn.disabled = true;
        const transCard = document.getElementById('translationCard');
        if (transCard) transCard.classList.add('hidden');
        resetSummaryPlaceholder();
        showNotification('File removed', 'info');
    });
}

// ────────────────────────────────────────────────────────────────────────────
// 5. API CALLS (through secure proxy)
// ────────────────────────────────────────────────────────────────────────────
function getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
}

async function callSummarize(text) {
    const response = await fetch(`${PROXY_BASE}/api/ai/summarize`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ text }),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `Server returned ${response.status}`);
    }
    const data = await response.json();
    return data.summary;
}

async function callTranslate(text) {
    const response = await fetch(`${PROXY_BASE}/api/ai/translate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ text }),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `Server returned ${response.status}`);
    }
    const data = await response.json();
    return data.translation;
}

// ────────────────────────────────────────────────────────────────────────────
// 6. OUTPUT FORMATTING
// ────────────────────────────────────────────────────────────────────────────

/**
 * Clean raw model / PDF-extraction artifacts from text before rendering.
 */
function _cleanText(text) {
    return text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/[\u2028\u2029]/g, '\n')                       // line/paragraph separators \u2192 newline
        // Remove CJK / fullwidth bracket & quote artifacts (\u3008 \u3009 \u300A \u300B \u300C \u300D \u300E \u300F \u3010 \u3011 \uFF08 \uFF09)
        .replace(/[\u3008-\u3011\u300A-\u300F\u3014-\u301B\uFF08\uFF09]/g, ' ')
        // Remove stray "*/(" / ")/*" style junk left by the extractor/model
        .replace(/\*+\/+[()]*/g, ' ')
        .replace(/[()]*\/+\*+/g, ' ')
        // Remove replacement char, zero-width chars and BOM
        .replace(/[\uFFFD\u200B-\u200D\uFEFF]/g, '')
        // Collapse 3+ repeated punctuation/symbols (e.g. \u3011\u3011\u3011, ...., \u0640\u0640\u0640\u0640)
        .replace(/([^\w\s\u0600-\u06FF])\1{2,}/g, '$1')
        .replace(/[ \t]{2,}/g, ' ')          // collapse double-spaces
        .replace(/[ \t]+\n/g, '\n')          // trim trailing spaces per line
        .replace(/\n{3,}/g, '\n\n')          // collapse excess blank lines
        .trim();
}

/**
 * formatTextToHTML(text, isArabic)
 * ====================================
 * Formats the raw text from the AI into clean HTML paragraphs and lists.
 * Maintains proper RTL direction for Arabic.
 * Artificially splits long blocks of text into smaller paragraphs for readability.
 */
function formatTextToHTML(text, isArabic = false) {
    if (!text || !text.trim())
        return '<p class="summary-paragraph">No content available.</p>';

    const clean = _cleanText(text);
    const dir   = isArabic ? 'dir="rtl" lang="ar"' : 'dir="ltr"';
    const lhStyle = isArabic ? 'style="line-height:1.9; text-align:right; margin-bottom:14px;"' : 'style="line-height:1.8; margin-bottom:14px;"';

    // Split text into paragraphs based on double newlines
    let rawParagraphs = clean.split(/\n{2,}/);
    let html = '';

    // Helper: auto-split long text blocks into smaller paragraphs (e.g. every ~3 sentences)
    const autoChunkText = (block) => {
        // Match sentence endings (. ! ? ؟) followed by a space
        const sentences = block.split(/(?<=[.!?\u061F])\s+/);
        if (sentences.length <= 3) return [block]; // Short enough
        
        const chunks = [];
        let currentChunk = [];
        
        sentences.forEach(sentence => {
            currentChunk.push(sentence);
            if (currentChunk.length >= 3) {
                chunks.push(currentChunk.join(' '));
                currentChunk = [];
            }
        });
        if (currentChunk.length > 0) chunks.push(currentChunk.join(' '));
        return chunks;
    };

    rawParagraphs.forEach(para => {
        para = para.trim();
        if (!para) return;

        // Check if paragraph looks like a list
        const lines = para.split('\n');
        const listItems = [];
        const textLines = [];

        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return;
            
            const isListItem = /^([\u2022\u2023\u25E6\u25C6\u25CF\-\*]|\d+[.)])/.test(trimmedLine);
            if (isListItem) {
                const cleanItem = trimmedLine.replace(/^([\u2022\u2023\u25E6\u25C6\u25CF\-\*]|\d+[.)])\s*/, '');
                if (cleanItem.length > 2) listItems.push(cleanItem);
            } else {
                textLines.push(trimmedLine);
            }
        });

        // Add standard text as auto-chunked paragraphs
        if (textLines.length > 0) {
            const joinedText = textLines.join(' ');
            const subParagraphs = autoChunkText(joinedText);
            subParagraphs.forEach(subPara => {
                const pText = _inlineFormat(subPara);
                html += `<p class="summary-paragraph" ${dir} ${lhStyle}>${pText}</p>`;
            });
        }

        // Add list items
        if (listItems.length > 0) {
            html += `<ul class="summary-list${isArabic ? ' rtl-list' : ''}" ${dir} ${lhStyle}>`;
            listItems.forEach(item => {
                html += `<li style="margin-bottom: 8px;">${_inlineFormat(item)}</li>`;
            });
            html += '</ul>';
        }
    });

    if (!html) {
        return `<p class="summary-paragraph" ${dir} ${lhStyle}>${escapeHTML(clean)}</p>`;
    }
    
    return html;
}


function _inlineFormat(text) {
    // Ensure text ends with a period if it doesn't already end with punctuation
    if (!/[.!?:]$/.test(text)) {
        text += '.';
    }
    text = text
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/_(.+?)_/g, '<em>$1</em>');
    text = text.replace(/(^|[.!?]\s+)([A-Z][a-zA-Z ]{1,40}):/g, '$1<strong>$2:</strong>');
    return text;
}

// Keep formatSummaryHTML as an alias so existing callers don't break
const formatSummaryHTML = formatTextToHTML;

// ────────────────────────────────────────────────────────────────────────────
// 7. SUMMARIZE FLOW
// ────────────────────────────────────────────────────────────────────────────
function initializeSummarize() {
    const summarizeBtn  = document.getElementById('summarizeBtn');
    const summarizeIcon = document.getElementById('summarizeIcon');
    const summarizeText = document.getElementById('summarizeText');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar       = document.getElementById('progressBar');
    const progressPercent   = document.getElementById('progressPercent');

    summarizeBtn.addEventListener('click', async function () {
        if (this.disabled) return;

        // If text wasn't pre-extracted yet (edge case), abort gracefully
        if (!_extractedText || !_extractedText.trim()) {
            showNotification('Could not read the file content. Please remove and re-upload the file.', 'error');
            return;
        }

        // ── UI: start loading ──
        this.disabled = true;
        summarizeIcon.classList.add('loading-spinner');
        summarizeText.textContent = 'Analyzing…';
        progressContainer.classList.remove('hidden');
        progressBar.style.width = '0%';
        progressPercent.textContent = '0%';

        // Hide old translation if any
        const transCard = document.getElementById('translationCard');
        if (transCard) transCard.classList.add('hidden');
        _arabicTranslation = '';

        showSummaryLoading();
        document.getElementById('summaryContent').scrollIntoView({ behavior: 'smooth', block: 'center' });

        // ── Fake progress while waiting for the API ──
        let fakeProgress = 0;
        const progressInterval = setInterval(() => {
            if (fakeProgress < 85) {
                fakeProgress += Math.random() * 6;
                fakeProgress = Math.min(fakeProgress, 85);
                progressBar.style.width = fakeProgress.toFixed(0) + '%';
                progressPercent.textContent = fakeProgress.toFixed(0) + '%';
            }
        }, 400);

        try {
            _englishSummary = await callSummarize(_extractedText);

            // ── Finish progress ──
            clearInterval(progressInterval);
            progressBar.style.width = '100%';
            progressPercent.textContent = '100%';

            await new Promise(r => setTimeout(r, 400));
            progressContainer.classList.add('hidden');

            displayEnglishSummary(_englishSummary);
            showNotification('Summary generated successfully!', 'success');

        } catch (err) {
            clearInterval(progressInterval);
            progressContainer.classList.add('hidden');
            showSummaryError(err.message);
            showNotification('Summarization failed: ' + err.message, 'error');
        } finally {
            this.disabled = false;
            summarizeIcon.classList.remove('loading-spinner');
            summarizeText.textContent = 'Summarize Lecture';
        }
    });
}

function showSummaryLoading() {
    const summaryContent = document.getElementById('summaryContent');
    summaryContent.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-center py-16 space-y-6">
            <div class="relative">
                <span class="material-symbols-outlined text-7xl text-primary loading-spinner">auto_awesome</span>
                <div class="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
            </div>
            <div class="space-y-3">
                <p class="text-xl font-bold text-text-primary dark:text-dark-text-primary">AI is analyzing your document…</p>
                <p class="text-sm text-text-secondary dark:text-dark-text-secondary">BioBART is extracting key medical concepts</p>
                <p class="text-xs text-text-secondary dark:text-dark-text-secondary italic">Large documents are processed in chunks — this may take a moment</p>
            </div>
            <div class="flex gap-2">
                <span class="w-3 h-3 bg-primary rounded-full animate-pulse"></span>
                <span class="w-3 h-3 bg-primary rounded-full animate-pulse" style="animation-delay:0.2s;"></span>
                <span class="w-3 h-3 bg-primary rounded-full animate-pulse" style="animation-delay:0.4s;"></span>
            </div>
        </div>`;
    summaryContent.style.minHeight = '400px';
}

function showSummaryError(message) {
    const summaryContent = document.getElementById('summaryContent');
    summaryContent.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-center py-12 space-y-4">
            <span class="material-symbols-outlined text-5xl text-red-500">error_outline</span>
            <p class="text-lg font-bold text-text-primary dark:text-dark-text-primary">Summarization Failed</p>
            <p class="text-sm text-text-secondary dark:text-dark-text-secondary max-w-md">${escapeHTML(message)}</p>
            <p class="text-xs text-text-secondary dark:text-dark-text-secondary">The AI service on Hugging Face may be starting up (cold start). Please wait 30 seconds and try again.</p>
        </div>`;
}

function resetSummaryPlaceholder() {
    const summaryContent = document.getElementById('summaryContent');
    summaryContent.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-center py-8">
            <span class="material-symbols-outlined text-5xl text-text-secondary dark:text-dark-text-secondary mb-4 opacity-50">description</span>
            <p class="text-text-secondary dark:text-dark-text-secondary">Your AI-generated summary will appear here once you upload and process a file.</p>
            <p class="text-sm text-text-secondary dark:text-dark-text-secondary mt-2">Medical terms remain in their original language for clarity.</p>
        </div>`;
    summaryContent.style.minHeight = '';
    const summaryStats = document.getElementById('summaryStats');
    if (summaryStats) summaryStats.classList.add('hidden');
}

function displayEnglishSummary(rawSummary) {
    const summaryContent = document.getElementById('summaryContent');
    const summaryStats   = document.getElementById('summaryStats');

    summaryContent.innerHTML = `
        <div class="summary-wrapper ltr-content fade-in">
            <div class="summary-lang-badge en-badge">
                <span class="material-symbols-outlined text-sm">translate</span>
                English Summary — BioBART
            </div>
            <div class="summary-body">
                ${formatTextToHTML(rawSummary, false)}
            </div>
        </div>`;

    // Stats
    const summaryWordCount = rawSummary.split(/\s+/).filter(Boolean).length;
    const reduction = _originalWordCount > 0
        ? Math.round((1 - summaryWordCount / _originalWordCount) * 100)
        : 0;
    const paraCount = rawSummary.split(/\n\n+/).filter(Boolean).length;

    if (summaryStats) {
        summaryStats.classList.remove('hidden');
        const statNums = summaryStats.querySelectorAll('.stat-number');
        if (statNums[0]) statNums[0].textContent = summaryWordCount.toLocaleString();
        if (statNums[1]) statNums[1].textContent = paraCount;
        if (statNums[2]) statNums[2].textContent = Math.max(0, reduction) + '%';
    }
}

// ────────────────────────────────────────────────────────────────────────────
// 8. TRANSLATION FLOW
// ────────────────────────────────────────────────────────────────────────────
function initializeTranslate() {
    const translateBtn = document.getElementById('translateBtn');

    translateBtn.addEventListener('click', async function () {
        if (!_englishSummary) {
            showNotification('Please generate a summary first.', 'info');
            return;
        }

        // If already translated, toggle visibility
        const transCard = document.getElementById('translationCard');
        if (_arabicTranslation && transCard) {
            transCard.classList.toggle('hidden');
            const isHidden = transCard.classList.contains('hidden');
            this.querySelector('span:last-child').textContent = isHidden ? 'Translate to Arabic' : 'Hide Arabic';
            return;
        }

        // ── Start translation ──
        const icon = this.querySelector('.material-symbols-outlined');
        const text = this.querySelector('span:last-child');
        icon.classList.add('loading-spinner');
        text.textContent = 'Translating…';
        this.disabled = true;

        showTranslationLoading();

        try {
            _arabicTranslation = await callTranslate(_englishSummary);
            displayArabicTranslation(_arabicTranslation);
            text.textContent = 'Hide Arabic';
            showNotification('Translation complete!', 'success');
        } catch (err) {
            if (transCard) transCard.classList.add('hidden');
            showNotification('Translation failed: ' + err.message, 'error');
            text.textContent = 'Translate to Arabic';
        } finally {
            icon.classList.remove('loading-spinner');
            this.disabled = false;
        }
    });
}

function showTranslationLoading() {
    const transCard = document.getElementById('translationCard');
    const transBody  = document.getElementById('translationBody');
    if (!transCard || !transBody) return;

    transCard.classList.remove('hidden');
    transBody.innerHTML = `
        <div class="flex flex-col items-center justify-center py-10 space-y-4">
            <span class="material-symbols-outlined text-5xl text-primary loading-spinner">translate</span>
            <p class="text-text-secondary dark:text-dark-text-secondary">Translating with Helsinki-NLP…</p>
            <div class="flex gap-2">
                <span class="w-2.5 h-2.5 bg-primary rounded-full animate-pulse"></span>
                <span class="w-2.5 h-2.5 bg-primary rounded-full animate-pulse" style="animation-delay:0.2s;"></span>
                <span class="w-2.5 h-2.5 bg-primary rounded-full animate-pulse" style="animation-delay:0.4s;"></span>
            </div>
        </div>`;
    transCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function displayArabicTranslation(rawTranslation) {
    const transCard = document.getElementById('translationCard');
    const transBody  = document.getElementById('translationBody');
    if (!transCard || !transBody) return;

    transCard.classList.remove('hidden');
    transBody.innerHTML = `
        <div class="summary-wrapper rtl-content fade-in" dir="rtl" lang="ar">
            <div class="summary-lang-badge ar-badge">
                <span class="material-symbols-outlined text-sm">translate</span>
                الترجمة العربية — Helsinki-NLP
            </div>
            <div class="summary-body rtl-body" dir="rtl">
                ${formatTextToHTML(rawTranslation, true)}
            </div>
        </div>`;

    transCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}



// ────────────────────────────────────────────────────────────────────────────
// 9. COPY BUTTON
// ────────────────────────────────────────────────────────────────────────────
function initializeCopyBtn() {
    const copyBtn = document.getElementById('copyBtn');
    copyBtn.addEventListener('click', function () {
        if (!_englishSummary) {
            showNotification('Nothing to copy yet — generate a summary first.', 'info');
            return;
        }
        navigator.clipboard.writeText(_englishSummary).then(() => {
            const label = this.querySelector('span:last-child');
            const orig = label.textContent;
            label.textContent = 'Copied!';
            showNotification('Summary copied to clipboard!', 'success');
            setTimeout(() => { label.textContent = orig; }, 2000);
        });
    });
}

// ────────────────────────────────────────────────────────────────────────────
// 10. PDF EXPORT  (native browser print → "Save as PDF")
// ────────────────────────────────────────────────────────────────────────────
//
// We deliberately AVOID html2canvas/html2pdf here: it rasterizes the whole
// document into a single canvas, and long lecture summaries easily exceed the
// browser's maximum canvas height (~32 767 px) — the canvas comes back empty,
// producing the blank PDF that was reported.
//
// Instead we render the formatted report into a hidden <iframe> and call the
// browser's native print(). The user picks "Save as PDF". This handles any
// length, keeps the text selectable (not an image), and shapes Arabic correctly.
function initializeDownloadPdf() {
    const downloadBtn = document.getElementById('downloadPdfBtn');

    downloadBtn.addEventListener('click', function () {
        if (!_englishSummary) {
            showNotification('Generate a summary first before downloading.', 'info');
            return;
        }

        const icon = this.querySelector('.material-symbols-outlined');
        const label = this.querySelector('span:last-child');
        icon.classList.add('loading-spinner');
        label.textContent = 'Preparing PDF…';
        this.disabled = true;

        const restoreBtn = () => {
            icon.classList.remove('loading-spinner');
            label.textContent = 'Download PDF';
            this.disabled = false;
        };

        try {
            const html = _buildPrintDocument();

            // Hidden iframe — printing its contentWindow prints ONLY the report.
            const iframe = document.createElement('iframe');
            iframe.style.cssText =
                'position:fixed; right:0; bottom:0; width:0; height:0; border:0; visibility:hidden;';
            document.body.appendChild(iframe);

            const cleanup = () => {
                if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
            };

            const doc = iframe.contentWindow.document;
            doc.open();
            doc.write(html);
            doc.close();

            // Give the iframe a moment to lay out fonts/RTL before printing.
            setTimeout(() => {
                try {
                    const win = iframe.contentWindow;
                    // Remove the iframe once the dialog closes.
                    win.onafterprint = () => setTimeout(cleanup, 200);
                    win.focus();
                    win.print();
                    // Fallback cleanup in case onafterprint never fires.
                    setTimeout(cleanup, 60000);
                } catch (e) {
                    cleanup();
                    showNotification('PDF generation failed: ' + e.message, 'error');
                }
                restoreBtn();
            }, 350);

            showNotification('Choose "Save as PDF" in the print dialog.', 'info');
        } catch (err) {
            showNotification('PDF generation failed: ' + err.message, 'error');
            restoreBtn();
        }
    });
}

/** Build a complete standalone HTML document for printing the report. */
function _buildPrintDocument() {
    const dateStr = new Date().toLocaleDateString();

    const arabicSection = _arabicTranslation ? `
        <hr class="divider"/>
        <section dir="rtl" lang="ar" class="rtl">
            <h2 class="section-title rtl-title">الترجمة العربية (Helsinki-NLP)</h2>
            <div class="section-body">${_summaryToExportHTML(_arabicTranslation, true)}</div>
        </section>` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Dentor Summary ${dateStr}</title>
<style>
    @page { size: A4; margin: 16mm 14mm; }
    * { box-sizing: border-box; }
    body {
        font-family: "Segoe UI", Tahoma, Arial, sans-serif;
        color: #1f2937;
        background: #ffffff;
        font-size: 13.5px;
        line-height: 1.8;
        margin: 0;
    }
    .report-header {
        text-align: center;
        border-bottom: 2px solid #5bcba7;
        padding-bottom: 14px;
        margin-bottom: 26px;
    }
    .report-header h1 {
        font-size: 22px; font-weight: 800; color: #111827; margin: 0 0 4px;
    }
    .report-header p {
        font-size: 11px; color: #6b7280; margin: 0;
        text-transform: uppercase; letter-spacing: 1px;
    }
    .section-title {
        font-size: 16px; font-weight: 700; color: #3db896;
        margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.4px;
    }
    .rtl-title { text-align: right; }
    section { margin-bottom: 28px; }
    .rtl { text-align: right; }
    ul.summary-list {
        margin: 8px 0 16px 0; padding-left: 22px; list-style-type: disc;
    }
    ul.summary-list.rtl-list {
        padding-left: 0; padding-right: 22px; direction: rtl; text-align: right;
    }
    ul.summary-list li { margin-bottom: 6px; line-height: 1.8; }
    p.summary-paragraph { line-height: 1.85; margin-bottom: 12px; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 22px 0; }
    strong { color: #111827; }
    /* Avoid breaking a bullet across pages */
    li, h2 { page-break-inside: avoid; }
</style>
</head>
<body>
    <div class="report-header">
        <h1>DENTOR MEDICAL PLATFORM</h1>
        <p>AI Lecture Summary Report — ${dateStr}</p>
    </div>
    <section dir="ltr">
        <h2 class="section-title">English Summary (BioBART)</h2>
        <div class="section-body">${_summaryToExportHTML(_englishSummary, false)}</div>
    </section>
    ${arabicSection}
</body>
</html>`;
}

/** Convert raw summary text to HTML suitable for PDF export */
function _summaryToExportHTML(rawText, isRTL) {
    return formatTextToHTML(rawText, isRTL);
}

// ────────────────────────────────────────────────────────────────────────────
// 11. NOTIFICATIONS
// ────────────────────────────────────────────────────────────────────────────
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-24 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 ${
        type === 'success' ? 'bg-primary text-white' :
        type === 'error'   ? 'bg-red-500 text-white' :
        'bg-card dark:bg-dark-card text-text-primary dark:text-dark-text-primary border border-border-color dark:border-dark-border-color'
    }`;
    notification.innerHTML = `
        <span class="material-symbols-outlined">${type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info'}</span>
        <span class="font-medium">${escapeHTML(message)}</span>`;
    notification.style.transform = 'translateX(400px)';
    document.body.appendChild(notification);
    requestAnimationFrame(() => { notification.style.transform = 'translateX(0)'; });
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// ────────────────────────────────────────────────────────────────────────────
// 12. MOBILE MENU
// ────────────────────────────────────────────────────────────────────────────
function initializeMobileMenu() {
    const mobileMenuBtn      = document.getElementById('mobileMenuBtn');
    const mobileSidebar      = document.getElementById('mobileSidebar');
    const mobileSidebarPanel = document.getElementById('mobileSidebarPanel');
    const closeMobileMenu    = document.getElementById('closeMobileMenu');

    mobileMenuBtn?.addEventListener('click', () => {
        mobileSidebar.classList.remove('hidden');
        setTimeout(() => mobileSidebarPanel.classList.remove('-translate-x-full'), 10);
    });

    const closeSidebar = () => {
        mobileSidebarPanel.classList.add('-translate-x-full');
        setTimeout(() => mobileSidebar.classList.add('hidden'), 300);
    };

    closeMobileMenu?.addEventListener('click', closeSidebar);
    mobileSidebar?.addEventListener('click', e => { if (e.target === mobileSidebar) closeSidebar(); });
}

// ────────────────────────────────────────────────────────────────────────────
// 13. MISC HELPERS
// ────────────────────────────────────────────────────────────────────────────
function hideCurrentPageFromDropdown() {
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    document.querySelectorAll('.absolute.left-0.mt-2 a[href]').forEach(link => {
        const linkHref = link.getAttribute('href');
        link.parentElement.style.display = linkHref === currentPage ? 'none' : '';
    });
}

function escapeHTML(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ────────────────────────────────────────────────────────────────────────────
// 14. ENTRY POINT
// ────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    // Configure pdf.js worker
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    initializeMobileMenu();
    initializeDarkMode();
    initializeNavigation();
    hideCurrentPageFromDropdown();
    initializeFileUpload();
    initializeSummarize();
    initializeCopyBtn();
    initializeDownloadPdf();
    initializeTranslate();

    // Disable summarize button initially
    document.getElementById('summarizeBtn').disabled = true;

    // ── Notification / Profile dropdowns ──
    const notificationBtn      = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const profileBtn           = document.getElementById('profileBtn');
    const profileDropdown      = document.getElementById('profileDropdown');

    notificationBtn.addEventListener('click', e => {
        e.stopPropagation();
        notificationDropdown.classList.toggle('hidden');
        profileDropdown.classList.add('hidden');
    });

    profileBtn.addEventListener('click', e => {
        e.stopPropagation();
        profileDropdown.classList.toggle('hidden');
        notificationDropdown.classList.add('hidden');
    });

    document.addEventListener('click', e => {
        if (!notificationBtn.contains(e.target) && !notificationDropdown.contains(e.target))
            notificationDropdown.classList.add('hidden');
        if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target))
            profileDropdown.classList.add('hidden');
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            notificationDropdown.classList.add('hidden');
            profileDropdown.classList.add('hidden');
        }
    });
});