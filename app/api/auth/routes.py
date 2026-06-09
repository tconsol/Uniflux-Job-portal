from fastapi import APIRouter, HTTPException, status, Request, Cookie, Depends
from typing import Optional
import urllib.request
import urllib.parse
import json

from app.api.auth.schemas import (
    RegisterRequest, RegisterResponse,
    LoginRequest, LoginResponse,
    TokenRefreshResponse, LogoutResponse,
    CurrentUserResponse
)
from app.api.auth.service import (
    create_user, get_user_by_email, verify_user_password,
    get_user_by_google_id, create_user_from_oauth, link_google_oauth
)
from app.core.auth import generate_jwt_token, generate_refresh_token, decode_jwt_token
from app.config import settings
from app.dependencies import get_current_user

router = APIRouter()


@router.post("/register", response_model=RegisterResponse)
async def register(request: RegisterRequest):
    existing_user = await get_user_by_email(request.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    user = await create_user(
        email=request.email,
        password=request.password,
        name=request.name
    )
    return RegisterResponse(
        user_id=user["_id"],
        email=user["email"],
        name=user["name"],
        message="User registered successfully"
    )


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    user = await verify_user_password(request.email, request.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    access_token = generate_jwt_token(user["_id"])
    refresh_token = generate_refresh_token(user["_id"])
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "user_id": user["_id"],
            "email": user["email"],
            "name": user["name"]
        }
    )


@router.get("/oauth/google")
async def oauth_google():
    google_auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={settings.GOOGLE_CLIENT_ID}"
        f"&redirect_uri={urllib.parse.quote(settings.GOOGLE_OAUTH_REDIRECT_URI)}"
        f"&response_type=code"
        f"&scope=email profile"
    )
    return {"oauth_url": google_auth_url}


@router.get("/oauth/google/callback")
async def oauth_google_callback(request: Request, code: str, state: Optional[str] = None):
    try:
        token_data = urllib.parse.urlencode({
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_OAUTH_REDIRECT_URI,
            "grant_type": "authorization_code"
        }).encode()

        req = urllib.request.Request(
            "https://oauth2.googleapis.com/token",
            data=token_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        with urllib.request.urlopen(req) as response:
            token_json = json.loads(response.read().decode())

        access_token = token_json["access_token"]

        req = urllib.request.Request(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        with urllib.request.urlopen(req) as response:
            google_user = json.loads(response.read().decode())

        email = google_user["email"]
        name = google_user["name"]
        google_oauth_id = google_user["id"]

        user = await get_user_by_google_id(google_oauth_id)
        if user is None:
            existing_user = await get_user_by_email(email)
            if existing_user:
                await link_google_oauth(existing_user["_id"], google_oauth_id)
                user = existing_user
            else:
                user = await create_user_from_oauth(email, name, google_oauth_id)

        access_token = generate_jwt_token(user["_id"])
        return {
            "access_token": access_token,
            "token_type": "Bearer",
            "user": {
                "user_id": user["_id"],
                "email": user["email"],
                "name": user["name"]
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth callback failed: {str(e)}"
        )


@router.post("/refresh", response_model=TokenRefreshResponse)
async def refresh_token(refresh_token: Optional[str] = Cookie(None)):
    if refresh_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token required"
        )
    token_data = decode_jwt_token(refresh_token)
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    if token_data.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )
    new_access_token = generate_jwt_token(token_data["user_id"])
    return TokenRefreshResponse(access_token=new_access_token)


@router.post("/logout", response_model=LogoutResponse)
async def logout(refresh_token: Optional[str] = Cookie(None)):
    return LogoutResponse(message="Logged out successfully")


@router.get("/me", response_model=CurrentUserResponse)
async def get_current_user_endpoint(current_user: dict = Depends(get_current_user)):
    return CurrentUserResponse(
        user_id=current_user["_id"],
        email=current_user["email"],
        name=current_user["name"],
        google_oauth_id=current_user.get("google_oauth_id"),
        created_at=current_user["created_at"],
        profile=current_user.get("profile")
    )