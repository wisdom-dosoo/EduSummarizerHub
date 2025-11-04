from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import requests
import os
import random
import logging
from cache import cache

router = APIRouter(prefix="/quiz", tags=["Quiz"])
logger = logging.getLogger(__name__)

class QuizRequest(BaseModel):
    summary: str
    num_questions: int = 5

class QuizOption(BaseModel):
    text: str
    is_correct: bool

class QuizQuestion(BaseModel):
    question: str
    options: List[QuizOption]

class QuizResponse(BaseModel):
    questions: List[QuizQuestion]
    tier: str = "free"

HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
QA_API_URL = "https://api-inference.huggingface.co/models/deepset/roberta-base-squad2"
headers = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}

# Enhanced question templates for quiz generation
QUESTION_TEMPLATES = [
    "What is the main topic of this text?",
    "According to the summary, what does it say about {}?",
    "What key point is made regarding {}?",
    "How does the text describe {}?",
    "What conclusion can be drawn about {}?",
    "What is the primary focus of the discussion on {}?",
    "How does the summary characterize {}?",
    "What aspect of {} is emphasized in the text?"
]

@router.post("/", response_model=QuizResponse)
@cache.cached
async def generate_quiz(quiz_request: QuizRequest):
    try:
        # Validate input
        if not quiz_request.summary or len(quiz_request.summary.strip()) == 0:
            logger.warning("Empty summary provided for quiz generation")
            raise HTTPException(status_code=400, detail="Summary cannot be empty")

        if len(quiz_request.summary) > 5000:  # Reasonable limit
            logger.warning(f"Summary too long for quiz generation: {len(quiz_request.summary)} characters")
            raise HTTPException(status_code=400, detail="Summary is too long. Maximum 5,000 characters allowed.")

        if quiz_request.num_questions < 1 or quiz_request.num_questions > 10:
            logger.warning(f"Invalid number of questions requested: {quiz_request.num_questions}")
            raise HTTPException(status_code=400, detail="Number of questions must be between 1 and 10")

        # Validate API key
        if not HUGGINGFACE_API_KEY:
            logger.error("HuggingFace API key not configured")
            raise HTTPException(status_code=500, detail="Quiz generation service not configured")

        questions = []

        # Extract key phrases from summary (improved approach)
        words = quiz_request.summary.replace('.', ' ').replace(',', ' ').split()
        key_phrases = [word.strip() for word in words if len(word.strip()) > 3 and word.strip().isalnum()]

        # Remove duplicates and limit
        key_phrases = list(set(key_phrases))[:quiz_request.num_questions * 2]

        if len(key_phrases) < quiz_request.num_questions:
            logger.warning(f"Not enough key phrases extracted for {quiz_request.num_questions} questions")
            # Fall back to generating questions without specific phrases
            key_phrases = ["the main topic", "key concepts", "important details", "the content"]

        random.shuffle(key_phrases)

        for i in range(min(quiz_request.num_questions, len(key_phrases))):
            phrase = key_phrases[i] if i < len(key_phrases) else "the content"

            # Generate question
            template = random.choice(QUESTION_TEMPLATES)
            question_text = template.format(phrase) if "{}" in template else template

            # Create multiple choice options
            correct_answer = f"The text discusses {phrase} as an important element."

            # Generate plausible wrong options
            wrong_options = [
                f"The text mentions {phrase} only briefly.",
                f"{phrase} is not a significant part of the discussion.",
                f"The text focuses on aspects other than {phrase}.",
                f"{phrase} receives minimal attention in the summary."
            ]

            # Ensure we have exactly 4 options
            selected_wrong = random.sample(wrong_options, 3)

            options = [
                QuizOption(text=correct_answer, is_correct=True),
                QuizOption(text=selected_wrong[0], is_correct=False),
                QuizOption(text=selected_wrong[1], is_correct=False),
                QuizOption(text=selected_wrong[2], is_correct=False)
            ]

            random.shuffle(options)
            questions.append(QuizQuestion(question=question_text, options=options))

        if not questions:
            logger.error("Failed to generate any quiz questions")
            raise HTTPException(status_code=500, detail="Failed to generate quiz questions")

        logger.info(f"Quiz generated successfully with {len(questions)} questions")
        return QuizResponse(questions=questions, tier="free")

    except Exception as e:
        logger.error(f"Unexpected error during quiz generation: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during quiz generation")
