from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from fastapi_cache.decorator import cache
import requests
import os

router = APIRouter(prefix="/summarize", tags=["Summarize"])

class SummarizeRequest(BaseModel):
    text: str
    max_length: int = 150
    min_length: int = 50

class SummarizeResponse(BaseModel):
    summary: str
    usage_count: int = 0
    tier: str = "free"

HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn"
headers = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}

@router.post("/", response_model=SummarizeResponse)
async def summarize_text(summarize_request: SummarizeRequest):
    if len(summarize_request.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    payload = {
        "inputs": summarize_request.text,
        "parameters": {
            "max_length": summarize_request.max_length,
            "min_length": summarize_request.min_length,
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

        return SummarizeResponse(summary=summary, usage_count=0, tier="free")
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
