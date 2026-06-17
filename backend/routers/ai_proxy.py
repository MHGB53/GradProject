"""
Dentor AI Proxy Router (Modal Version)
======================================
Exposes JWT-protected endpoints that act as a secure middleman
between the browser and our custom Modal.com deployments:

  POST /api/ai/summarize      –  BioBART medical summarization
  POST /api/ai/translate      –  Helsinki-NLP English→Arabic translation
  POST /api/ai/generate-quiz  –  Mistral Exam Generator
"""

import os
import uuid
import asyncio
import textwrap
import logging
from typing import Optional, List

import httpx
import json
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile
from pydantic import BaseModel

from ..routers.auth import get_current_user
from ..models import User

# ──────────────────────────── Config ────────────────────────────
load_dotenv(override=True)

logger = logging.getLogger(__name__)

MODAL_SUMMARIZE_URL: str = os.getenv("MODAL_SUMMARIZE_URL", "").rstrip("/")
MODAL_TRANSLATE_URL: str = os.getenv("MODAL_TRANSLATE_URL", "").rstrip("/")
MODAL_QUIZ_URL: str = os.getenv("MODAL_QUIZ_URL", "").rstrip("/")
# Verbose question types (case-study / image-based) at higher counts can take
# several minutes on the GPU; give the quiz call generous headroom by default.
MODAL_TIMEOUT: float = float(os.getenv("MODAL_TIMEOUT_SECONDS", "240"))

SUMMARIZE_CHUNK_SIZE = 3000
TRANSLATE_CHUNK_SIZE = 1000

# Embedded images extracted from uploaded PDFs are saved here and served via the
# app's /uploads static mount, so image-based questions can show a real figure
# from the lecture. <root>/uploads/quiz_images
QUIZ_IMAGE_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "uploads", "quiz_images",
)

# ──────────────────────────── Router ────────────────────────────
router = APIRouter(prefix="/api/ai", tags=["AI Proxy"])

# ──────────────────────────── Schemas ────────────────────────────
class TextRequest(BaseModel):
    text: str

class SummarizeResponse(BaseModel):
    status: str
    summary: str

class TranslateResponse(BaseModel):
    status: str
    translation: str

class QuizGenerationRequest(BaseModel):
    subject: str
    difficulty: str
    num_questions: int
    question_types: List[str]
    lectures: Optional[List[str]] = None

class QuizResponse(BaseModel):
    status: str
    raw_response: str
    # You could also add a list of dicts for parsed questions if desired

# ──────────────────────────── Helpers ────────────────────────────
def _validate_config() -> None:
    """Raise HTTP 500 if any required Modal URL is missing."""
    missing = []
    if not MODAL_SUMMARIZE_URL: missing.append("MODAL_SUMMARIZE_URL")
    if not MODAL_TRANSLATE_URL: missing.append("MODAL_TRANSLATE_URL")
    if not MODAL_QUIZ_URL: missing.append("MODAL_QUIZ_URL")
    
    if missing:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Server misconfiguration: missing env var(s): {', '.join(missing)}.",
        )

def _split_into_chunks(text: str, chunk_size: int) -> list[str]:
    """Split text into chunks, preserving paragraph breaks."""
    text = text.strip()
    if not text:
        return []
    # Split on paragraph breaks first to preserve document structure
    paragraphs = [p.strip() for p in text.split('\n') if p.strip()]
    chunks = []
    current = []
    current_len = 0
    for para in paragraphs:
        if current_len + len(para) > chunk_size and current:
            chunks.append(' '.join(current))
            current = [para]
            current_len = len(para)
        else:
            current.append(para)
            current_len += len(para) + 1
    if current:
        chunks.append(' '.join(current))
    return chunks


def _split_for_translation(text: str, max_chars: int = 400) -> list[str]:
    """Sentence-aware chunking for the translation model.

    Groups whole sentences into chunks no larger than ``max_chars`` so the model
    never receives a mid-sentence fragment and never silently overflows its
    512-token window. Over-long single sentences are split on the nearest space.
    This noticeably improves output coherence versus blind character chunking.
    """
    import re

    # Collapse OCR runs of dots/dashes/underscores and normalise whitespace.
    text = re.sub(r"[.\-_=]{4,}", " ", text)
    text = " ".join(text.split())
    if not text:
        return []

    # Split after sentence-ending punctuation (Latin + Arabic full stop/question).
    sentences = re.split(r"(?<=[.!?؟۔])\s+", text)
    chunks: list[str] = []
    current = ""

    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        # A single sentence longer than the limit: flush, then hard-split it.
        if len(sentence) > max_chars:
            if current:
                chunks.append(current)
                current = ""
            while len(sentence) > max_chars:
                cut = sentence.rfind(" ", 0, max_chars)
                if cut <= 0:
                    cut = max_chars
                chunks.append(sentence[:cut].strip())
                sentence = sentence[cut:].strip()
            current = sentence
            continue
        if current and len(current) + len(sentence) + 1 > max_chars:
            chunks.append(current)
            current = sentence
        else:
            current = f"{current} {sentence}".strip()

    if current:
        chunks.append(current)
    return chunks


def _fix_arabic_spacing(text: str) -> str:
    """Fix common spacing issues in Arabic text from Helsinki-NLP translation."""
    import re
    # Add space between Arabic letter and opening parenthesis
    text = re.sub(r'([\u0600-\u06FF])\(', r'\1 (', text)
    # Add space between closing parenthesis and Arabic letter  
    text = re.sub(r'\)([\u0600-\u06FF])', r') \1', text)
    # Fix merged Arabic words: where a shadda/hamza pattern suggests word boundary
    # Normalize multiple spaces to single space
    text = re.sub(r' {2,}', ' ', text)
    # Fix missing space after Arabic period (.) in lists
    text = re.sub(r'\.([\u0600-\u06FF])', r'. \1', text)
    return text.strip()


# ─────────────────────── Quiz Prompt Engine ─────────────────────
# Per-question-type JSON schema + a concrete example. The example is what
# anchors the model to the exact shape we want for each type.
QUESTION_TYPE_SCHEMAS: dict[str, dict] = {
    "multiple-choice": {
        "fields": [
            '"question": string',
            '"options": array of EXACTLY 4 separate strings (never merge them into one string)',
            '"correct": integer 0-3 (index of the correct option)',
            '"type": "multiple-choice"',
        ],
        "example": {
            "question": "Which bone forms the lower jaw?",
            "options": ["Maxilla", "Mandible", "Zygomatic", "Palatine"],
            "correct": 1,
            "type": "multiple-choice",
        },
    },
    "true-false": {
        "fields": [
            '"question": string (a statement to evaluate)',
            '"answer": boolean — JSON true or false, NOT a string',
            '"type": "true-false"',
        ],
        "example": {
            "question": "The mandible is the only movable bone of the skull.",
            "answer": True,
            "type": "true-false",
        },
    },
    "short-answer": {
        "fields": [
            '"question": string',
            '"answer": string (the concise correct answer, a few words or one sentence)',
            '"type": "short-answer"',
        ],
        "example": {
            "question": "What is the hardest substance in the human body?",
            "answer": "Tooth enamel",
            "type": "short-answer",
        },
    },
    "case-study": {
        "fields": [
            '"scenario": string (a short clinical case description)',
            '"question": string (the question about the scenario)',
            '"answer": string (the correct diagnosis / management)',
            '"type": "case-study"',
        ],
        "example": {
            "scenario": "A 45-year-old patient presents with spontaneous pain in the lower left molar, worse at night and lingering after a cold stimulus.",
            "question": "What is the most likely pulpal diagnosis?",
            "answer": "Symptomatic irreversible pulpitis",
            "type": "case-study",
        },
    },
    "image-based": {
        "fields": [
            '"question": string (refers to an image)',
            '"image_prompt": string — a DETAILED visual description that could be used to generate the required image',
            '"options": array of EXACTLY 4 separate strings',
            '"correct": integer 0-3 (index of the correct option)',
            '"type": "image-based"',
        ],
        "example": {
            "question": "Identify the highlighted structure in the radiograph.",
            "image_prompt": "A panoramic dental radiograph (OPG) of an adult, with the left mandibular first molar outlined in red, surrounding teeth visible in greyscale.",
            "options": ["Canine", "Mandibular first molar", "Second premolar", "Lateral incisor"],
            "correct": 1,
            "type": "image-based",
        },
    },
}

DEFAULT_QUESTION_TYPE = "multiple-choice"


def _normalise_question_types(q_types: list) -> list[str]:
    """Keep only supported types in request order; fall back to MCQ."""
    seen: list[str] = []
    for t in q_types or []:
        key = str(t).strip().lower()
        if key in QUESTION_TYPE_SCHEMAS and key not in seen:
            seen.append(key)
    return seen or [DEFAULT_QUESTION_TYPE]


def _allocate_type_counts(num_q: int, types: list[str]) -> dict[str, int]:
    """Distribute num_q as evenly as possible across the selected types.

    The remainder is handed to the first types in order, so every type gets at
    least one question and the counts sum to exactly num_q.
    """
    n = len(types)
    base, rem = divmod(num_q, n)
    return {t: base + (1 if i < rem else 0) for i, t in enumerate(types)}


def _assemble_exact(by_type: dict[str, list], allocation: dict[str, int], num_q: int) -> list[dict]:
    """Pick exactly ``num_q`` questions, honouring per-type quotas first.

    Step 1 takes each type's quota. Step 2 fills any remaining slots (caused by
    a type under-delivering) from the leftover questions of types that produced
    extras, so the total reliably lands on ``num_q`` without dropping coverage.
    """
    selected: list[dict] = []
    leftovers: list[dict] = []
    for qtype, items in by_type.items():
        target = allocation.get(qtype, 0)
        selected.extend(items[:target])
        leftovers.extend(items[target:])
    if len(selected) < num_q:
        selected.extend(leftovers[: num_q - len(selected)])
    return selected[:num_q]


def _extract_pdf_images(doc, max_images: int = 30, min_dim: int = 120) -> list[str]:
    """Extract embedded images from an open PyMuPDF document.

    Saves each sufficiently large image under QUIZ_IMAGE_DIR and returns their
    public ``/uploads/quiz_images/...`` URLs. Tiny graphics (logos, bullets,
    icons) are skipped via ``min_dim``, and duplicate images (same xref reused
    across pages) are de-duplicated.
    """
    urls: list[str] = []
    seen: set[int] = set()
    try:
        os.makedirs(QUIZ_IMAGE_DIR, exist_ok=True)
    except Exception as exc:
        logger.warning("Could not create quiz image dir: %s", exc)
        return urls

    for page in doc:
        for img in page.get_images(full=True):
            xref = img[0]
            if xref in seen:
                continue
            seen.add(xref)
            try:
                base = doc.extract_image(xref)
            except Exception:
                continue
            if base.get("width", 0) < min_dim or base.get("height", 0) < min_dim:
                continue  # skip icons / logos / decorative graphics
            ext = (base.get("ext") or "png").lower()
            name = f"{uuid.uuid4().hex}.{ext}"
            try:
                with open(os.path.join(QUIZ_IMAGE_DIR, name), "wb") as fh:
                    fh.write(base["image"])
            except Exception as exc:
                logger.warning("Could not save extracted image: %s", exc)
                continue
            urls.append(f"/uploads/quiz_images/{name}")
            if len(urls) >= max_images:
                logger.info("Reached image cap (%d); stopping extraction.", max_images)
                return urls
    logger.info("Extracted %d image(s) from PDF.", len(urls))
    return urls


def _build_quiz_prompt(
    num_q: int,
    difficulty: str,
    q_types: list[str],
    context_block: str,
) -> str:
    """Build a dynamic, schema-strict instruction prompt for the exam model.

    Injects {num_questions}, {difficulty} and the requested {question_type}(s),
    and enforces an exact-count + strict-JSON contract that adapts per type.
    """
    types = _normalise_question_types(q_types)

    # Build per-type schema blocks (fields + a JSON example).
    schema_blocks: list[str] = []
    for t in types:
        spec = QUESTION_TYPE_SCHEMAS[t]
        fields = "\n".join(f"  - {f}" for f in spec["fields"])
        example = json.dumps(spec["example"], ensure_ascii=False)
        schema_blocks.append(f'For "{t}" questions, each object MUST have:\n{fields}\n  Example: {example}')
    schema_section = "\n\n".join(schema_blocks)

    if len(types) == 1:
        type_rule = f'Every question MUST be of type "{types[0]}".'
    else:
        # Hand the model an explicit per-type quota that sums to exactly num_q.
        # "Mix them" lets a 7B model drop a type and miscount; a fixed quota
        # forces every selected type to appear and pins the total.
        allocation = _allocate_type_counts(num_q, types)
        quota_lines = "\n".join(
            f'  - exactly {allocation[t]} question(s) of type "{t}"' for t in types
        )
        type_rule = (
            f"Use ONLY these question types, with this EXACT distribution "
            f"(it sums to {num_q}):\n{quota_lines}\n"
            f'Set each object\'s "type" field to the matching value. '
            f"Every listed type MUST appear the exact number of times shown."
        )

    return textwrap.dedent(f"""\
        You are a medical and dental exam generator for the Dentor platform.

        TASK: Generate exactly {num_q} exam question(s).
        DIFFICULTY: {difficulty}. Calibrate the depth, vocabulary and reasoning
        required by every question to a {difficulty} level.

        QUESTION TYPES:
        {type_rule}

        COUNT (critical): You MUST output exactly {num_q} question object(s).
        No more, no less. Do not stop early and do not add extras.

        BE CONCISE: Keep every "scenario" to at most 2 short sentences and every
        "answer"/"image_prompt" to one sentence. Brevity is required so that ALL
        {num_q} questions fit in the response — never truncate the JSON.

        OUTPUT FORMAT (critical):
        - Output ONLY a single valid JSON array. Nothing before it, nothing after it.
        - Start with [ and end with ]. No markdown, no code fences, no comments,
          no explanations.
        - Use the exact schema for each type below. Booleans must be JSON booleans,
          indices must be JSON integers.

        SCHEMAS:
        {schema_section}
        {context_block}""")


def _extract_quiz_json(raw_text: str):
    """Best-effort, robust extraction of the JSON payload from model output.

    Handles markdown fences, leading/trailing prose, and single-object replies.
    Returns a parsed object (list or dict) or ``None`` if nothing parseable.
    """
    import re

    if not raw_text:
        return None
    text = raw_text.strip()

    # 1. Strip a ```json ... ``` fence if present.
    fence = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL)
    if fence:
        text = fence.group(1).strip()

    # 2. Direct parse.
    try:
        return json.loads(text)
    except Exception:
        pass

    # 3. Outermost array, then outermost object.
    for open_ch, close_ch in (("[", "]"), ("{", "}")):
        start = text.find(open_ch)
        end = text.rfind(close_ch)
        if start != -1 and end > start:
            try:
                return json.loads(text[start:end + 1])
            except Exception:
                continue

    # 4. Salvage: the array was likely truncated (no closing ]). Recover every
    #    complete top-level {...} object and drop the trailing partial one.
    salvaged = _salvage_json_objects(text)
    return salvaged or None


def _salvage_json_objects(text: str) -> list:
    """Scan for balanced top-level ``{...}`` objects and parse each independently.

    Survives a truncated/malformed wrapping array by skipping the final
    incomplete object instead of failing the whole parse. String contents
    (including braces inside them) are respected.
    """
    objects: list = []
    depth = 0
    start = None
    in_str = False
    esc = False
    for i, ch in enumerate(text):
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
            continue
        if ch == '"':
            in_str = True
        elif ch == "{":
            if depth == 0:
                start = i
            depth += 1
        elif ch == "}":
            if depth > 0:
                depth -= 1
                if depth == 0 and start is not None:
                    try:
                        objects.append(json.loads(text[start:i + 1]))
                    except Exception:
                        pass
                    start = None
    return objects


async def _generate_type_batch(
    client: "httpx.AsyncClient",
    qtype: str,
    count: int,
    difficulty: str,
    context_block: str,
) -> list[dict]:
    """Generate ONE question type in a single Modal call and return parsed items.

    Each batch asks the model for a single type only — which a 7B model follows
    far more reliably than a mixed "N questions across 5 types" request. The
    type is stamped on every item (the model occasionally mislabels) and the
    list is capped to the requested count.
    """
    prompt = _build_quiz_prompt(count, difficulty, [qtype], context_block)
    full_prompt = f"<s>[INST] {prompt} [/INST]"

    response = await client.post(MODAL_QUIZ_URL, json={"inputs": full_prompt})
    response.raise_for_status()
    raw_text = (response.json().get("generated_text") or "").strip()

    parsed = _extract_quiz_json(raw_text)
    if isinstance(parsed, list):
        items = parsed
    elif isinstance(parsed, dict):
        items = [parsed]
    else:
        items = []

    items = [q for q in items if isinstance(q, dict)]
    for q in items:
        q["type"] = qtype  # single-type batch ⇒ authoritative label
    logger.info("Batch '%s': requested %d, got %d.", qtype, count, len(items))
    # Return everything parsed (no per-batch cap); the caller assembles the
    # final set to the exact total, drawing extras to cover any shortfall.
    return items


# ──────────────────────────── Endpoints ─────────────────────────

@router.post(
    "/summarize",
    response_model=SummarizeResponse,
    summary="Summarize medical text via Modal BioBART",
)
async def summarize_text(
    request: TextRequest,
    _current_user: User = Depends(get_current_user),
) -> SummarizeResponse:
    _validate_config()
    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=422, detail="Text field must not be empty.")

    chunks = _split_into_chunks(text, SUMMARIZE_CHUNK_SIZE)
    summaries: list[str] = []

    async with httpx.AsyncClient(timeout=MODAL_TIMEOUT, follow_redirects=True) as client:
        for idx, chunk in enumerate(chunks):
            try:
                response = await client.post(MODAL_SUMMARIZE_URL, json={"inputs": chunk})
                response.raise_for_status()
                data = response.json()
                if "summary_text" in data:
                    summaries.append(data["summary_text"])
                elif "error" in data:
                    raise Exception(data["error"])
            except Exception as exc:
                logger.error("Modal summarize error on chunk %d: %s", idx, exc)
                raise HTTPException(status_code=500, detail="Modal summarization service failed.")

    return SummarizeResponse(
        status="success",
        summary="\n\n".join(summaries),
    )


@router.post(
    "/translate",
    response_model=TranslateResponse,
    summary="Translate medical text to Arabic via Modal Helsinki-NLP",
)
async def translate_text(
    request: TextRequest,
    _current_user: User = Depends(get_current_user),
) -> TranslateResponse:
    _validate_config()
    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=422, detail="Text field must not be empty.")

    # Sentence-aware chunking: keeps sentences whole and within the model's
    # token window, which the small Helsinki model handles far better.
    chunks = _split_for_translation(text)
    translations: list[str] = []

    async with httpx.AsyncClient(timeout=MODAL_TIMEOUT, follow_redirects=True) as client:
        for idx, chunk in enumerate(chunks):
            try:
                response = await client.post(MODAL_TRANSLATE_URL, json={"inputs": chunk})
                response.raise_for_status()
                data = response.json()
                if "translation_text" in data:
                    translated = _fix_arabic_spacing(data["translation_text"])
                    translations.append(translated)
                elif "error" in data:
                    raise Exception(data["error"])
            except Exception as exc:
                logger.error("Modal translate error on chunk %d: %s", idx, exc)
                raise HTTPException(status_code=500, detail="Modal translation service failed.")

    # Join translated chunks with paragraph breaks
    final_translation = "\n\n".join(translations)
    return TranslateResponse(
        status="success",
        translation=final_translation,
    )


@router.post(
    "/generate-quiz",
    response_model=QuizResponse,
    summary="Generate medical quiz via Modal Mistral",
)
async def generate_quiz(
    subject: str = Form(...),
    difficulty: str = Form(...),
    num_questions: int = Form(...),
    question_types: str = Form(...),
    lectures: str = Form("[]"),
    file: UploadFile = File(None)
) -> QuizResponse:
    _validate_config()
    
    # Parse JSON strings from form data
    try:
        q_types = json.loads(question_types)
        lec_list = json.loads(lectures)
    except Exception:
        q_types = ["multiple-choice"]
        lec_list = []
    
    # Extract text (and, for PDFs, embedded images) from the uploaded file
    extracted_text = ""
    image_urls: list[str] = []
    if file and file.filename:
        try:
            content = await file.read()
            filename = file.filename.lower()
            logger.info(f"Parsing uploaded file: {filename}, size: {len(content)} bytes")

            if filename.endswith(".pdf"):
                import fitz
                doc = fitz.open(stream=content, filetype="pdf")
                for page in doc:
                    extracted_text += page.get_text() + "\n"
                # Pull real lecture figures out for image-based questions.
                image_urls = _extract_pdf_images(doc)
                doc.close()
            elif filename.endswith(".docx") or filename.endswith(".doc"):
                import docx
                import io
                doc = docx.Document(io.BytesIO(content))
                for para in doc.paragraphs:
                    extracted_text += para.text + "\n"
            else:
                extracted_text = content.decode("utf-8", errors="ignore")
            
            # Clean up whitespace
            extracted_text = " ".join(extracted_text.split())
            logger.info(f"Extracted {len(extracted_text)} chars from file")
            
            # IMPORTANT: Keep context very short so Mistral doesn't lose the JSON format
            # Mistral 7B has ~4096 token limit. 3000 chars ≈ ~750 tokens for content.
            max_chars = 3000
            if len(extracted_text) > max_chars:
                extracted_text = extracted_text[:max_chars]
                logger.info(f"Truncated extracted text to {max_chars} chars")
        except Exception as e:
            logger.error(f"Error parsing uploaded file: {e}", exc_info=True)
            raise HTTPException(status_code=400, detail=f"Could not parse the uploaded document: {str(e)}")

    num_q = max(1, int(num_questions))
    types = _normalise_question_types(q_types)

    if extracted_text:
        context_block = (
            "\n\nUse ONLY this reference material to write the questions:\n"
            f"---\n{extracted_text}\n---"
        )
    else:
        context_block = f"\n\nTOPIC: {subject}"

    # Split the request into ONE single-type batch per selected type. A 7B model
    # reliably honours "generate N questions of type X" but not "N questions
    # mixed across 5 types", so per-type batches guarantee both full type
    # coverage and accurate counts. Batches run concurrently.
    allocation = _allocate_type_counts(num_q, types)
    batches = [(t, c) for t, c in allocation.items() if c > 0]
    logger.info("Quiz batches: %s (difficulty=%s)", allocation, difficulty)

    # Ask each batch for ONE extra question above its quota. The model sometimes
    # under-delivers by one, so the buffer lets a type that produced extras cover
    # another type's shortfall — keeping the final total exactly num_q.
    async with httpx.AsyncClient(timeout=MODAL_TIMEOUT, follow_redirects=True) as client:
        results = await asyncio.gather(
            *(_generate_type_batch(client, t, c + 1, difficulty, context_block) for t, c in batches),
            return_exceptions=True,
        )

    by_type: dict[str, list] = {}
    failed: list[str] = []
    for (qtype, _count), result in zip(batches, results):
        if isinstance(result, Exception):
            logger.error("Quiz batch '%s' failed: %s", qtype, result)
            failed.append(qtype)
            continue
        by_type.setdefault(qtype, []).extend(result)

    questions = _assemble_exact(by_type, allocation, num_q)

    if not questions:
        raise HTTPException(
            status_code=502,
            detail="Modal quiz generation service failed for all question types.",
        )

    # Attach real lecture figures to image-based questions, cycling through the
    # images pulled from the PDF. The model writes the question from the text, so
    # the figure is illustrative context rather than a guaranteed exact match.
    if image_urls:
        img_idx = 0
        for q in questions:
            if q.get("type") == "image-based":
                q["image_url"] = image_urls[img_idx % len(image_urls)]
                img_idx += 1

    logger.info(
        "Assembled %d/%d question(s) across %d batch(es); failed types: %s",
        len(questions), num_q, len(batches), failed or "none",
    )
    return QuizResponse(
        status="success",
        raw_response=json.dumps(questions, ensure_ascii=False),
    )
