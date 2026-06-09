from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str


class RegisterResponse(BaseModel):
    user_id: str
    email: str
    name: str
    message: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    user: dict


class TokenRefreshResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"


class LogoutResponse(BaseModel):
    message: str


class CurrentUserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    google_oauth_id: Optional[str]
    created_at: datetime
    profile: Optional[dict]