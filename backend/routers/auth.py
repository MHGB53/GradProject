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
import random
import string
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Request
from fastapi.responses import HTMLResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, PasswordReset
from ..schemas import (
    RegisterRequest, LoginRequest, TokenResponse, UserOut, MessageResponse,
    ForgotPasswordRequest, VerifyOTPRequest, ResetPasswordRequest, VerifyOTPResponse, ChangePasswordRequest,
    VerifyPhoneRequest, ResendVerificationRequest, PendingVerificationResponse
)
from ..security import hash_password, verify_password, create_access_token, decode_access_token
from ..notifications import (
    send_sms, send_email, sms_provider_configured,
    render_email, email_button, email_otp_box, BRAND_PRIMARY,
)

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


# ──────────────────────────── Verification helpers ────────────────────────────

def _issue_email_verification(user: User, request: Request) -> None:
    """Generate an activation token, store it on the user, and email the link."""
    token = uuid.uuid4().hex + uuid.uuid4().hex  # 64 chars
    user.verification_token = token
    user.verification_expires = datetime.utcnow() + timedelta(hours=24)

    # Build an absolute link back to this API's activation endpoint.
    base = str(request.base_url).rstrip("/")
    activation_link = f"{base}/api/auth/verify-email?token={token}"

    send_email(
        to_email=user.email,
        subject="Activate your Dentor account",
        html=render_email(
            heading=f"Welcome, {user.full_name or user.username}!",
            body_html=(
                "<p style='margin:0;font-size:15px;line-height:1.6;color:#4b5563;'>"
                "Thanks for signing up. Please confirm your university email to activate your account."
                "</p>"
                + email_button("Activate my account", activation_link)
                + "<p style='margin:8px 0 0;font-size:13px;line-height:1.6;color:#9ca3af;'>"
                "This link expires in 24 hours. If the button doesn't work, copy this link into your browser:<br>"
                f"<a href='{activation_link}' style='color:{BRAND_PRIMARY};word-break:break-all;'>{activation_link}</a>"
                "</p>"
            ),
        ),
    )


def _issue_phone_otp(user: User) -> str:
    """Generate a 6-digit SMS OTP, store it on the user, and send it. Returns the OTP."""
    otp = ''.join(random.choices(string.digits, k=6))
    user.phone_otp = otp
    user.phone_otp_expires = datetime.utcnow() + timedelta(minutes=15)

    send_sms(
        to_number=user.phone_number,
        body=f"Your Dentor verification code is {otp}. It expires in 15 minutes.",
    )
    return otp


# ──────────────────────────── Endpoints ────────────────────────────

@router.post(
    "/register",
    response_model=PendingVerificationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new university account (requires email + phone verification)",
)
def register(payload: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    """
    Create a new Dentor account for a university student.

    - **username**: Unique, 3–50 characters
    - **email**: Must be `<student_id>.Name@acu.edu.eg` (validated against student_id)
    - **student_id**: 8 digits starting with 4
    - **phone_number**: receives the SMS OTP
    - **password**: Minimum 8 characters (stored as bcrypt hash)

    The account is created INACTIVE. An activation link is emailed and a 6-digit
    OTP is sent by SMS. The user can only log in after BOTH are verified.
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

    # Check for existing student ID
    if db.query(User).filter(User.student_id == payload.student_id).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this student ID already exists.",
        )

    # Create user — inactive until both email and phone are verified
    new_user = User(
        username=payload.username,
        email=str(payload.email),
        full_name=payload.full_name,
        student_id=payload.student_id,
        phone_number=payload.phone_number,
        hashed_password=hash_password(payload.password),
        is_active=True,            # admin-level switch; login is gated on the flags below
        email_verified=False,
        phone_verified=False,
    )
    db.add(new_user)
    db.flush()  # assign PK before issuing tokens

    _issue_email_verification(new_user, request)
    otp = _issue_phone_otp(new_user)

    db.commit()
    db.refresh(new_user)

    # In dev mode (no SMS provider) we return the OTP so the flow stays testable.
    dev_otp = None if sms_provider_configured() else otp

    return PendingVerificationResponse(
        message="Account created. Check your email for the activation link and enter the SMS code to finish.",
        email=new_user.email,
        email_verified=False,
        phone_verified=False,
        dev_otp=dev_otp,
    )


@router.get(
    "/verify-email",
    response_class=HTMLResponse,
    summary="Activate an account via the emailed link",
)
def verify_email(token: str, db: Session = Depends(get_db)):
    """
    Endpoint hit when the user clicks the activation link in their email.
    Marks the email as verified and returns a small confirmation page.
    """
    user = db.query(User).filter(User.verification_token == token).first()

    def _page(title: str, message: str, ok: bool) -> HTMLResponse:
        color = "#50d3a7" if ok else "#e25555"
        html = f"""<!DOCTYPE html><html><head><meta charset="utf-8">
        <title>Dentor</title>
        <style>
          body{{font-family:Inter,Arial,sans-serif;background:#f6f8f7;display:flex;
               align-items:center;justify-content:center;min-height:100vh;margin:0}}
          .card{{background:#fff;padding:40px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.08);
                 text-align:center;max-width:420px}}
          h1{{color:{color};margin:0 0 12px}}
          p{{color:#555}}
          a{{display:inline-block;margin-top:20px;background:#50d3a7;color:#000;text-decoration:none;
             padding:12px 24px;border-radius:8px;font-weight:600}}
        </style></head>
        <body><div class="card"><h1>{title}</h1><p>{message}</p>
        <a href="/html/Verify.html?email={user.email if user else ''}">Continue</a></div></body></html>"""
        return HTMLResponse(content=html)

    if not user:
        return _page("Invalid link", "This activation link is not valid.", ok=False)

    if user.email_verified:
        return _page("Already activated", "Your email is already verified. You can finish phone verification.", ok=True)

    expires = user.verification_expires
    if expires is not None:
        expires = expires.replace(tzinfo=None) if expires.tzinfo else expires
    if expires is None or expires < datetime.utcnow():
        return _page("Link expired", "This activation link has expired. Please request a new one.", ok=False)

    user.email_verified = True
    user.verification_token = None
    user.verification_expires = None
    db.commit()

    return _page(
        "Email verified!",
        "Your university email is confirmed. Now enter the SMS code to finish activating your account.",
        ok=True,
    )


@router.post(
    "/verify-phone",
    response_model=MessageResponse,
    summary="Verify the phone number using the SMS OTP",
)
def verify_phone(payload: VerifyPhoneRequest, db: Session = Depends(get_db)):
    """Confirm the 6-digit SMS code to mark the phone number as verified."""
    user = db.query(User).filter(User.email == str(payload.email)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found.")

    if user.phone_verified:
        return MessageResponse(message="Phone number already verified.")

    if not user.phone_otp or user.phone_otp != payload.otp:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification code.")

    expires = user.phone_otp_expires
    if expires is not None:
        expires = expires.replace(tzinfo=None) if expires.tzinfo else expires
    if expires is None or expires < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification code has expired. Please request a new one.")

    user.phone_verified = True
    user.phone_otp = None
    user.phone_otp_expires = None
    db.commit()

    return MessageResponse(message="Phone number verified successfully.")


@router.post(
    "/resend-verification",
    response_model=PendingVerificationResponse,
    summary="Resend the email link and/or SMS code",
)
def resend_verification(payload: ResendVerificationRequest, request: Request, db: Session = Depends(get_db)):
    """Re-issue whichever verification step is still pending for an account."""
    user = db.query(User).filter(User.email == str(payload.email)).first()
    if not user:
        # Avoid account enumeration
        return PendingVerificationResponse(
            message="If that account exists and is unverified, new codes have been sent.",
            email=str(payload.email), email_verified=False, phone_verified=False,
        )

    otp = None
    if not user.email_verified:
        _issue_email_verification(user, request)
    if not user.phone_verified:
        otp = _issue_phone_otp(user)

    db.commit()
    db.refresh(user)

    dev_otp = None if (sms_provider_configured() or otp is None) else otp
    return PendingVerificationResponse(
        message="Verification re-sent. Check your email and phone.",
        email=user.email,
        email_verified=user.email_verified,
        phone_verified=user.phone_verified,
        dev_otp=dev_otp,
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

    # Identity verification gate (university account check)
    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please activate your account using the link sent to your university email.",
        )
    if not user.phone_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your phone number with the SMS code to finish activating your account.",
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

    # Send the branded reset email
    send_email(
        to_email=payload.email,
        subject="Your Dentor password reset code",
        html=render_email(
            heading="Password reset code",
            body_html=(
                "<p style='margin:0;font-size:15px;line-height:1.6;color:#4b5563;'>"
                "Use the code below to reset your password. It expires in 15 minutes."
                "</p>"
                + email_otp_box(otp)
                + "<p style='margin:8px 0 0;font-size:13px;line-height:1.6;color:#9ca3af;'>"
                "If you didn't request a reset, ignore this email and your password stays the same."
                "</p>"
            ),
        ),
    )

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
