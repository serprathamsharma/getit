from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    """SQLAlchemy declarative base for all models."""
    pass


async def get_db():
    """Dependency that yields an async database session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


from sqlalchemy import text


async def init_db():
    """Create all tables on startup and auto-migrate missing columns."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Check and add columns if missing
        try:
            res = await conn.execute(text("PRAGMA table_info(resumes)"))
            columns = [row[1] for row in res.fetchall()]
            if columns and "github_username" not in columns:
                await conn.execute(text("ALTER TABLE resumes ADD COLUMN github_username VARCHAR(255)"))
            if columns and "file_data" not in columns:
                await conn.execute(text("ALTER TABLE resumes ADD COLUMN file_data BLOB"))

            res_eng = await conn.execute(text("PRAGMA table_info(engineers)"))
            eng_columns = [row[1] for row in res_eng.fetchall()]
            if eng_columns and "github_created_at" not in eng_columns:
                await conn.execute(text("ALTER TABLE engineers ADD COLUMN github_created_at DATETIME"))
        except Exception as e:
            print("Auto-migration check notice:", e)
