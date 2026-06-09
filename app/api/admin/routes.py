from fastapi import APIRouter, HTTPException, status, Depends

from app.api.admin.schemas import PlanCreate, PlanUpdate, SubscriptionUpdate
from app.api.admin.service import create_plan, get_all_plans, get_plan_by_id, update_plan, delete_plan, get_all_users, update_user_subscription
from app.dependencies import get_admin_user

router = APIRouter()


@router.get("/plans")
async def list_plans(admin_user: dict = Depends(get_admin_user)):
    plans_list = await get_all_plans()
    return {"plans": plans_list}


@router.post("/plans")
async def create_plan_endpoint(plan: PlanCreate, admin_user: dict = Depends(get_admin_user)):
    try:
        new_plan = await create_plan(plan.dict())
        return {"message": "Plan created successfully", "plan": new_plan}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to create plan: {str(e)}")


@router.get("/plans/{plan_id}")
async def get_plan(plan_id: str, admin_user: dict = Depends(get_admin_user)):
    plan = await get_plan_by_id(plan_id)
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    return {"plan": plan}


@router.put("/plans/{plan_id}")
async def update_plan_endpoint(plan_id: str, update: PlanUpdate, admin_user: dict = Depends(get_admin_user)):
    plan = await update_plan(plan_id, update.dict(exclude_unset=True))
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    return {"message": "Plan updated successfully", "plan": plan}


@router.delete("/plans/{plan_id}")
async def delete_plan_endpoint(plan_id: str, admin_user: dict = Depends(get_admin_user)):
    success = await delete_plan(plan_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    return {"message": "Plan deleted successfully"}


@router.get("/users")
async def list_users(admin_user: dict = Depends(get_admin_user)):
    users_list = await get_all_users()
    return {"users": users_list}


@router.put("/users/{user_id}/subscription")
async def update_user_subscription_endpoint(user_id: str, update: SubscriptionUpdate, admin_user: dict = Depends(get_admin_user)):
    await update_user_subscription(user_id, update.plan, update.status)
    return {"message": "Subscription updated successfully"}