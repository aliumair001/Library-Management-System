from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

class MongoDB:
    """MongoDB connection manager."""
    client: AsyncIOMotorClient = None
    database: AsyncIOMotorDatabase = None

mongodb = MongoDB()

async def connect_to_mongo():
    """Initialize MongoDB connection and create indexes."""
    try:
        print(f"\n🔌 Connecting to MongoDB...")
        print(f"   URL: {settings.MONGODB_URL}")
        print(f"   Database: {settings.DATABASE_NAME}")
        
        mongodb.client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            maxPoolSize=10,
            minPoolSize=1,
            serverSelectionTimeoutMS=5000,
        )
        
        mongodb.database = mongodb.client[settings.DATABASE_NAME]
        
        # Test connection
        await mongodb.client.admin.command('ping')
        print(f"Connected to MongoDB: {settings.DATABASE_NAME}\n")
        
        # Create indexes
        await create_indexes()
        print(f"Database indexes created\n")
    
    except Exception as e:
        print(f"\n CRITICAL: Failed to connect to MongoDB!")
        print(f"   Error: {e}")
        print(f"   Make sure MongoDB is running: mongod\n")
        # Don't set to None, raise the error so app doesn't start
        raise RuntimeError(f"MongoDB connection failed: {e}")

async def close_mongo_connection():
    """Close MongoDB connection."""
    if mongodb.client:
        mongodb.client.close()
        print("MongoDB connection closed")

async def create_indexes():
# Users collection
    await mongodb.database.users.create_index("email", unique=True)
    await mongodb.database.users.create_index("is_verified")
    
    # Books collection
    await mongodb.database.books.create_index([
        ("title", "text"),
        ("author", "text"),
        ("genre", "text")
    ])
    await mongodb.database.books.create_index("genre")
    
    # Lendings collection
    await mongodb.database.lendings.create_index("user_id")
    await mongodb.database.lendings.create_index("book_id")
    await mongodb.database.lendings.create_index("status")
    await mongodb.database.lendings.create_index("lend_end_date")
    await mongodb.database.lendings.create_index([("user_id", 1), ("status", 1)])
    
    # OTPs collection (NEW)
    await mongodb.database.otps.create_index("email")
    await mongodb.database.otps.create_index("purpose")
    await mongodb.database.otps.create_index("expires_at")
    await mongodb.database.otps.create_index([
        ("email", 1),
        ("purpose", 1),
        ("is_used", 1)
    ])
    
    # Refresh tokens collection (NEW)
    await mongodb.database.refresh_tokens.create_index("user_id")
    await mongodb.database.refresh_tokens.create_index("token_hash", unique=True)
    await mongodb.database.refresh_tokens.create_index("expires_at")
    await mongodb.database.refresh_tokens.create_index("is_revoked")
    await mongodb.database.refresh_tokens.create_index([
        ("user_id", 1),
        ("is_revoked", 1)
    ])


def get_database() -> AsyncIOMotorDatabase:
    """Dependency injection for database access."""
    return mongodb.database