from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from fastapi_cache.decorator import cache
import requests
import os

router = APIRouter(prefix="/translate", tags=["translate"])

class TranslateRequest(BaseModel):
    text: str
    target_language: str = "es"  # Default to Spanish

class TranslateResponse(BaseModel):
    translated_text: str

HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
API_URL = "https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-en-{target_lang}"
headers = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}

@router.post("/", response_model=TranslateResponse)
@cache(expire=3600)  # Cache for 1 hour
async def translate_text(request: TranslateRequest):
    if len(request.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    # Map common language codes
    lang_map = {
        "es": "es",
        "fr": "fr",
        "de": "de",
        "it": "it",
        "pt": "pt",
        "zh": "zh",
        "ja": "ja",
        "ko": "ko"
    }

    target = lang_map.get(request.target_language, "es")
    url = API_URL.format(target_lang=target)

    payload = {"inputs": request.text}

    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()

        if isinstance(result, list) and result:
            translation = result[0].get("translation_text", "")
        else:
            translation = str(result)

        return TranslateResponse(translated_text=translation)
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Translation service error: {str(e)}")
