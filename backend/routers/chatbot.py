"""
Dentor Chatbot Router
Exposes POST /api/chat — wraps Gemini 2.5 Flash with the Dentor system-prompt
so the AI answers only dental questions.

Uses the new `google-genai` SDK (google.genai), the replacement for the
now-retired `google-generativeai` package.
"""

import os
from typing import Any

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from google import genai
from google.genai import types
from pydantic import BaseModel

# Load .env from the project root (two levels above this file)
load_dotenv()

router = APIRouter(prefix="/api", tags=["Chatbot"])

# ──────────────────────────── System Prompt ────────────────────────────
SYSTEM_PROMPT = """أنت طبيب أسنان خبير اسمك "Dentor".
مهمتك هي الإجابة على أسئلة المرضى والطلاب في مجال طب الأسنان فقط.
إذا سألك أي شخص عن شيء خارج طب الأسنان، قل: "أنا Dentor، متخصص في طب الأسنان فقط ولا أستطيع الإجابة على هذا السؤال."
يُقبل السؤال باللغة العربية أو الإنجليزية ويُرد بنفس اللغة."""


# ──────────────────────────── Pydantic Models ────────────────────────────
class HistoryEntry(BaseModel):
    role: str        # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[HistoryEntry] = []


class ChatResponse(BaseModel):
    reply: str


# ──────────────────────────── Endpoint ────────────────────────────
@router.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest) -> Any:
    """
    Accepts a user message + conversation history, forwards them to
    Gemini 2.5 Flash with the Dentor system-prompt injected, and returns
    the model's reply.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not set. Add it to your .env file.",
        )

    # Build the conversational turns for the new SDK
    # Convert our history (role: user/assistant) into google.genai Content objects
    contents: list[types.Content] = []

    for entry in payload.history:
        sdk_role = "user" if entry.role == "user" else "model"
        contents.append(
            types.Content(
                role=sdk_role,
                parts=[types.Part(text=entry.content)],
            )
        )

    # Append the current user message
    contents.append(
        types.Content(
            role="user",
            parts=[types.Part(text=payload.message)],
        )
    )

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.7,
            ),
        )
        reply = response.text.strip() if response.text else "لم أتلقَّ ردًا من الخادم."
        return ChatResponse(reply=reply)

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Error communicating with Gemini API: {exc}",
        ) from exc
