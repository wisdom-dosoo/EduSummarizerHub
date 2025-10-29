from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from fastapi_cache.decorator import cache
import requests
import os
from routes.auth import get_current_user
from models import User, UserTier
from database import users_collection
from datetime import datetime

router = APIRouter(prefix="/summarize", tags=["summarize"])

class SummarizeRequest(BaseModel):
    text: str
    max_length: int = 150
    min_length: int = 50

class SummarizeResponse(BaseModel):
    summary: str
    usage_count: int
    tier: str

HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn"
headers = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}

async def check_usage_limits(user: User):
    # Reset usage if month has passed
    now = datetime.utcnow()
    if (now - user.last_reset).days >= 30:
        user.usage_count = 0
        user.last_reset = now
        await users_collection.update_one(
            {"email": user.email},
            {"$set": {"usage_count": 0, "last_reset": now}}
        )

    # Check limits
    if user.tier == UserTier.FREE and user.usage_count >= 10:
        raise HTTPException(
            status_code=429,
            detail="Free tier limit reached (10 summaries/month). Upgrade to premium for unlimited access."
        )

@router.post("/", response_model=SummarizeResponse)
@cache(expire=3600)  # Cache for 1 hour
async def summarize_text(summarize_request: SummarizeRequest, current_user: User = Depends(get_current_user)):
    request = summarize_request
    if len(request.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    await check_usage_limits(current_user)

    payload = {
        "inputs": request.text,
        "parameters": {
            "max_length": request.max_length,
            "min_length": request.min_length,
            "do_sample": False
        }
    }

    try:
        response = requests.post(API_URL, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()

        if isinstance(result, list) and result:
            summary = result[0].get("summary_text", "")
        else:
            summary = str(result)

        # Update usage count
        new_count = current_user.usage_count + 1
        await users_collection.update_one(
            {"email": current_user.email},
            {"$set": {"usage_count": new_count}}
        )

        return SummarizeResponse(summary=summary, usage_count=new_count, tier=current_user.tier.value)
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
