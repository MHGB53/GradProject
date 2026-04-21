"""
Dentor Chatbot Router
Exposes POST /api/chat — wraps Gemini 2.5 Flash with the Dentor system-prompt
so the AI answers only dental questions.

Uses the new `google-genai` SDK (google.genai).
"""

import os
from typing import Any, List

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from google import genai
from google.genai import types

from ..database import get_db
from ..routers.auth import get_current_user
from ..models import User, ChatSession, ChatMessage
from .. import schemas

# Load .env from the project root
load_dotenv()

router = APIRouter(prefix="/api/chat", tags=["Chatbot"])

# ──────────────────────────── System Prompt ────────────────────────────
SYSTEM_PROMPT = """أنت طبيب أسنان خبير اسمك "Dentor".
مهمتك هي الإجابة على أسئلة المرضى والطلاب في مجال طب الأسنان فقط.
إذا سألك أي شخص عن شيء خارج طب الأسنان، قل: "أنا Dentor، متخصص في طب الأسنان فقط ولا أستطيع الإجابة على هذا السؤال."
يُقبل السؤال باللغة العربية أو الإنجليزية ويُرد بنفس اللغة."""


# ──────────────────────────── Session Endpoints ────────────────────────────

@router.get("/sessions", response_model=List[schemas.ChatSessionOut])
def get_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Return all chat sessions for the current user, newest first."""
    sessions = db.query(ChatSession).filter(ChatSession.user_id == current_user.id).order_by(ChatSession.created_at.desc()).all()
    return sessions

@router.post("/session", response_model=schemas.ChatSessionOut)
def create_session(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Create a new chat session."""
    new_session = ChatSession(user_id=current_user.id)
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@router.get("/session/{session_id}/messages", response_model=List[schemas.ChatMessageOut])
def get_session_messages(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Return all messages for a specific session."""
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc()).all()
    return messages

@router.delete("/session/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Delete a chat session and all its messages."""
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()
    return {"message": "Session deleted"}


# ──────────────────────────── Chat Endpoint ────────────────────────────

@router.post("", response_model=schemas.ChatResponse)
async def chat(
    payload: schemas.ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Accepts a user message + conversation history, forwards them to
    Gemini 2.5 Flash with the Dentor system-prompt injected, and returns
    the model's reply. Saves messages to the DB if session_id is provided.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not set. Add it to your .env file.",
        )

    # Validate session if provided
    session = None
    if payload.session_id:
        session = db.query(ChatSession).filter(ChatSession.id == payload.session_id, ChatSession.user_id == current_user.id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Save user message
        user_msg = ChatMessage(session_id=session.id, role="user", content=payload.message)
        db.add(user_msg)
        
        # Update title if it's the first message
        if session.title == "New Chat":
            session.title = payload.message[:30] + ("..." if len(payload.message) > 30 else "")
            
        db.commit()

    # Build the conversational turns
    contents: list[types.Content] = []
    for entry in payload.history:
        sdk_role = "user" if entry.role == "user" else "model"
        contents.append(
            types.Content(
                role=sdk_role,
                parts=[types.Part(text=entry.content)],
            )
        )

    # Append current user message
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
        
        # Save AI message
        if session:
            ai_msg = ChatMessage(session_id=session.id, role="assistant", content=reply)
            db.add(ai_msg)
            db.commit()

        return schemas.ChatResponse(reply=reply, session_id=session.id if session else -1)

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Error communicating with Gemini API: {exc}",
        ) from exc
