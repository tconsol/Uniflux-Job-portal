from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class JobCreate(BaseModel):
    external_job_id: str
    title: str
    company: str
    location: str
    job_type: str
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_currency: str = "USD"
    skills: List[str] = []
    description: str
    apply_url: str
    posted_at: datetime
    source: str
    is_active: bool = True


class JobInDB(JobCreate):
    _id: str
    created_at: datetime
    updated_at: datetime


class JobResponse(BaseModel):
    job_id: str
    title: str
    company: str
    location: str
    job_type: str
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_currency: str = "USD"
    skills: List[str] = []
    description: str
    apply_url: str
    posted_at: datetime
    source: str