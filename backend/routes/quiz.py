from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from fastapi_cache.decorator import cache
import requests
import os
import random

router = APIRouter(prefix="/quiz", tags=["quiz"])

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

HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
QA_API_URL = "https://api-inference.huggingface.co/models/deepset/roberta-base-squad2"
headers = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}

# Simple question templates for quiz generation
QUESTION_TEMPLATES = [
    "What is the main topic of this text?",
    "According to the summary, what does it say about {}?",
    "What key point is made regarding {}?",
    "How does the text describe {}?",
    "What conclusion can be drawn about {}?"
]

@router.post("/", response_model=QuizResponse)
@cache(expire=3600)  # Cache for 1 hour
async def generate_quiz(request: QuizRequest):
    if len(request.summary.strip()) == 0:
        raise HTTPException(status_code=400, detail="Summary cannot be empty")

    questions = []

    # Extract key phrases from summary (simple approach)
    words = request.summary.split()
    key_phrases = [word for word in words if len(word) > 4][:request.num_questions]

    for i in range(min(request.num_questions, len(key_phrases))):
        phrase = key_phrases[i]

        # Generate question
        template = random.choice(QUESTION_TEMPLATES)
        question_text = template.format(phrase) if "{}" in template else template

        # For simplicity, create multiple choice with one correct answer
        # In a real implementation, you'd use more sophisticated QA
        correct_answer = f"The text discusses {phrase} in detail."

        # Generate wrong options (simplified)
        wrong_options = [
            f"The text mentions {phrase} briefly.",
            f"{phrase} is not covered in the text.",
            f"The text contradicts information about {phrase}."
        ]

        options = [
            QuizOption(text=correct_answer, is_correct=True),
            QuizOption(text=wrong_options[0], is_correct=False),
            QuizOption(text=wrong_options[1], is_correct=False),
            QuizOption(text=wrong_options[2], is_correct=False)
        ]

        random.shuffle(options)
        questions.append(QuizQuestion(question=question_text, options=options))

    return QuizResponse(questions=questions)
