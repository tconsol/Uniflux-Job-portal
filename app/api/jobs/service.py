from typing import Optional, Dict, Any
from datetime import datetime
import uuid
import stripe

from app.database import subscriptions_collection, plans_collection, users_collection
from app.api.jobs.service import generate_daily_job_set

stripe.api_key = "YOUR_STRIPE_API_KEY"


async def get_all_plans() -> list[Dict[Any, Any]]:
    plans = plans_collection()
    return list(plans.find({"is_active": True}))


async def get_plan_by_slug(slug: str) -> Optional[Dict[Any, Any]]:
    plans = plans_collection()
    return plans.find_one({"slug": slug})


async def create_stripe_checkout_session(user_id: str, plan_slug: str, success_url: str, cancel_url: str) -> tuple[str, str]:
    plan = await get_plan_by_slug(plan_slug)
    if plan is None:
        raise Exception(f"Plan not found: {plan_slug}")

    users = users_collection()
    user = users.find_one({"_id": user_id})
    stripe_customer_id = user.get("stripe_customer_id")

    if not stripe_customer_id:
        customer = stripe.Customer.create(email=user["email"], name=user["name"], metadata={"user_id": user_id})
        stripe_customer_id = customer.id
        users.update_one({"_id": user_id}, {"$set": {"stripe_customer_id": stripe_customer_id}})

    session = stripe.Checkout.Session.create(customer=stripe_customer_id, payment_method_types=["card"], line_items=[{"price": plan.get("stripe_price_id_monthly"), "quantity": 1}], mode="subscription", success_url=success_url, cancel_url=cancel_url, metadata={"user_id": user_id, "plan_slug": plan_slug})
    return session.url, session.id


async def create_stripe_portal_session(user_id: str) -> str:
    users = users_collection()
    user = users.find_one({"_id": user_id})
    stripe_customer_id = user.get("stripe_customer_id")
    if not stripe_customer_id:
        raise Exception("No Stripe customer found")
    session = stripe.BillingPortal.Session.create(customer=stripe_customer_id, configuration="default")
    return session.url


async def handle_checkout_completed(checkout_session: dict):
    user_id = checkout_session.metadata["user_id"]
    subscription_id = checkout_session.subscription
    plan_slug = checkout_session.metadata["plan_slug"]
    stripe_sub = stripe.Subscription.retrieve(subscription_id)
    subscriptions = subscriptions_collection()
    subscription = {"_id": str(uuid.uuid4()), "user_id": user_id, "stripe_customer_id": checkout_session.customer, "stripe_subscription_id": subscription_id, "plan": plan_slug, "status": "active", "current_period_start": datetime.fromtimestamp(stripe_sub.current_period_start), "current_period_end": datetime.fromtimestamp(stripe_sub.current_period_end), "auto_renew": True, "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()}
    subscriptions.insert_one(subscription)
    await generate_daily_job_set(plan_slug)


async def handle_subscription_updated(stripe_sub: dict):
    subscription_id = stripe_sub.id
    new_plan_slug = stripe_sub.items.data[0].price.metadata.get("plan_slug")
    if not new_plan_slug:
        return
    subscriptions = subscriptions_collection()
    subscriptions.update_one({"stripe_subscription_id": subscription_id}, {"$set": {"plan": new_plan_slug, "status": stripe_sub.status, "current_period_start": datetime.fromtimestamp(stripe_sub.current_period_start), "current_period_end": datetime.fromtimestamp(stripe_sub.current_period_end), "updated_at": datetime.utcnow()}})
    await generate_daily_job_set(new_plan_slug)


async def handle_subscription_deleted(stripe_sub: dict):
    subscription_id = stripe_sub.id
    subscriptions = subscriptions_collection()
    subscriptions.update_one({"stripe_subscription_id": subscription_id}, {"$set": {"plan": "basic", "status": "expired", "updated_at": datetime.utcnow()}})
    await generate_daily_job_set("basic")


async def cancel_subscription(user_id: str) -> bool:
    subscriptions = subscriptions_collection()
    subscription = subscriptions.find_one({"user_id": user_id, "status": "active"})
    if subscription is None:
        return False
    subscription_id = subscription["stripe_subscription_id"]
    if subscription_id:
        try:
            stripe.Subscription.delete(subscription_id)
        except Exception:
            pass
    subscriptions.update_one({"_id": subscription["_id"]}, {"$set": {"plan": "basic", "status": "canceled", "updated_at": datetime.utcnow()}})
    await generate_daily_job_set("basic")
    return True