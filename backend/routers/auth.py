"""
Authentication router: /api/auth endpoints.

Endpoints:
  POST /api/auth/register  - Create a new user account
  POST /api/auth/login     - Authenticate and receive a JWT token
  POST /api/auth/logout    - Invalidate session (client-side token removal)
  GET  /api/auth/me        - Get current authenticated user info
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import RegisterRequest, LoginRequest, TokenResponse, UserOut, MessageResponse
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
