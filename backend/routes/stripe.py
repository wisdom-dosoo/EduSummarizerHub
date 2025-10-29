from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
import stripe
import os
from routes.auth import get_current_user
from models import User, UserTier
from database import users_collection

router = APIRouter(prefix="/stripe", tags=["stripe"])

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

class CreateSubscriptionRequest(BaseModel):
    price_id: str  # Stripe price ID for premium plan

class SubscriptionResponse(BaseModel):
    client_secret: str
    subscription_id: str

@router.post("/create-subscription", response_model=SubscriptionResponse)
async def create_subscription(request: CreateSubscriptionRequest, current_user: User = Depends(get_current_user)):
    try:
        # Create or retrieve customer
        customer = stripe.Customer.create(
            email=current_user.email,
            name=current_user.username,
        )

        # Create subscription
        subscription = stripe.Subscription.create(
            customer=customer.id,
            items=[{"price": request.price_id}],
            payment_behavior="default_incomplete",
            expand=["latest_invoice.payment_intent"],
        )

        return SubscriptionResponse(
            client_secret=subscription.latest_invoice.payment_intent.client_secret,
            subscription_id=subscription.id
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, os.getenv("STRIPE_WEBHOOK_SECRET")
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle the event
    if event.type == "invoice.payment_succeeded":
        subscription_id = event.data.object.subscription
        customer_email = event.data.object.customer_email

        # Update user to premium
        await users_collection.update_one(
            {"email": customer_email},
            {"$set": {"tier": UserTier.PREMIUM, "subscription_id": subscription_id}}
        )
    elif event.type == "invoice.payment_failed":
        # Handle failed payment
        pass

    return {"status": "success"}
