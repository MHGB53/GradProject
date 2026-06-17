"""
Pydantic schemas for request/response validation.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime


# ──────────────────────────── Auth Schemas ────────────────────────────

class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Unique username")
    email: EmailStr = Field(..., description="Valid email address")
    full_name: Optional[str] = Field(None, max_length=100, description="Display name")
    password: str = Field(..., min_length=8, description="Password (min 8 characters)")

    model_config = {
        "json_schema_extra": {
            "example": {
                "username": "dental_student",
                "email": "student@dentor.com",
                "full_name": "Ahmed Ali",
                "password": "SecurePass123"
            }
        }
    }


class LoginRequest(BaseModel):
    username: str = Field(..., description="Username or email")
    password: str = Field(..., description="Account password")

    model_config = {
        "json_schema_extra": {
            "example": {
                "username": "dental_student",
                "password": "SecurePass123"
            }
        }
    }


class ForgotPasswordRequest(BaseModel):
    email: EmailStr = Field(..., description="User's registered email address")

class VerifyOTPRequest(BaseModel):
    email: EmailStr = Field(..., description="User's email address")
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit OTP code")

class ResetPasswordRequest(BaseModel):
    email: EmailStr = Field(..., description="User's email address")
    new_password: str = Field(..., min_length=8, description="New password (min 8 characters)")
    reset_token: str = Field(..., description="Valid reset token")

class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., description="The user's current password")
    new_password: str = Field(..., min_length=8, description="New password (min 8 characters)")

class VerifyOTPResponse(BaseModel):
    message: str
    reset_token: str



# ──────────────────────────── Auth Response Schemas ────────────────────────────

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    profile_photo: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class MessageResponse(BaseModel):
    message: str


# ──────────────────────────── Community Schemas ────────────────────────────

class AttachmentOut(BaseModel):
    id: int
    file_name: str
    file_type: str       # image | video | pdf | doc
    mime_type: Optional[str]
    url: str             # full URL to download/view the file

    model_config = {"from_attributes": True}


class AuthorOut(BaseModel):
    id: int
    username: str
    full_name: Optional[str]
    profile_photo: Optional[str] = None

    model_config = {"from_attributes": True}


class PostOut(BaseModel):
    id: int
    content: Optional[str]
    author: AuthorOut
    like_count: int
    comment_count: int
    liked_by_me: bool
    attachments: List[AttachmentOut]
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}


class CommentOut(BaseModel):
    id: int
    content: str
    author: AuthorOut
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}


class LikerOut(BaseModel):
    id: int
    username: str
    full_name: Optional[str]
    profile_photo: Optional[str] = None
    liked_at: Optional[datetime]

    model_config = {"from_attributes": True}


class PaginatedPostsOut(BaseModel):
    posts: List[PostOut]
    total: int
    page: int
    page_size: int
    has_more: bool

# ──────────────────────────── Chatbot Schemas ────────────────────────────

class ChatSessionOut(BaseModel):
    id: int
    user_id: int
    title: str = "New Chat"
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}


class ChatMessageOut(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}


class ChatHistoryEntry(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[int] = None
    history: List[ChatHistoryEntry] = []


class ChatResponse(BaseModel):
    reply: str
    session_id: int


# ──────────────────────────── Flashcard Schemas ────────────────────────────

class FlashcardBase(BaseModel):
    topic: str = Field(..., description="The front of the flashcard")
    description: str = Field(..., description="The back of the flashcard")
    category: str = Field(..., description="E.g., Anatomy, Pathology")
    is_mastered: bool = False

class FlashcardCreate(FlashcardBase):
    pass

class FlashcardUpdate(BaseModel):
    topic: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    is_mastered: Optional[bool] = None

class FlashcardOut(FlashcardBase):
    id: int
    user_id: int
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}


# ──────────────────────────── AI Exam Generator ────────────────────────────

class ExamResultCreate(BaseModel):
    title: str = Field(..., description="Exam title, usually the lecture file name")
    difficulty: str = Field("intermediate", description="beginner | intermediate | advanced")
    num_questions: int = Field(0, ge=0, description="Number of questions in the exam")
    score: int = Field(0, ge=0, le=100, description="Score percentage 0-100")
    time_taken: Optional[int] = Field(None, ge=0, description="Seconds spent on the exam")
    questions: Optional[List[dict]] = Field(None, description="Full quiz questions for review")
    answers: Optional[List[Any]] = Field(None, description="The user's answers for review")

class ExamResultOut(BaseModel):
    id: int
    title: str
    difficulty: str
    num_questions: int
    score: int
    created_at: Optional[datetime]
    points_earned: Optional[int] = None   # set on create response only

    model_config = {"from_attributes": True}

class ExamResultDetail(ExamResultOut):
    time_taken: Optional[int] = None
    questions: List[dict] = []
    answers: List[Any] = []


# ──────────────────────────── Support & Complaints ────────────────────────────

class ComplaintCreate(BaseModel):
    complaint_type: str = Field(..., description="Type of complaint")
    subject: str = Field(..., description="Subject of the complaint")
    description: str = Field(..., description="Details")
    urgent: bool = False

class ComplaintResponse(BaseModel):
    id: int
    complaint_type: str
    subject: str
    description: str
    email: EmailStr
    urgent: bool
    status: str
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}
