from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./signbridge.db")

# SQLite is for local development. Production should use PostgreSQL with
# a bounded per-worker pool; total pool capacity must fit the database limit.
pool_options = {} if DATABASE_URL.startswith('sqlite') else {
    'pool_size': int(os.getenv('DB_POOL_SIZE', '5')),
    'max_overflow': int(os.getenv('DB_MAX_OVERFLOW', '5')),
    'pool_timeout': 15,
    'pool_recycle': 1800,
}
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    **pool_options,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)