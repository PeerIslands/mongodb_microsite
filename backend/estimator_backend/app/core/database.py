from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.database import Database as MicrositeDatabase

from estimator_backend.app.core.config import get_settings

settings = get_settings()


class Database:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None


db = Database()


async def connect_to_mongo():
    """Connect to MongoDB."""
    db.client = AsyncIOMotorClient(settings.MONGODB_URL)
    db.db = db.client[settings.MONGODB_DB_NAME]
    print(f"Connected to MongoDB: {settings.MONGODB_DB_NAME}")


async def close_mongo_connection():
    """Close MongoDB connection."""
    db.client.close()
    print("Closed MongoDB connection")


def get_database() -> AsyncIOMotorDatabase:
    """Get database instance.

    When used inside the microsite process, reuse the shared Mongo connection.
    When estimator_backend runs standalone, fall back to its local connection.
    """
    if db.db is not None:
        return db.db
    return MicrositeDatabase.get_db()
