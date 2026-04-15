"""
Database configuration for SQL Server (SSMS).
Reads connection settings from the .env file in the project root.

Supported connection modes:
  1. SQL Server Authentication  -> set DB_USER and DB_PASSWORD in .env
  2. Windows Authentication     -> leave DB_USER and DB_PASSWORD blank in .env

Requirements:
  - Microsoft ODBC Driver 17 (or 18) for SQL Server must be installed.
    Download: https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server
  - The database (DB_NAME) must already exist in your SQL Server instance.
    Create it in SSMS with: CREATE DATABASE DentorDB;
"""

import os
import pyodbc
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Load variables from .env file
load_dotenv()

DB_SERVER   = os.getenv("DB_SERVER", r"localhost\SQLEXPRESS")
DB_NAME     = os.getenv("DB_NAME",   "DentorDB")
DB_USER     = os.getenv("DB_USER",   "")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")


def _detect_driver() -> str:
    """
    Auto-detect the best available SQL Server ODBC driver installed on this machine.
    Prefers newer drivers (18 > 17 > legacy).
    """
    preferred = [
        "ODBC Driver 18 for SQL Server",
        "ODBC Driver 17 for SQL Server",
        "ODBC Driver 13 for SQL Server",
        "SQL Server Native Client 11.0",
        "SQL Server",
    ]
    installed = pyodbc.drivers()
    for driver in preferred:
        if driver in installed:
            print(f"[DB] Using ODBC driver: {driver}")
            return driver
    raise RuntimeError(
        f"No compatible SQL Server ODBC driver found.\n"
        f"Installed drivers: {installed}\n"
        f"Download from: https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server"
    )


def _build_connection_string() -> str:
    """
    Build the SQLAlchemy connection URL for SQL Server.
    Uses Windows Auth if DB_USER is not set, otherwise SQL Server Auth.
    """
    driver = _detect_driver()
    driver_encoded = driver.replace(" ", "+")

    if DB_USER and DB_PASSWORD:
        # SQL Server Authentication
        return (
            f"mssql+pyodbc://{DB_USER}:{DB_PASSWORD}@{DB_SERVER}/{DB_NAME}"
            f"?driver={driver_encoded}&TrustServerCertificate=yes"
        )
    else:
        # Windows Authentication (Trusted Connection)
        return (
            f"mssql+pyodbc://@{DB_SERVER}/{DB_NAME}"
            f"?driver={driver_encoded}"
            f"&trusted_connection=yes"
            f"&TrustServerCertificate=yes"
        )


DATABASE_URL = _build_connection_string()

engine = create_engine(
    DATABASE_URL,
    echo=False,           # Set True to log every SQL statement (useful for debugging)
    pool_pre_ping=True,   # Check connection health before each request
    pool_size=5,
    max_overflow=10,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency: provides one DB session per request, auto-closed after."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_connection():
    """Utility to verify the SQL Server connection at startup."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print(f"[DB] Connected to SQL Server -> {DB_SERVER}/{DB_NAME}")
    except Exception as exc:
        print(f"[DB] ERROR - Could not connect to SQL Server: {exc}")
        raise
