from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class PlanCreate(BaseModel):
    slug: str
    name: str
    job_limit: int
    price_monthly: float
    price_yearly: Optional[float] = None
    stripe_price_id_monthly: Optional[str] = None
    stripe_price_id_yearly: Optional[str] = None
    is_active: bool = True


class PlanInDB(PlanCreate):
    _id: str
    created_at: datetime
    updated_at: datetime


class PlanResponse(BaseModel):
    plan_id: str
    slug: str
    name: str
    job_limit: int
    price_monthly: float
    price_yearly: Optional[float] = None
    is_active: bool = True