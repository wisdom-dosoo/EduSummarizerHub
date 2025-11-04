from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import requests
import os
import logging
from cache import cache

router = APIRouter(prefix="/translate", tags=["Translate"])
logger = logging.getLogger(__name__)

class TranslateRequest(BaseModel):
    text: str
    target_language: str = "es"  # Default to Spanish

class TranslateResponse(BaseModel):
    translated_text: str
    tier: str = "free"

HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
API_URL = "https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-en-{target_lang}"
headers = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}

# Supported languages mapping
LANG_MAP = {
    "es": "es",
    "fr": "fr",
    "de": "de",
    "it": "it",
    "pt": "pt",
    "zh": "zh",
    "ja": "ja",
    "ko": "ko"
}

@router.post("/", response_model=TranslateResponse)
@cache.cached
async def translate_text(translate_request: TranslateRequest):
    try:
        # Validate input
        if not translate_request.text or len(translate_request.text.strip()) == 0:
            logger.warning("Empty text provided for translation")
            raise HTTPException(status_code=400, detail="Text cannot be empty")

        if len(translate_request.text) > 5000:  # Reasonable limit for translation
            logger.warning(f"Text too long for translation: {len(translate_request.text)} characters")
            raise HTTPException(status_code=400, detail="Text is too long. Maximum 5,000 characters allowed for translation.")

        # Validate API key
        if not HUGGINGFACE_API_KEY:
            logger.error("HuggingFace API key not configured")
            raise HTTPException(status_code=500, detail="Translation service not configured")

        # Validate target language
        target = LANG_MAP.get(translate_request.target_language.lower(), "es")
        if translate_request.target_language.lower() not in LANG_MAP:
            logger.warning(f"Unsupported language requested: {translate_request.target_language}")
            raise HTTPException(status_code=400, detail=f"Unsupported language: {translate_request.target_language}. Supported languages: {', '.join(LANG_MAP.keys())}")

        url = API_URL.format(target_lang=target)
        payload = {"inputs": translate_request.text}

        logger.info(f"Translating text to {target}, length: {len(translate_request.text)}")
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        result = response.json()

        if isinstance(result, list) and result:
            translation = result[0].get("translation_text", "")
        else:
            translation = str(result)

        if not translation.strip():
            logger.error("Empty translation returned from AI service")
            raise HTTPException(status_code=500, detail="Failed to generate translation")

        logger.info(f"Translation generated successfully, length: {len(translation)}")
        return TranslateResponse(translated_text=translation, tier="free")

    except requests.Timeout:
        logger.error("Timeout error from translation service")
        raise HTTPException(status_code=504, detail="Translation service timeout. Please try again.")
    except requests.RequestException as e:
        logger.error(f"Translation service error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Translation service error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error during translation: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during translation")
