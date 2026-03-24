"""
Startup helpers for estimator feature integration.
"""

from motor.motor_asyncio import AsyncIOMotorDatabase


async def ensure_indexes(db: AsyncIOMotorDatabase) -> None:
    """Create indexes used by estimator history and admin views."""
    collection = db["estimations"]
    await collection.create_index("user_id")
    await collection.create_index("created_at")
    await collection.create_index("updated_at")
    await collection.create_index("user_email")
    await collection.create_index("has_enquiry")
    await collection.create_index("lead_status")
    await collection.create_index("archived")

    guest_verification_collection = db["estimator_guest_email_verifications"]
    await guest_verification_collection.create_index("email", unique=True)
    await guest_verification_collection.create_index("verification_token_hash")
    await guest_verification_collection.create_index("expires_at", expireAfterSeconds=0)
