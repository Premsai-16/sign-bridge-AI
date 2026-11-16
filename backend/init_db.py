from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import DATABASE_URL
from app.models import Base

def init_db():
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    )
    Base.metadata.create_all(engine)
    print(f"Database initialized at {DATABASE_URL}")

if __name__ == "__main__":
    init_db()