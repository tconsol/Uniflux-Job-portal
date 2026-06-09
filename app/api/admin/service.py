from typing import Optional, Dict, Any
from datetime import datetime
import uuid

from app.database import plans_collection, subscriptions_collection, users_collection


async def create_plan(plan_data: Dict[Any, Any]) -> Dict[Any, Any]:
    plans = plans_collection()
    plan = {
        "_id": str(uuid.uuid4()),
        "slug": plan_data["slug"],
        "name": plan_data["name"],
        "job_limit": plan_data["job_limit"],
        "price_monthly": plan_data["price_monthly"],
        "price_yearly": plan_data.get("price_yearly"),
        "stripe_price_id_monthly": plan_data.get("stripe_price_id_monthly"),
        "stripe_price_id_yearly": plan_data.get("stripe_price_id_yearly"),
        "is_active": plan_data.get("is_active", True),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    plans.insert_one(plan)
    return plan


async def get_all_plans() -> list[Dict[Any, Any]]:
    plans = plans_collection()
    return list(plans.find({}))


async def get_plan_by_id(plan_id: str) -> Optional[Dict[Any, Any]]:
    plans = plans_collection()
    return plans.find_one({"_id": plan_id})


async def update_plan(plan_id: str, update_data: Dict[Any, Any]) -> Optional[Dict[Any, Any]]:
    plans = plans_collection()
    update_data["updated_at"] = datetime.utcnow()
    plans.update_one({"_id": plan_id}, {"$set": update_data})
    return plans.find_one({"_id": plan_id})


async def delete_plan(plan_id: str) -> bool:
    plans = plans_collection()
    result = plans.delete_one({"_id": plan_id})
    return result.deleted_count > 0


async def get_all_users() -> list[Dict[Any, Any]]:
    users = users_collection()
    return list(users.find({}))


async def update_user_subscription(user_id: str, plan_slug: str, status: str = "active") -> bool:
    subscriptions = subscriptions_collection()
    subscription = subscriptions.find_one({"user_id": user_id, "status": "active"})
    if subscription:
        subscriptions.update_one(
            {"_id": subscription["_id"]},
            {"$set": {"plan": plan_slug, "status": status, "updated_at": datetime.utcnow()}}
        )
    else:
        subscriptions.insert_one({
            "_id": str(uuid.uuid4()),
            "user_id": user_id,
            "stripe_customer_id": None,
            "stripe_subscription_id": None,
            "plan": plan_slug,
            "status": status,
            "current_period_start": datetime.utcnow(),
            "current_period_end": datetime.utcnow(),
            "auto_renew": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
    return True