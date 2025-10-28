from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from fastapi_cache.decorator import cache
import requests
import os

router = APIRouter(prefix="/summarize", tags=["summarize"])

class SummarizeRequest(BaseModel):
    text: str
    max_length: int = 150
    min_length: int = 50

class SummarizeResponse(BaseModel):
    summary: str

HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn"
headers = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}

@router.post("/", response_model=SummarizeResponse)
@cache(expire=3600)  # Cache for 1 hour
async def summarize_text(request: SummarizeRequest):
    if len(request.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

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

        return SummarizeResponse(summary=summary)
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
