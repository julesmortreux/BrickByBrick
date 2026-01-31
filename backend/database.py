"""
Database configuration - Production Ready
Supports both SQLite (dev) and PostgreSQL (production)
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Database URL - Use PostgreSQL in production, SQLite for local dev
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./brickbybrick.db"  # Default to SQLite for local development
)

# Handle Heroku/Railway PostgreSQL URL format
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create engine with appropriate settings
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}  # SQLite specific
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,  # Verify connections before using
        pool_size=5,
        max_overflow=10
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables"""
    from models import User, UserPreferences  # Import here to avoid circular imports
    Base.metadata.create_all(bind=engine)
    print("[OK] Database tables created successfully")
