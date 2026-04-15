"""
Dentor FastAPI Application Entry Point
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, test_connection
from . import models
from .routers import auth


# ──────────────────────────── Lifespan (startup / shutdown) ────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: verify SQL Server connection and create tables
    test_connection()
    models.Base.metadata.create_all(bind=engine)
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
# Allows the frontend (running from file:// or a local server) to call the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Restrict to your domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────── Routers ────────────────────────────
app.include_router(auth.router)


# ──────────────────────────── Root ────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "message": "Dentor API is running \u2705",
        "docs": "/docs",
        "version": "1.0.0",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}
