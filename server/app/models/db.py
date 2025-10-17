from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from ..schema import Base
from ..settings import settings

engine = create_engine(f'sqlite:///{settings.SQLITE_DB_PATH}', echo=False, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False, future=True)
