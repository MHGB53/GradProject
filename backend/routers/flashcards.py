from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import User, Flashcard
from ..schemas import FlashcardCreate, FlashcardUpdate, FlashcardOut
from ..routers.auth import get_current_user

router = APIRouter(
    prefix="/api/flashcards",
    tags=["Flashcards"]
)

@router.get("", response_model=List[FlashcardOut])
def get_flashcards(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get all flashcards for the current user."""
    flashcards = db.query(Flashcard).filter(Flashcard.user_id == current_user.id).order_by(Flashcard.created_at.desc()).all()
    return flashcards

@router.post("", response_model=FlashcardOut, status_code=status.HTTP_201_CREATED)
def create_flashcard(
    payload: FlashcardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new flashcard for the current user."""
    new_flashcard = Flashcard(
        user_id=current_user.id,
        topic=payload.topic,
        description=payload.description,
        category=payload.category,
        is_mastered=payload.is_mastered
    )
    db.add(new_flashcard)
    db.commit()
    db.refresh(new_flashcard)
    return new_flashcard

@router.put("/{flashcard_id}", response_model=FlashcardOut)
def update_flashcard(
    flashcard_id: int,
    payload: FlashcardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing flashcard."""
    flashcard = db.query(Flashcard).filter(
        Flashcard.id == flashcard_id,
        Flashcard.user_id == current_user.id
    ).first()

    if not flashcard:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(flashcard, key, value)

    db.commit()
    db.refresh(flashcard)
    return flashcard

@router.delete("/{flashcard_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_flashcard(
    flashcard_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a flashcard."""
    flashcard = db.query(Flashcard).filter(
        Flashcard.id == flashcard_id,
        Flashcard.user_id == current_user.id
    ).first()

    if not flashcard:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    db.delete(flashcard)
    db.commit()
    return None
