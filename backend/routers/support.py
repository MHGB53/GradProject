from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import resend
import os

from ..database import get_db
from ..models import Complaint, User
from ..schemas import ComplaintCreate, ComplaintResponse
from .auth import get_current_user

router = APIRouter(
    prefix="/api/support",
    tags=["Support"]
)

# Hardcoded dean email — all complaints are forwarded here
DEAN_EMAIL = "m.ghoobashy@gmail.com"

@router.post("/complaints", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def submit_complaint(
    payload: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit a complaint.
    Stores the complaint in the database and sends an email to the Dean.
    The student's email is taken from their logged-in account.
    """
    # 1. Save to Database — email comes from the authenticated user account
    new_complaint = Complaint(
        complaint_type=payload.complaint_type,
        subject=payload.subject,
        description=payload.description,
        email=current_user.email,
        urgent=payload.urgent,
        status="pending"
    )
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)

    # 2. Forward complaint email to the Dean via Resend
    resend.api_key = os.getenv("RESEND_API_KEY")
    if resend.api_key:
        urgent_text = "🚨 URGENT: " if new_complaint.urgent else ""
        try:
            resend.Emails.send({
                "from": "Dentor Support <onboarding@resend.dev>",
                "to": [DEAN_EMAIL],
                "subject": f"{urgent_text}New {new_complaint.complaint_type.capitalize()} Complaint: {new_complaint.subject}",
                "html": f"""
                <h2>New Student Complaint</h2>
                <p><strong>From:</strong> {new_complaint.email}</p>
                <p><strong>Type:</strong> {new_complaint.complaint_type}</p>
                <p><strong>Urgent:</strong> {'Yes' if new_complaint.urgent else 'No'}</p>
                <hr>
                <p><strong>Description:</strong></p>
                <p>{new_complaint.description}</p>
                <p><br><br>Complaint tracking ID: #{new_complaint.id}</p>
                """
            })
        except Exception as e:
            print(f"Error sending complaint email to dean: {e}")
            # Don't fail the request — complaint is already saved in the DB.

    return new_complaint
