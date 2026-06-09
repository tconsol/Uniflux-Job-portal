from pydantic import BaseModel
from typing import Optional


class PlanCreate(BaseModel):
    slug: str
    name: str
    job_limit: int
    price_monthly: float
    price_yearly: Optional[float] = None
    stripe_price_id_monthly: Optional[str] = None
    stripe_price_id_yearly: Optional[str] = None
    is_active: bool = True


class PlanUpdate(BaseModel):
    name: Optional[str] = None
    job_limit: Optional[int] = None
    price_monthly: Optional[float] = None
    price_yearly: Optional[float] = None
    stripe_price_id_monthly: Optional[str] = None
    stripe_price_id_yearly: Optional[str] = None
    is_active: Optional[bool] = None


class SubscriptionUpdate(BaseModel):
    plan: str
    status: Optional[str] = None