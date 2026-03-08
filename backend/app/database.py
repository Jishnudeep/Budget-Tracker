import motor.motor_asyncio
from app.config import MONGODB_URI, DATABASE_NAME

client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URI)
db = client[DATABASE_NAME]

# Collections
users_collection = db["users"]
budgets_collection = db["budgets"]
expenses_collection = db["expenses"]
goals_collection = db["goals"]


async def create_indexes():
    """Create database indexes for performance."""
    await users_collection.create_index("email", unique=True)
    await expenses_collection.create_index([("user_id", 1), ("date", -1)])
    await expenses_collection.create_index([("user_id", 1), ("category", 1)])
    await budgets_collection.create_index([("user_id", 1), ("month", 1)], unique=True)
    await goals_collection.create_index("user_id")
