"""
Pydantic schemas for request/response validation.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
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
    full_name: Optional[str]
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
    liked_at: Optional[datetime]

    model_config = {"from_attributes": True}


class PaginatedPostsOut(BaseModel):
    posts: List[PostOut]
    total: int
    page: int
    page_size: int
    has_more: bool
