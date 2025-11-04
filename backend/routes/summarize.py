from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import requests
import os
import logging
from cache import cache

router = APIRouter(prefix="/summarize", tags=["Summarize"])
logger = logging.getLogger(__name__)

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
@cache.cached
async def summarize_text(summarize_request: SummarizeRequest):
    try:
        # Validate input
        if not summarize_request.text or len(summarize_request.text.strip()) == 0:
            logger.warning("Empty text provided for summarization")
            raise HTTPException(status_code=400, detail="Text cannot be empty")

        if len(summarize_request.text) > 10000:  # Reasonable limit
            logger.warning(f"Text too long for summarization: {len(summarize_request.text)} characters")
            raise HTTPException(status_code=400, detail="Text is too long. Maximum 10,000 characters allowed.")

        # Validate API key
        if not HUGGINGFACE_API_KEY:
            logger.error("HuggingFace API key not configured")
            raise HTTPException(status_code=500, detail="AI service not configured")

        payload = {
            "inputs": summarize_request.text,
            "parameters": {
                "max_length": summarize_request.max_length,
                "min_length": summarize_request.min_length,
                "do_sample": False
            }
        }

        logger.info(f"Summarizing text of length {len(summarize_request.text)}")
        response = requests.post(API_URL, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        result = response.json()

        if isinstance(result, list) and result:
            summary = result[0].get("summary_text", "")
        else:
            summary = str(result)

        if not summary.strip():
            logger.error("Empty summary returned from AI service")
            raise HTTPException(status_code=500, detail="Failed to generate summary")

        logger.info(f"Summary generated successfully, length: {len(summary)}")
        return SummarizeResponse(summary=summary, usage_count=0, tier="free")

    except requests.Timeout:
        logger.error("Timeout error from AI service")
        raise HTTPException(status_code=504, detail="AI service timeout. Please try again.")
    except requests.RequestException as e:
        logger.error(f"AI service error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error during summarization: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during summarization")
