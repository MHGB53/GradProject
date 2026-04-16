"""
Dentor FastAPI Application Entry Point
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import engine, test_connection
from . import models
from .routers import auth, community


# ──────────────────────────── Lifespan (startup / shutdown) ────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: verify SQL Server connection and create / migrate tables
    test_connection()
    models.Base.metadata.create_all(bind=engine)
    # Ensure upload directory exists
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "community")
    os.makedirs(upload_dir, exist_ok=True)
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

# ──────────────────────────── Static Files (uploaded media) ────────────────────────────
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# ──────────────────────────── Routers ────────────────────────────
app.include_router(auth.router)
app.include_router(community.router)


# ──────────────────────────── Root ────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "message": "Dentor API is running ✅",
        "docs": "/docs",
        "version": "1.0.0",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}
