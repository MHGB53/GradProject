"""
Leaderboard Router
──────────────────
Points are earned when a Smart Study Plan task is toggled to completed.
Each task completion awards POINTS_PER_TASK points.

Endpoints:
  GET  /api/leaderboard          – full ranked list (top 100)
  GET  /api/leaderboard/me       – current user's rank, points, tasks
  POST /api/leaderboard/award    – award points (called internally when task completed)
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, text

from ..database import get_db
from ..models import User, UserPoints
from .auth import get_current_user

router = APIRouter(prefix="/api/leaderboard", tags=["Leaderboard"])

POINTS_PER_TASK = 10   # points awarded per completed study task


# ─────────────────────────────────────────────
# Helper: get or create UserPoints row
# ─────────────────────────────────────────────
def _get_or_create_points(db: Session, user_id: int) -> UserPoints:
    row = db.query(UserPoints).filter(UserPoints.user_id == user_id).first()
    if not row:
        row = UserPoints(user_id=user_id, total_points=0, tasks_completed=0)
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


# ─────────────────────────────────────────────
# GET /api/leaderboard  – ranked list
# ─────────────────────────────────────────────
@router.get("")
def get_leaderboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns all users with their points, sorted by total_points DESC.
    Users with no points row are included at 0.
    """
    # Left join users → user_points so users with 0 pts still appear
    rows = (
        db.query(
            User.id,
            User.username,
            User.full_name,
            User.profile_photo,
            func.coalesce(UserPoints.total_points,    0).label("total_points"),
            func.coalesce(UserPoints.tasks_completed, 0).label("tasks_completed"),
        )
        .outerjoin(UserPoints, User.id == UserPoints.user_id)
        .order_by(func.coalesce(UserPoints.total_points, 0).desc(), User.username)
        .limit(100)
        .all()
    )

    result = []
    for rank, row in enumerate(rows, start=1):
        result.append({
            "rank":            rank,
            "user_id":         row.id,
            "username":        row.username,
            "display_name":    row.full_name or row.username,
            "profile_photo":   row.profile_photo or None,
            "total_points":    row.total_points,
            "tasks_completed": row.tasks_completed,
            "is_me":           row.id == current_user.id,
        })

    return result


# ─────────────────────────────────────────────
# GET /api/leaderboard/me  – caller's own stats
# ─────────────────────────────────────────────
@router.get("/me")
def get_my_rank(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pts = _get_or_create_points(db, current_user.id)

    # Count how many users have MORE points to calculate rank
    above = (
        db.query(func.count(UserPoints.id))
        .filter(UserPoints.total_points > pts.total_points)
        .scalar()
        or 0
    )
    my_rank = above + 1

    # Total active users
    total_users = db.query(func.count(User.id)).scalar() or 1

    return {
        "rank":            my_rank,
        "total_users":     total_users,
        "total_points":    pts.total_points,
        "tasks_completed": pts.tasks_completed,
        "display_name":    current_user.full_name or current_user.username,
        "username":        current_user.username,
        "profile_photo":   current_user.profile_photo or None,
    }


# ─────────────────────────────────────────────
# POST /api/leaderboard/award  – award/revoke points
# ─────────────────────────────────────────────
@router.post("/award")
def award_points(
    payload: dict,                              # { "delta": +10 or -10 }
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Called by the SmartStudy frontend when a task is toggled.
      delta = +POINTS_PER_TASK  when marking complete
      delta = -POINTS_PER_TASK  when un-marking complete
    """
    delta = int(payload.get("delta", 0))
    if delta not in (POINTS_PER_TASK, -POINTS_PER_TASK):
        raise HTTPException(status_code=400, detail="Invalid delta value.")

    pts = _get_or_create_points(db, current_user.id)

    pts.total_points    = max(0, pts.total_points    + delta)
    pts.tasks_completed = max(0, pts.tasks_completed + (1 if delta > 0 else -1))

    db.commit()
    db.refresh(pts)

    return {
        "total_points":    pts.total_points,
        "tasks_completed": pts.tasks_completed,
    }
