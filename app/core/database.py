"""
MongoDB Database Connection Module.
Provides async database connection using Motor.
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional

from app.core.config import settings


class Database:
    """
    MongoDB database connection manager.
    Provides singleton connection to MongoDB.
    """
    
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None

    @classmethod
    async def connect(cls) -> None:
        """
        Connect to MongoDB.
        Called on application startup.
        """
        cls.client = AsyncIOMotorClient(settings.MONGODB_URL)
        cls.db = cls.client[settings.MONGODB_DB_NAME]
        
        # Verify connection
        try:
            await cls.client.admin.command("ping")
            print(f"✅ Connected to MongoDB: {settings.MONGODB_DB_NAME}")
        except Exception as e:
            print(f"❌ Failed to connect to MongoDB: {e}")
            raise

    @classmethod
    async def disconnect(cls) -> None:
        """
        Disconnect from MongoDB.
        Called on application shutdown.
        """
        if cls.client:
            cls.client.close()
            print("🔌 Disconnected from MongoDB")

    @classmethod
    def get_db(cls) -> AsyncIOMotorDatabase:
        """
        Get the database instance.
        
        Returns:
            AsyncIOMotorDatabase instance
            
        Raises:
            RuntimeError if not connected
        """
        if cls.db is None:
            raise RuntimeError("Database not connected. Call Database.connect() first.")
        return cls.db

    @classmethod
    def get_collection(cls, name: str):
        """
        Get a collection by name.
        
        Args:
            name: Collection name
            
        Returns:
            AsyncIOMotorCollection instance
        """
        return cls.get_db()[name]


# Convenience function for dependency injection
def get_database() -> AsyncIOMotorDatabase:
    """Get database instance for FastAPI dependency injection."""
    return Database.get_db()
