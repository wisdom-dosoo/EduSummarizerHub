from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Summary(BaseModel):
    id: Optional[str]
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
    summary_id: str
    questions: List[QuizQuestion]
    score: Optional[int] = 0
    total_questions: int
    created_at: Optional[datetime] = datetime.utcnow()

class UploadResponse(BaseModel):
    filename: str
    content: str
    file_size: int
