from typing import Optional, Dict, Any
from datetime import datetime
import uuid

from app.database import users_collection
from app.core.security import hash_password, verify_password


async def create_user(email: str, password: str, name: str) -> Dict[Any, Any]:
    users = users_collection()
    user = {
        "_id": str(uuid.uuid4()),
        "email": email,
        "password_hash": hash_password(password),
        "name": name,
        "google_oauth_id": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True,
        "is_admin": False,
        "profile": {"resume_url": None, "skills": [], "preferences": {"locations": [], "job_types": [], "salary_min": None}}
    }
    users.insert_one(user)
    return user


async def get_user_by_email(email: str) -> Optional[Dict[Any, Any]]:
    users = users_collection()
    return users.find_one({"email": email})


async def get_user_by_google_id(google_oauth_id: str) -> Optional[Dict[Any, Any]]:
    users = users_collection()
    return users.find_one({"google_oauth_id": google_oauth_id})


async def verify_user_password(email: str, password: str) -> Optional[Dict[Any, Any]]:
    user = await get_user_by_email(email)
    if user is None:
        return None
    if not verify_password(password, user["password_hash"]):
        return None
    return user


async def link_google_oauth(user_id: str, google_oauth_id: str) -> None:
    users = users_collection()
    users.update_one({"_id": user_id}, {"$set": {"google_oauth_id": google_oauth_id, "updated_at": datetime.utcnow()}})


async def create_user_from_oauth(email: str, name: str, google_oauth_id: str) -> Dict[Any, Any]:
    users = users_collection()
    user = {
        "_id": str(uuid.uuid4()),
        "email": email,
        "password_hash": None,
        "name": name,
        "google_oauth_id": google_oauth_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True,
        "is_admin": False,
        "profile": {"resume_url": None, "skills": [], "preferences": {"locations": [], "job_types": [], "salary_min": None}}
    }
    users.insert_one(user)
    return user