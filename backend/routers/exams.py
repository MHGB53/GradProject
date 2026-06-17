"""
Exam Results Router
===================
Persists completed AI-generated exams per user so they appear under
"Recent Exams" on the Exam Generator page (shared across devices), can be
re-opened for review, and award leaderboard points on completion.

  POST /api/exams           – save a completed exam (+ award points)
  GET  /api/exams/recent     – list the current user's most recent exams
  GET  /api/exams/{exam_id}  – full exam (questions + answers) for review
"""

import json
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import User, ExamResult
from ..schemas import ExamResultCreate, ExamResultOut, ExamResultDetail
from ..routers.auth import get_current_user
from .leaderboard import _get_or_create_points

router = APIRouter(prefix="/api/exams", tags=["Exams"])

logger = logging.getLogger(__name__)

# Points for finishing an exam: a base reward for completion plus a bonus that
# scales with the score (5 for finishing, up to +10 for a perfect score).
EXAM_BASE_POINTS = 5


def _points_for_score(score: int) -> int:
    return EXAM_BASE_POINTS + round(max(0, min(score, 100)) / 10)


@router.get("/recent", response_model=List[ExamResultOut])
def get_recent_exams(
    limit: int = 6,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the current user's most recent completed exams (newest first)."""
    limit = max(1, min(limit, 20))
    return (
        db.query(ExamResult)
        .filter(ExamResult.user_id == current_user.id)
        .order_by(ExamResult.created_at.desc())
        .limit(limit)
        .all()
    )


@router.get("/{exam_id}", response_model=ExamResultDetail)
def get_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return a single exam with its full questions + answers for review."""
    exam = (
        db.query(ExamResult)
        .filter(ExamResult.id == exam_id, ExamResult.user_id == current_user.id)
        .first()
    )
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found.")

    def _load(raw):
        if not raw:
            return []
        try:
            data = json.loads(raw)
            return data if isinstance(data, list) else []
        except Exception:
            return []

    detail = ExamResultDetail.model_validate(exam)
    detail.questions = _load(exam.questions_json)
    detail.answers = _load(exam.answers_json)
    return detail


@router.post("", response_model=ExamResultOut, status_code=status.HTTP_201_CREATED)
def create_exam_result(
    payload: ExamResultCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Save a completed exam for the current user and award leaderboard points."""
    title = (payload.title or "").strip()[:255] or "Custom Document Exam"
    exam = ExamResult(
        user_id=current_user.id,
        title=title,
        difficulty=payload.difficulty or "intermediate",
        num_questions=max(0, payload.num_questions),
        score=max(0, min(payload.score, 100)),
        time_taken=payload.time_taken,
        questions_json=json.dumps(payload.questions, ensure_ascii=False) if payload.questions else None,
        answers_json=json.dumps(payload.answers, ensure_ascii=False) if payload.answers is not None else None,
    )
    db.add(exam)

    # Award leaderboard points for completing the exam.
    points_earned = _points_for_score(exam.score)
    pts = _get_or_create_points(db, current_user.id)
    pts.total_points = max(0, pts.total_points + points_earned)

    db.commit()
    db.refresh(exam)

    logger.info(
        "User %s completed exam '%s' (score=%d) → +%d points.",
        current_user.id, title, exam.score, points_earned,
    )

    result = ExamResultOut.model_validate(exam)
    result.points_earned = points_earned
    return result


@router.delete("/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete one of the current user's saved exams."""
    exam = (
        db.query(ExamResult)
        .filter(ExamResult.id == exam_id, ExamResult.user_id == current_user.id)
        .first()
    )
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found.")
    db.delete(exam)
    db.commit()
    return None
