
import asyncio
from sqlalchemy import select, func
from app.core.database import async_session
from app.models.models import Engineer

async def check():
    async with async_session() as db:
        result = await db.execute(select(Engineer))
        engineers = result.scalars().all()
        print(f"Total engineers in DB: {len(engineers)}")
        for e in engineers:
            print(f"- {e.github_username} (ID: {e.id}, Score: {e.talent_score})")

if __name__ == "__main__":
    asyncio.run(check())

