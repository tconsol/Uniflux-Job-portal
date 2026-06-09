from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class SubscriptionCreate(BaseModel):
    user_id: str
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    plan: str
    status: str = "active"
    current_period_start: datetime
    current_period_end: datetime
    auto_renew: bool = True


class SubscriptionInDB(SubscriptionCreate):
    _id: str
    created_at: datetime
    updated_at: datetime


class SubscriptionResponse(BaseModel):
    subscription_id: str
    user_id: str
    plan: str
    status: str
    current_period_start: datetime
    current_period_end: datetime
    auto_renew: bool