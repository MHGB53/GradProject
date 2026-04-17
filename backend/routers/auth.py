"""
Authentication router: /api/auth endpoints.

Endpoints:
  POST /api/auth/register  - Create a new user account
  POST /api/auth/login     - Authenticate and receive a JWT token
  POST /api/auth/logout    - Invalidate session (client-side token removal)
  GET  /api/auth/me        - Get current authenticated user info
"""

import os
import uuid
import resend
import random
import string
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, PasswordReset
from ..schemas import (
    RegisterRequest, LoginRequest, TokenResponse, UserOut, MessageResponse,
    ForgotPasswordRequest, VerifyOTPRequest, ResetPasswordRequest, VerifyOTPResponse, ChangePasswordRequest
)
from ..security import hash_password, verify_password, create_access_token, decode_access_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
bearer_scheme = HTTPBearer()


# ──────────────────────────── Dependency ────────────────────────────

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency that extracts and validates the JWT from the Authorization header.
    Raises 401 if token is missing, expired, or invalid.
    """
    token = credentials.credentials
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: int = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is malformed.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or account deactivated.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


# ──────────────────────────── Endpoints ────────────────────────────

@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """
    Create a new Dentor account.

    - **username**: Unique, 3–50 characters
    - **email**: Must be a valid email address (unique)
    - **full_name**: Optional display name
    - **password**: Minimum 8 characters (stored as bcrypt hash)

    Returns a JWT access token immediately so the user is logged in after registration.
    """
    # Check for existing username
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username is already taken. Please choose a different one.",
        )

    # Check for existing email
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # Create user
    new_user = User(
        username=payload.username,
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Issue token
    token = create_access_token(data={"sub": str(new_user.id)})

    return TokenResponse(
        access_token=token,
        user=UserOut.model_validate(new_user),
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login with username and password",
)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate an existing user.

    - **username**: The account username (email login not supported here, only username)
    - **password**: The account password

    Returns a JWT access token valid for 24 hours.
    """
    user = db.query(User).filter(User.username == payload.username).first()

    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact support.",
        )

    token = create_access_token(data={"sub": str(user.id)})

    return TokenResponse(
        access_token=token,
        user=UserOut.model_validate(user),
    )
@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Logout the current user",
)
def logout(_current_user: User = Depends(get_current_user)):
    """
    Logout endpoint.

    JWT tokens are stateless — this endpoint validates the token is still good,
    then instructs the client to discard it. For server-side invalidation
    (token blocklist), see the future Redis integration plan.
    """
    return MessageResponse(message="Logged out successfully. See you next time!")




# ──────────────────────────── Password Reset ────────────────────────────

@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    summary="Request a password reset OTP",
)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Initiate the password reset process by generating an OTP and emailing it to the user.
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        # Prevent email enumeration by always returning generic success
        return MessageResponse(message="If that email is registered, you will receive an OTP shortly.")

    # Generate 6-digit OTP
    otp = ''.join(random.choices(string.digits, k=6))
    expires_at = datetime.utcnow() + timedelta(minutes=15)

    # Delete any existing OTPs for this email to invalidate them
    db.query(PasswordReset).filter(PasswordReset.email == payload.email).delete()

    reset_entry = PasswordReset(
        email=payload.email,
        otp=otp,
        expires_at=expires_at
    )
    db.add(reset_entry)
    db.commit()

    # Send email via Resend
    resend.api_key = os.getenv("RESEND_API_KEY")
    if resend.api_key:
        try:
            resend.Emails.send({
                "from": "Dentor <onboarding@resend.dev>",
                "to": payload.email,
                "subject": "Dentor - Password Reset OTP",
                "html": f"<p>Your password reset OTP is: <strong>{otp}</strong></p><p>This code will expire in 15 minutes.</p>"
            })
        except Exception as e:
            print(f"Error sending email: {e}")
            # Could fail silently or log it

    return MessageResponse(message="If that email is registered, you will receive an OTP shortly.")


@router.post(
    "/verify-otp",
    response_model=VerifyOTPResponse,
    summary="Verify the OTP and return a reset token",
)
def verify_otp(payload: VerifyOTPRequest, db: Session = Depends(get_db)):
    """
    Verify the 6-digit OTP code sent to the email. Returns a reset token for the final step.
    """
    reset_entry = db.query(PasswordReset).filter(
        PasswordReset.email == payload.email,
        PasswordReset.otp == payload.otp
    ).first()

    if not reset_entry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP."
        )

    db_expires_at = reset_entry.expires_at.replace(tzinfo=None) if reset_entry.expires_at.tzinfo else reset_entry.expires_at
    if db_expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired."
        )

    # Generate a secure reset token
    reset_token = ''.join(random.choices(string.ascii_letters + string.digits, k=32))
    reset_entry.reset_token = reset_token
    # Extend expiry slightly for them to enter the new password
    reset_entry.expires_at = datetime.utcnow() + timedelta(minutes=15)
    db.commit()

    return VerifyOTPResponse(message="OTP verified.", reset_token=reset_token)

@router.post(
    "/reset-password",
    response_model=MessageResponse,
    summary="Reset the password using the reset token",
)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Complete the password reset process by providing the new password and the reset token.
    """
    reset_entry = db.query(PasswordReset).filter(
        PasswordReset.email == payload.email,
        PasswordReset.reset_token == payload.reset_token
    ).first()

    if not reset_entry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token."
        )

    db_expires_at = reset_entry.expires_at.replace(tzinfo=None) if reset_entry.expires_at.tzinfo else reset_entry.expires_at
    if db_expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired."
        )

    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    user.hashed_password = hash_password(payload.new_password)
    db.query(PasswordReset).filter(PasswordReset.email == payload.email).delete()
    db.commit()

    return MessageResponse(message="Password reset successfully.")


@router.post(
    "/change-password",
    response_model=MessageResponse,
    summary="Change the current user's password securely",
)
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Allow an authentically logged-in user to change their password providing their old one is valid.
    """
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()
    db.refresh(current_user)
    
    return MessageResponse(message="Password changed successfully")

@router.post("/upload-photo", response_model=UserOut)
async def upload_profile_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a profile photo. Replaces any existing photo.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'png'
    new_filename = f"{uuid.uuid4().hex}.{file_extension}"
    
    profiles_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "profiles")
    os.makedirs(profiles_dir, exist_ok=True)
    
    file_path = os.path.join(profiles_dir, new_filename)
    
    # Save the file
    try:
        content = await file.read()
        with open(file_path, "wb") as buffer:
            buffer.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")
        
    # Relative path to serve to frontend
    static_url = f"/uploads/profiles/{new_filename}"
    
    # Delete old profile photo if it exists to cleanly save space
    if current_user.profile_photo and current_user.profile_photo.startswith("/uploads/profiles/"):
        old_file_name = current_user.profile_photo.split("/")[-1]
        old_file_path = os.path.join(profiles_dir, old_file_name)
        if os.path.exists(old_file_path):
            try:
                os.remove(old_file_path)
            except Exception:
                pass
                
    current_user.profile_photo = static_url
    db.commit()
    db.refresh(current_user)
    
    return UserOut.model_validate(current_user)


@router.get(
    "/me",
    response_model=UserOut,
    summary="Get current user profile",
)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Return the authenticated user's profile data.
    Requires a valid Bearer token in the Authorization header.
    """
    return UserOut.model_validate(current_user)
