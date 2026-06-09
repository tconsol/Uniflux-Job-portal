from fastapi import APIRouter

from app.api.auth.routes import router as auth_router
from app.api.jobs.routes import router as jobs_router
from app.api.billing.routes import router as billing_router
from app.api.admin.routes import router as admin_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["Auth"])
api_router.include_router(jobs_router, prefix="/jobs", tags=["Jobs"])
api_router.include_router(billing_router, prefix="/billing", tags=["Billing"])
api_router.include_router(admin_router, prefix="/admin", tags=["Admin"])