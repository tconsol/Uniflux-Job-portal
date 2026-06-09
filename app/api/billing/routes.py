from fastapi import APIRouter, HTTPException, status, Depends, Request

from app.api.billing.schemas import PlansListResponse, PlanResponse, SubscribeRequest, SubscribeResponse, CurrentSubscriptionResponse, CancelSubscriptionResponse, PortalResponse
from app.api.billing.service import get_all_plans, create_stripe_checkout_session, create_stripe_portal_session, cancel_subscription, handle_checkout_completed, handle_subscription_updated, handle_subscription_deleted
from app.dependencies import get_current_user, get_current_subscription
from app.database import plans

router = APIRouter()


@router.get("/plans", response_model=PlansListResponse)
async def list_plans():
    plans_list = await get_all_plans()
    return PlansListResponse(
        plans=[
            PlanResponse(
                plan_id=plan["_id"],
                slug=plan["slug"],
                name=plan["name"],
                job_limit=plan["job_limit"],
                price_monthly=plan["price_monthly"],
                price_yearly=plan.get("price_yearly"),
                is_active=plan["is_active"]
            )
            for plan in plans_list
        ]
    )


@router.post("/subscribe", response_model=SubscribeResponse)
async def subscribe(request: SubscribeRequest, current_user: dict = Depends(get_current_user)):
    try:
        subscription_url, session_id = await create_stripe_checkout_session(
            current_user["_id"],
            request.plan_slug,
            request.success_url,
            request.cancel_url
        )
        return SubscribeResponse(subscription_url=subscription_url, session_id=session_id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to create subscription: {str(e)}")


@router.post("/portal", response_model=PortalResponse)
async def create_portal(current_user: dict = Depends(get_current_user)):
    try:
        portal_url = await create_stripe_portal_session(current_user["_id"])
        return PortalResponse(portal_url=portal_url)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to create portal: {str(e)}")


@router.get("/current", response_model=CurrentSubscriptionResponse)
async def get_current_subscription_endpoint(subscription: dict = Depends(get_current_subscription)):
    if subscription["status"] == "inactive":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active subscription")
    plan = await plans.find_one({"slug": subscription["plan"]})
    plan_name = plan.get("name", subscription["plan"]) if plan else subscription["plan"]
    return CurrentSubscriptionResponse(
        subscription_id=subscription["_id"],
        plan=subscription["plan"],
        plan_name=plan_name,
        job_limit=subscription["job_limit"],
        status=subscription["status"],
        current_period_start=subscription["current_period_start"],
        current_period_end=subscription["current_period_end"],
        auto_renew=subscription.get("auto_renew", True)
    )


@router.post("/cancel", response_model=CancelSubscriptionResponse)
async def cancel(current_user: dict = Depends(get_current_user)):
    success = await cancel_subscription(current_user["_id"])
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No active subscription to cancel")
    return CancelSubscriptionResponse(message="Subscription canceled successfully")


@router.post("/webhook")
async def stripe_webhook(request: Request):
    import stripe
    from app.config import settings
    body = await request.body()
    sig = request.headers.get("stripe-signature")
    try:
        event = stripe.Webhook.construct_event(body, sig, settings.STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.error.SignatureVerificationError):
        raise HTTPException(status_code=400, detail="Invalid webhook")

    event_handler = {
        "checkout.session_completed": handle_checkout_completed,
        "customer.subscription.updated": handle_subscription_updated,
        "customer.subscription.deleted": handle_subscription_deleted,
    }.get(event.type)

    if event_handler:
        await event_handler(event.data.object)
    return {"status": "success"}