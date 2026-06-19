"""
Database configuration.

Two modes, chosen automatically:

  1. PRODUCTION (Render / any host that provides DATABASE_URL)
     - Set the DATABASE_URL environment variable (Render does this automatically
       when you attach a PostgreSQL instance). Requires psycopg2-binary.

  2. LOCAL DEVELOPMENT (SQL Server / SSMS)
     - Leave DATABASE_URL unset. Connection is built from DB_SERVER / DB_NAME /
       DB_USER / DB_PASSWORD. Requires the Microsoft ODBC Driver 17/18 + pyodbc.
       - SQL Server Authentication -> set DB_USER and DB_PASSWORD
       - Windows Authentication    -> leave DB_USER and DB_PASSWORD blank
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Load variables from .env file (only matters locally; ignored if file is absent)
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")

DB_SERVER   = os.getenv("DB_SERVER", r"localhost\SQLEXPRESS")
DB_NAME     = os.getenv("DB_NAME",   "DentorDB")
DB_USER     = os.getenv("DB_USER",   "")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")


def _detect_driver() -> str:
    """
    Auto-detect the best available SQL Server ODBC driver installed on this machine.
    Prefers newer drivers (18 > 17 > legacy). Only called in local SQL Server mode.
    """
    import pyodbc  # imported lazily so production (Postgres) never needs it

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


def _build_sqlserver_url() -> str:
    """
    Build the SQLAlchemy connection URL for local SQL Server.
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


def _resolve_database_url() -> str:
    """
    Prefer DATABASE_URL (production/Render Postgres). Fall back to SQL Server locally.
    """
    if DATABASE_URL:
        url = DATABASE_URL
        # SQLAlchemy needs the "postgresql://" scheme; Render hands out "postgres://".
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        print("[DB] Using DATABASE_URL (PostgreSQL)")
        return url
    return _build_sqlserver_url()


_RESOLVED_URL = _resolve_database_url()
_IS_POSTGRES = _RESOLVED_URL.startswith("postgresql")

engine = create_engine(
    _RESOLVED_URL,
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
    """Utility to verify the database connection at startup."""
    backend = "PostgreSQL" if _IS_POSTGRES else "SQL Server"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print(f"[DB] Connected to {backend}")
    except Exception as exc:
        print(f"[DB] ERROR - Could not connect to {backend}: {exc}")
        raise
