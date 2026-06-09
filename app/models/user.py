from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field


class UserProfile(BaseModel):
    resume_url: Optional[str] = None
    skills: List[str] = []
    preferences: Dict[str, Any] = {
        "locations": [],
        "job_types": [],
        "salary_min": None
    }


class UserCreate(BaseModel):
    email: EmailStr
    password_hash: Optional[str] = None
    name: str
    google_oauth_id: Optional[str] = None
    is_active: bool = True
    is_admin: bool = False
    profile: UserProfile = Field(default_factory=UserProfile)


class UserInDB(UserCreate):
    _id: str
    created_at: datetime
    updated_at: datetime


class UserResponse(BaseModel):
    user_id: str
    email: EmailStr
    name: str
    google_oauth_id: Optional[str] = None
    is_active: bool = True
    is_admin: bool = False
    created_at: datetime
    profile: UserProfile