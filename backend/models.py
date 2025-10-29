from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum

class UserTier(str, Enum):
    FREE = "free"
    PREMIUM = "premium"

class User(BaseModel):
    id: Optional[str]
    username: str
    email: str
    password_hash: Optional[str]
    tier: UserTier = UserTier.FREE
    usage_count: int = 0
    subscription_id: Optional[str]
    created_at: Optional[datetime] = datetime.utcnow()
    last_reset: Optional[datetime] = datetime.utcnow()

class Summary(BaseModel):
    id: Optional[str]
    user_id: str
    original_text: str
    summarized_text: str
    language: str = "en"
    created_at: Optional[datetime] = datetime.utcnow()

class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: str

class Quiz(BaseModel):
    id: Optional[str]
    user_id: str
    summary_id: str
    questions: List[QuizQuestion]
    score: Optional[int] = 0
    total_questions: int
    created_at: Optional[datetime] = datetime.utcnow()

class UploadResponse(BaseModel):
    filename: str
    content: str
    file_size: int
