"""
Dentor AI Proxy Router
======================
Exposes two JWT-protected endpoints that act as a secure middleman
between the browser and the Hugging Face (HF) microservice:

  POST /api/ai/summarize  –  BioBART medical summarization
  POST /api/ai/translate  –  Helsinki-NLP English→Arabic translation

Security:
  • HF_API_BASE_URL and HF_API_KEY are read exclusively from .env.
  • No secret is ever sent to the browser.
  • Only authenticated Dentor users (valid JWT) can reach these endpoints.

Chunking:
  • Long texts are split into ≤ 3 000-character chunks (word-safe via
    textwrap.wrap) before being forwarded to the HF pipeline.
  • Each chunk is processed sequentially; results are joined with '\\n\\n'.
  • If one chunk fails, processing continues and the error is logged
    without exposing stack traces to the client.
"""

import os
import textwrap
import logging
import asyncio

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from ..routers.auth import get_current_user
from ..models import User

# ──────────────────────────── Config ────────────────────────────
load_dotenv(override=True)

logger = logging.getLogger(__name__)

HF_BASE_URL: str = os.getenv("HF_API_BASE_URL", "").rstrip("/")
HF_API_KEY:  str = os.getenv("HF_API_KEY", "")
HF_TIMEOUT:  float = float(os.getenv("HF_TIMEOUT_SECONDS", "60"))

# Maximum characters per chunk sent to the HF model.
# BioBART handles ~3000 chars comfortably.
# Helsinki has a ~512-token limit → use ~900 chars to stay safe.
CHUNK_SIZE           = 3000   # for summarization
TRANSLATE_CHUNK_SIZE = 900    # for translation

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
def _split_into_chunks(text: str, chunk_size: int = CHUNK_SIZE) -> list[str]:
    """
    Split *text* into word-safe chunks of at most *chunk_size* characters.
    Uses textwrap.wrap so words are never cut in half.
    Empty or whitespace-only text returns an empty list.
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
    """Return the common headers required by the HF space."""
    return {
        "Content-Type": "application/json",
        "X-API-Key": HF_API_KEY,
    }


def _validate_config() -> None:
    """Raise a 500 if the required .env variables are missing."""
    if not HF_BASE_URL:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="HF_API_BASE_URL is not configured on the server.",
        )
    if not HF_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="HF_API_KEY is not configured on the server.",
        )


# ──────────────────────────── Endpoints ─────────────────────────

@router.post(
    "/summarize",
    response_model=SummarizeResponse,
    summary="Summarize medical text via BioBART (chunked)",
)
async def summarize_text(
    request: TextRequest,
    _current_user: User = Depends(get_current_user),
) -> SummarizeResponse:
    """
    Accept free-form medical text, chunk it, summarize each chunk via the
    HF BioBART model, and return the concatenated result.

    - **text**: The raw text extracted from the uploaded document.
    - Requires a valid Bearer JWT token (Authorization header).
    """
    _validate_config()

    text = request.text.strip()
    if not text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The 'text' field must not be empty.",
        )

    chunks = _split_into_chunks(text, CHUNK_SIZE)

    # Limit to 2 concurrent requests — HF free tier is single-threaded
    semaphore = asyncio.Semaphore(2)

    async def _summarize_chunk(idx: int, chunk: str) -> tuple[int, str]:
        """Send one chunk to HF; retry once on timeout. Returns (index, result)."""
        async with semaphore:
            for attempt in range(2):  # up to 2 attempts per chunk
                async with httpx.AsyncClient(timeout=HF_TIMEOUT) as client:
                    try:
                        response = await client.post(
                            f"{HF_BASE_URL}/summarize",
                            headers=_hf_headers(),
                            json={"text": chunk},
                        )
                        if response.status_code != 200:
                            logger.warning(
                                "HF /summarize chunk %d returned HTTP %d: %s",
                                idx, response.status_code, response.text[:200],
                            )
                            return idx, ""
                        data = response.json()
                        return idx, data.get("summary", "").strip()
                    except httpx.TimeoutException:
                        if attempt == 0:
                            logger.warning("HF /summarize chunk %d timed out, retrying...", idx)
                            await asyncio.sleep(2)
                            continue
                        logger.warning("HF /summarize chunk %d timed out after retry — skipping.", idx)
                        return idx, ""
                    except Exception as exc:
                        logger.error("Unexpected error on chunk %d: %s", idx, exc)
                        return idx, ""
        return idx, ""

    # Fire all chunks concurrently (semaphore limits to 2 at a time)
    results = await asyncio.gather(*[_summarize_chunk(i, c) for i, c in enumerate(chunks)])
    summaries = [t for _, t in sorted(results, key=lambda x: x[0]) if t]

    if not summaries:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The AI service did not return a summary. It may be starting up — please try again in a moment.",
        )

    return SummarizeResponse(
        status="success",
        summary="\n\n".join(summaries),
    )


@router.post(
    "/translate",
    response_model=TranslateResponse,
    summary="Translate medical text to Arabic via Helsinki-NLP (chunked)",
)
async def translate_text(
    request: TextRequest,
    _current_user: User = Depends(get_current_user),
) -> TranslateResponse:
    """
    Accept English medical text, chunk it, translate each chunk to Arabic via
    the HF Helsinki model, and return the concatenated result.

    - **text**: The English text to translate (typically the AI summary).
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

    semaphore = asyncio.Semaphore(2)


    async def _translate_chunk(idx: int, chunk: str) -> tuple[int, str]:
        """Send one chunk to HF; retry once on timeout. Returns (index, result)."""
        async with semaphore:
            for attempt in range(2):
                async with httpx.AsyncClient(timeout=HF_TIMEOUT) as client:
                    try:
                        response = await client.post(
                            f"{HF_BASE_URL}/translate",
                            headers=_hf_headers(),
                            json={"text": chunk},
                        )
                        if response.status_code != 200:
                            logger.warning(
                                "HF /translate chunk %d returned HTTP %d: %s",
                                idx, response.status_code, response.text[:200],
                            )
                            return idx, ""
                        data = response.json()
                        return idx, data.get("translation", "").strip()
                    except httpx.TimeoutException:
                        if attempt == 0:
                            logger.warning("HF /translate chunk %d timed out, retrying...", idx)
                            await asyncio.sleep(2)
                            continue
                        logger.warning("HF /translate chunk %d timed out after retry — skipping.", idx)
                        return idx, ""
                    except Exception as exc:
                        logger.error("Unexpected error on chunk %d: %s", idx, exc)
                        return idx, ""
        return idx, ""

    results = await asyncio.gather(*[_translate_chunk(i, c) for i, c in enumerate(chunks)])
    translations = [t for _, t in sorted(results, key=lambda x: x[0]) if t]

    if not translations:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The AI service did not return a translation. It may be starting up — please try again in a moment.",
        )

    return TranslateResponse(
        status="success",
        translation="\n\n".join(translations),
    )
