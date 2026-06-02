from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class Lesson(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    difficulty: str
    priority: int
    created_at: datetime
    active: bool
    total_steps: int = 0
    completed: bool = False
    score: int = 0

class LessonStep(BaseModel):
    lesson_id: str
    step_index: int
    type: str
    target: str
    prompt: str
    hint: Optional[str] = None
    max_attempts: int

class Session(BaseModel):
    id: str
    lesson_id: str
    user_id: int
    started_at: datetime
    finished_at: Optional[datetime] = None
    score: int
    completed: bool
    lesson_title: Optional[str] = None