from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


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


class JobResponse(BaseModel):
    job_id: str
    title: str
    company: str
    location: str
    job_type: str
    salary_min: Optional[int]
    salary_max: Optional[int]
    salary_currency: str
    skills: List[str]
    description: str
    apply_url: str
    posted_at: datetime
    source: str


class JobsListResponse(BaseModel):
    jobs: List[JobResponse]
    total: int
    page: int
    limit: int
    plan: str
    job_limit: int


class JobFilters(BaseModel):
    location: Optional[str] = None
    job_type: Optional[str] = None
    salary_min: Optional[int] = None
    company: Optional[str] = None
    skills: Optional[List[str]] = None