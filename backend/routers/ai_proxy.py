"""
Dentor AI Proxy Router
======================
Exposes two JWT-protected endpoints that act as a secure middleman
between the browser and the Hugging Face (HF) Serverless Inference API:

  POST /api/ai/summarize  –  BioBART medical summarization
  POST /api/ai/translate  –  Helsinki-NLP English→Arabic translation

Security:
  • HF_SUMMARIZE_URL, HF_TRANSLATE_URL, and HF_READ_TOKEN are read
    exclusively from .env — never exposed to the browser.
  • Only authenticated Dentor users (valid JWT) can reach these endpoints.

Chunking:
  • Summarization: text is split into ≤ 3 000-character word-safe chunks.
  • Translation:   text is split into ≤ 1 000-character word-safe chunks.
  • Chunks are processed SEQUENTIALLY to respect HF cold-start behaviour.
  • Results are joined with '\\n\\n'.

Error handling:
  • HTTP 503 (cold start) and any other non-200 response from HF are caught
    and surfaced as HTTP 500 with a user-friendly message.
  • Raw stack traces are never leaked to the client.
"""

import os
import textwrap
import logging

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from ..routers.auth import get_current_user
from ..models import User

# ──────────────────────────── Config ────────────────────────────
load_dotenv(override=True)

logger = logging.getLogger(__name__)

HF_SUMMARIZE_URL: str = os.getenv("HF_SUMMARIZE_URL", "").rstrip("/")
HF_TRANSLATE_URL: str = os.getenv("HF_TRANSLATE_URL", "").rstrip("/")
HF_READ_TOKEN:    str = os.getenv("HF_READ_TOKEN", "")
HF_TIMEOUT:       float = float(os.getenv("HF_TIMEOUT_SECONDS", "120"))

# Maximum characters per chunk sent to each model.
# BioBART:   ~3 000 chars   (≈ 512 BPE tokens)
# Helsinki:  ~1 000 chars   (≈ 150 BPE tokens — strict 512-token decoder)
SUMMARIZE_CHUNK_SIZE = 3000
TRANSLATE_CHUNK_SIZE = 1000

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


# ──────────────────────────── Helpers ────────────────────────────
def _split_into_chunks(text: str, chunk_size: int) -> list[str]:
    """
    Split *text* into word-safe chunks of at most *chunk_size* characters
    using textwrap.wrap so no word is ever cut in half.
    Returns an empty list for blank input.
    """
    text = text.strip()
    if not text:
        return []
    return textwrap.wrap(
        text,
        width=chunk_size,
        break_long_words=False,
        replace_whitespace=False,
    )


def _hf_headers() -> dict:
    """Return the Authorization + Content-Type headers for HF Inference API."""
    return {
        "Authorization": f"Bearer {HF_READ_TOKEN}",
        "Content-Type": "application/json",
    }


def _validate_config() -> None:
    """Raise HTTP 500 if any required .env variable is missing."""
    missing = []
    if not HF_SUMMARIZE_URL:
        missing.append("HF_SUMMARIZE_URL")
    if not HF_TRANSLATE_URL:
        missing.append("HF_TRANSLATE_URL")
    if not HF_READ_TOKEN:
        missing.append("HF_READ_TOKEN")
    if missing:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Server misconfiguration: missing env var(s): {', '.join(missing)}.",
        )


def _extract_text_from_hf_response(data: object, field: str) -> str:
    """
    Parse the HF Serverless Inference API response.

    The API returns one of:
      • [{"summary_text": "..."}]            (summarization pipeline)
      • [{"translation_text": "..."}]        (translation pipeline)
      • {"summary_text": "..."}              (single-item dict variant)
      • {"translation_text": "..."}
      • {"generated_text": "..."}            (text-generation fallback)
    """
    # Unwrap list wrapper
    if isinstance(data, list) and data:
        data = data[0]

    if isinstance(data, dict):
        for key in (field, "generated_text", "translation_text", "summary_text"):
            if key in data and data[key]:
                return str(data[key]).strip()

    return ""


# ──────────────────────────── Endpoints ─────────────────────────

@router.post(
    "/summarize",
    response_model=SummarizeResponse,
    summary="Summarize medical text via BioBART (chunked, sequential)",
)
async def summarize_text(
    request: TextRequest,
    _current_user: User = Depends(get_current_user),
) -> SummarizeResponse:
    """
    Accept free-form medical text, split it into word-safe chunks of
    ≤ 3 000 characters, summarize each chunk sequentially via the HF
    BioBART Serverless Inference API, and return the concatenated result.

    - **text**: Raw text extracted from the uploaded document.
    - Requires a valid Bearer JWT token (Authorization header).
    """
    _validate_config()

    text = request.text.strip()
    if not text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The 'text' field must not be empty.",
        )

    chunks = _split_into_chunks(text, SUMMARIZE_CHUNK_SIZE)
    summaries: list[str] = []

    async with httpx.AsyncClient(timeout=HF_TIMEOUT) as client:
        for idx, chunk in enumerate(chunks):
            try:
                response = await client.post(
                    HF_SUMMARIZE_URL,
                    headers=_hf_headers(),
                    json={"inputs": chunk, "options": {"wait_for_model": True}},
                )

                if response.status_code == 503:
                    logger.warning(
                        "HF summarize chunk %d: model cold-starting (503). "
                        "Consider increasing HF_TIMEOUT_SECONDS.",
                        idx,
                    )
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=(
                            "The summarization model is currently starting up. "
                            "Please wait 20–30 seconds and try again."
                        ),
                    )

                if response.status_code != 200:
                    logger.warning(
                        "HF summarize chunk %d returned HTTP %d: %s",
                        idx,
                        response.status_code,
                        response.text[:300],
                    )
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=(
                            f"The summarization service returned an unexpected error "
                            f"(HTTP {response.status_code}). Please try again later."
                        ),
                    )

                result = _extract_text_from_hf_response(response.json(), "summary_text")
                if result:
                    summaries.append(result)
                else:
                    logger.warning("HF summarize chunk %d: empty result in response body.", idx)

            except HTTPException:
                raise  # re-raise our own HTTP errors unchanged
            except Exception as exc:
                logger.error("Unexpected error on summarize chunk %d: %s", idx, exc, exc_info=True)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="An unexpected error occurred while contacting the summarization service.",
                )

    if not summaries:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "The summarization service did not return any output. "
                "The model may still be loading — please try again in a moment."
            ),
        )

    return SummarizeResponse(
        status="success",
        summary="\n\n".join(summaries),
    )


@router.post(
    "/translate",
    response_model=TranslateResponse,
    summary="Translate medical text to Arabic via Helsinki-NLP (chunked, sequential)",
)
async def translate_text(
    request: TextRequest,
    _current_user: User = Depends(get_current_user),
) -> TranslateResponse:
    """
    Accept English medical text, split it into word-safe chunks of
    ≤ 1 000 characters, translate each chunk sequentially to Arabic via
    the HF Helsinki-NLP Serverless Inference API, and return the
    concatenated result.

    - **text**: English text to translate (typically the AI summary).
    - Requires a valid Bearer JWT token (Authorization header).
    """
    _validate_config()

    text = request.text.strip()
    if not text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The 'text' field must not be empty.",
        )

    chunks = _split_into_chunks(text, TRANSLATE_CHUNK_SIZE)
    translations: list[str] = []

    async with httpx.AsyncClient(timeout=HF_TIMEOUT) as client:
        for idx, chunk in enumerate(chunks):
            try:
                response = await client.post(
                    HF_TRANSLATE_URL,
                    headers=_hf_headers(),
                    json={"inputs": chunk, "options": {"wait_for_model": True}},
                )

                if response.status_code == 503:
                    logger.warning(
                        "HF translate chunk %d: model cold-starting (503). "
                        "Consider increasing HF_TIMEOUT_SECONDS.",
                        idx,
                    )
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=(
                            "The translation model is currently starting up. "
                            "Please wait 20–30 seconds and try again."
                        ),
                    )

                if response.status_code != 200:
                    logger.warning(
                        "HF translate chunk %d returned HTTP %d: %s",
                        idx,
                        response.status_code,
                        response.text[:300],
                    )
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=(
                            f"The translation service returned an unexpected error "
                            f"(HTTP {response.status_code}). Please try again later."
                        ),
                    )

                result = _extract_text_from_hf_response(response.json(), "translation_text")
                if result:
                    translations.append(result)
                else:
                    logger.warning("HF translate chunk %d: empty result in response body.", idx)

            except HTTPException:
                raise  # re-raise our own HTTP errors unchanged
            except Exception as exc:
                logger.error("Unexpected error on translate chunk %d: %s", idx, exc)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="An unexpected error occurred while contacting the translation service.",
                )

    if not translations:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "The translation service did not return any output. "
                "The model may still be loading — please try again in a moment."
            ),
        )

    return TranslateResponse(
        status="success",
        translation="\n\n".join(translations),
    )
