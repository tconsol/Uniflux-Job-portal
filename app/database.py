from pymongo import MongoClient
from typing import Optional

from app.config import settings


class Database:
    client: Optional[MongoClient] = None
    db: Optional[object] = None

    @classmethod
    async def connect(cls):
        cls.client = MongoClient(settings.MONGO_URI)
        cls.db = cls.client[settings.MONGO_DB_NAME]

    @classmethod
    async def close(cls):
        if cls.client:
            cls.client.close()

    @classmethod
    def get_collection(cls, collection_name: str):
        if cls.db is None:
            raise Exception("Database not connected")
        return cls.db[collection_name]


def users_collection():
    return Database.get_collection("users")


def subscriptions_collection():
    return Database.get_collection("subscriptions")


def plans_collection():
    return Database.get_collection("plans")


def jobs_collection():
    return Database.get_collection("jobs")


def daily_job_sets_collection():
    return Database.get_collection("daily_job_sets")


def auth_tokens_collection():
    return Database.get_collection("auth_tokens")


async def init_db():
    await Database.connect()
    users = users_collection()
    subscriptions = subscriptions_collection()
    plans = plans_collection()
    jobs = jobs_collection()
    daily_job_sets = daily_job_sets_collection()
    auth_tokens = auth_tokens_collection()

    users.create_index("email", unique=True)
    users.create_index("google_oauth_id", unique=True, sparse=True)
    subscriptions.create_index("user_id")
    subscriptions.create_index("stripe_customer_id", unique=True)
    subscriptions.create_index("stripe_subscription_id")
    plans.create_index("slug", unique=True)
    jobs.create_index("external_job_id", unique=True)
    jobs.create_index("is_active")
    jobs.create_index("location")
    jobs.create_index("job_type")
    daily_job_sets.create_index([("date", 1), ("plan", 1)], unique=True)
    auth_tokens.create_index("user_id")
    auth_tokens.create_index("expires_at")
    auth_tokens.create_index("token_hash", unique=True)

    if plans.count_documents({}) == 0:
        plans.insert_many([
            {"slug": "basic", "name": "Basic", "job_limit": 10, "price_monthly": 9.99, "price_yearly": None, "stripe_price_id_monthly": None, "stripe_price_id_yearly": None, "is_active": True},
            {"slug": "standard", "name": "Standard", "job_limit": 100, "price_monthly": 29.99, "price_yearly": None, "stripe_price_id_monthly": None, "stripe_price_id_yearly": None, "is_active": True},
            {"slug": "premium", "name": "Premium", "job_limit": 1000, "price_monthly": 59.99, "price_yearly": None, "stripe_price_id_monthly": None, "stripe_price_id_yearly": None, "is_active": True},
            {"slug": "elite", "name": "Elite", "job_limit": -1, "price_monthly": 99.99, "price_yearly": None, "stripe_price_id_monthly": None, "stripe_price_id_yearly": None, "is_active": True},
        ])


async def close_db():
    await Database.close()