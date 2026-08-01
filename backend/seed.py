import asyncio
import logging
from app.core.database import init_db, async_session
from app.services.analyzer import analyzer_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def seed_data():
    logger.info("Initializing database...")
    await init_db()
    
    users_to_seed = ["torvalds", "gaearon", "sindresorhus", "tj", "antfu"]
    
    async with async_session() as session:
        for username in users_to_seed:
            logger.info(f"Seeding profile for: {username}")
            try:
                engineer = await analyzer_service.analyze_engineer(username, session)
                if engineer:
                    await session.commit()
                    logger.info(f"Successfully seeded {username} (Score: {engineer.talent_score})")
                else:
                    logger.warning(f"Failed to seed {username}")
            except Exception as e:
                logger.error(f"Error seeding {username}: {e}")

if __name__ == "__main__":
    asyncio.run(seed_data())
