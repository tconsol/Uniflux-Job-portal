from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PlanResponse(BaseModel):
    plan_id: str
    slug: str
    name: str
    job_limit: int
    price_monthly: float
    price_yearly: Optional[float]
    is_active: bool


class PlansListResponse(BaseModel):
    plans: list[PlanResponse]


class SubscribeRequest(BaseModel):
    plan_slug: str
    success_url: str
    cancel_url: str


class SubscribeResponse(BaseModel):
    subscription_url: str
    session_id: str


class CurrentSubscriptionResponse(BaseModel):
    subscription_id: str
    plan: str
    plan_name: str
    job_limit: int
    status: str
    current_period_start: datetime
    current_period_end: datetime
    auto_renew: bool


class CancelSubscriptionResponse(BaseModel):
    message: str


class PortalResponse(BaseModel):
    portal_url: str