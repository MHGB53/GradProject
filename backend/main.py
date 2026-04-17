"""
Dentor FastAPI Application Entry Point
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse

from .database import engine, test_connection
from . import models
from .routers import auth, community


# ──────────────────────────── Lifespan (startup / shutdown) ────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: verify SQL Server connection and create / migrate tables
    test_connection()
    models.Base.metadata.create_all(bind=engine)
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


# ──────────────────────────── Root → Login page ────────────────────────────
@app.get("/", tags=["Frontend"])
def root():
    """Redirect root to the Login page."""
    return RedirectResponse(url="/html/Login.html")


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}
