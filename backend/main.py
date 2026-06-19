"""
Dentor FastAPI Application Entry Point
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse

from .database import engine, test_connection, _IS_POSTGRES
from . import models
from .routers import auth, community, chatbot, flashcards, support, smartstudy, leaderboard, ai_diagnosis, ai_proxy, exams


# ──────────────────────────── Schema migrations (idempotent) ────────────────────────────

def _run_migrations():
    """
    Apply any missing column/table changes that SQLAlchemy's create_all() skips
    (create_all only adds new tables, never new columns to existing ones).
    Safe to call on every startup — each block checks before altering.

    NOTE: these statements use SQL Server (T-SQL) syntax and only patch a
    pre-existing local SQL Server database. On PostgreSQL (Render) a fresh
    database is created by create_all() with every column already present in
    models.py, so this is skipped entirely.
    """
    if _IS_POSTGRES:
        return

    from sqlalchemy import inspect as sa_inspect, text
    inspector = sa_inspect(engine)

    # ── study_plan_entries.is_completed  (added in v2) ──────────────
    entry_cols = [c["name"] for c in inspector.get_columns("study_plan_entries")]
    if "is_completed" not in entry_cols:
        with engine.begin() as conn:
            conn.execute(text(
                "ALTER TABLE study_plan_entries ADD is_completed BIT NOT NULL DEFAULT 0"
            ))
        print("[Migration] Added study_plan_entries.is_completed column.")

    # ── Convert user-text columns to NVARCHAR so Arabic isn't stored as "????" ──
    table_names = inspector.get_table_names()
    unicode_cols = [
        ("posts",            "content",   "NVARCHAR(MAX)", "NULL"),
        ("post_comments",    "content",   "NVARCHAR(MAX)", "NOT NULL"),
        ("post_attachments", "file_name", "NVARCHAR(255)", "NOT NULL"),
        ("chat_sessions",    "title",     "NVARCHAR(100)", "NOT NULL"),
        ("chat_messages",    "content",   "NVARCHAR(MAX)", "NOT NULL"),
    ]
    for table, col, type_sql, null_sql in unicode_cols:
        if table not in table_names:
            continue
        with engine.begin() as conn:
            data_type = conn.execute(text(
                "SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS "
                "WHERE TABLE_NAME = :t AND COLUMN_NAME = :c"
            ), {"t": table, "c": col}).scalar()
            if data_type and data_type.lower() in ("varchar", "char", "text"):
                conn.execute(text(
                    f"ALTER TABLE {table} ALTER COLUMN {col} {type_sql} {null_sql}"
                ))
                print(f"[Migration] Converted {table}.{col} to {type_sql} (Unicode).")

    # ── users identity/verification columns (added in v3) ──────────
    if "users" in table_names:
        user_cols = [c["name"] for c in inspector.get_columns("users")]
        # Verification flags default to 1 so EXISTING users (registered before this
        # feature) stay verified and are not locked out. New users created by the app
        # explicitly pass False, so the default only affects the backfill.
        new_user_cols = [
            ("student_id",           "student_id NVARCHAR(8) NULL"),
            ("phone_number",         "phone_number NVARCHAR(20) NULL"),
            ("email_verified",       "email_verified BIT NOT NULL DEFAULT 1"),
            ("phone_verified",       "phone_verified BIT NOT NULL DEFAULT 1"),
            ("verification_token",   "verification_token NVARCHAR(64) NULL"),
            ("verification_expires", "verification_expires DATETIMEOFFSET NULL"),
            ("phone_otp",            "phone_otp NVARCHAR(10) NULL"),
            ("phone_otp_expires",    "phone_otp_expires DATETIMEOFFSET NULL"),
        ]
        for col_name, col_sql in new_user_cols:
            if col_name not in user_cols:
                with engine.begin() as conn:
                    conn.execute(text(f"ALTER TABLE users ADD {col_sql}"))
                print(f"[Migration] Added users.{col_name} column.")

    # ── exam_results extra columns (time + full content for review) ──
    if "exam_results" in inspector.get_table_names():
        exam_cols = [c["name"] for c in inspector.get_columns("exam_results")]
        for col_name, col_sql in (
            ("time_taken",     "time_taken INT NULL"),
            ("questions_json", "questions_json NVARCHAR(MAX) NULL"),
            ("answers_json",   "answers_json NVARCHAR(MAX) NULL"),
        ):
            if col_name not in exam_cols:
                with engine.begin() as conn:
                    conn.execute(text(f"ALTER TABLE exam_results ADD {col_sql}"))
                print(f"[Migration] Added exam_results.{col_name} column.")


# ──────────────────────────── Lifespan (startup / shutdown) ────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: verify SQL Server connection and create / migrate tables
    test_connection()
    models.Base.metadata.create_all(bind=engine)
    _run_migrations()   # safe column-level migrations
    # Ensure upload directories exist
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "community")
    profiles_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "profiles")
    os.makedirs(upload_dir, exist_ok=True)
    os.makedirs(profiles_dir, exist_ok=True)
    yield
    # Shutdown: nothing special needed



# ──────────────────────────── App Setup ────────────────────────────
app = FastAPI(
    title="Dentor API",
    description="Backend API for the Dentor dental student learning platform.",
    version="1.0.0",
    docs_url="/docs",       # Swagger UI
    redoc_url="/redoc",     # ReDoc UI
    lifespan=lifespan,
)

# ──────────────────────────── CORS ────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Restrict to your domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────── No-cache for frontend assets ────────────────────────────
# The browser aggressively caches /js and /html, which makes code edits appear
# "not applied" until a manual hard-refresh. Force revalidation on every request
# so the latest HTML/JS/CSS is always served during development.
@app.middleware("http")
async def _no_cache_frontend(request, call_next):
    response = await call_next(request)
    if request.url.path.startswith(("/js", "/css", "/html")):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response


# ──────────────────────────── Project root for static folders ────────────────────────────
ROOT_DIR = os.path.dirname(os.path.dirname(__file__))

# ──────────────────────────── Static Files (uploaded media) ────────────────────────────
uploads_dir = os.path.join(ROOT_DIR, "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# ──────────────────────────── Frontend Static Files ────────────────────────────
app.mount("/html",   StaticFiles(directory=os.path.join(ROOT_DIR, "html")),   name="html")
app.mount("/css",    StaticFiles(directory=os.path.join(ROOT_DIR, "css")),    name="css")
app.mount("/js",     StaticFiles(directory=os.path.join(ROOT_DIR, "js")),     name="js")
app.mount("/assets", StaticFiles(directory=os.path.join(ROOT_DIR, "assets")), name="assets")

# ──────────────────────────── Routers ────────────────────────────
app.include_router(auth.router)
app.include_router(community.router)
app.include_router(chatbot.router)
app.include_router(flashcards.router)
app.include_router(support.router)
app.include_router(smartstudy.router)
app.include_router(leaderboard.router)
app.include_router(ai_diagnosis.router)
app.include_router(ai_proxy.router)
app.include_router(exams.router)

# ──────────────────────────── Root → Login page ────────────────────────────
@app.get("/", tags=["Frontend"])
def root():
    """Redirect root to the Login page."""
    return RedirectResponse(url="/html/Home.html")


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}
