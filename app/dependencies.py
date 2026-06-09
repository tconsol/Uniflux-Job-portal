from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.auth import decode_jwt_token
from app.database import users_collection, plans_collection, subscriptions_collection

http_bearer = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(http_bearer)) -> dict:
    token = credentials.credentials
    user_data = decode_jwt_token(token)
    if user_data is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    users = users_collection()
    user = users.find_one({"_id": user_data["user_id"]})
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account is deactivated")
    return user


async def get_current_subscription(current_user: dict = Depends(get_current_user)) -> dict:
    subscriptions = subscriptions_collection()
    plans = plans_collection()
    subscription = subscriptions.find_one({"user_id": current_user["_id"], "status": "active"})
    if subscription is None:
        return {"user_id": current_user["_id"], "plan": "basic", "job_limit": 10, "status": "inactive"}
    plan_doc = plans.find_one({"slug": subscription["plan"]})
    subscription["job_limit"] = plan_doc.get("job_limit", 10) if plan_doc else 10
    return subscription


async def get_admin_user(credentials: HTTPAuthorizationCredentials = Depends(http_bearer)) -> dict:
    token = credentials.credentials
    user_data = decode_jwt_token(token)
    if user_data is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    users = users_collection()
    user = users.find_one({"_id": user_data["user_id"]})
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if not user.get("is_admin", False):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user