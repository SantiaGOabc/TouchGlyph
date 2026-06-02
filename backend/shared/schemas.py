from pydantic import BaseModel, Field, ConfigDict, AfterValidator
from typing import Optional, Dict, Any, List, Annotated
from datetime import datetime
from shared.sanitize import sanitize_text

SanitizedStr = Annotated[str, AfterValidator(lambda v: sanitize_text(v))]

# User Service
class UserBase(BaseModel):
    username: SanitizedStr
    full_name: Optional[SanitizedStr] = None
    role: str = "student"

class UserCreate(UserBase):
    password: str
    created_by: Optional[int] = None

class UserResponse(UserBase):
    id: int
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class LoginRequest(BaseModel):
    username: SanitizedStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class FaceRegisterRequest(BaseModel):
    user_id: int
    image_base64: str

class FaceLoginRequest(BaseModel):
    image_base64: str

class FaceStatusResponse(BaseModel):
    has_face_registered: bool
    face_data: Optional[Dict[str, Any]] = None

# Student Service
class StartSessionRequest(BaseModel):
    lesson_id: str

class SubmitAnswerRequest(BaseModel):
    answer: str

class LessonResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    difficulty: Optional[str]
    priority: Optional[int]
    total_steps: int
    completed: int
    score: int

class LessonListResponse(BaseModel):
    lessons: list[LessonResponse]
    stats: Dict[str, int]

class SessionPromptResponse(BaseModel):
    finished: bool
    prompt: Optional[str] = None
    target: Optional[str] = None
    hint: Optional[str] = None
    type: Optional[str] = None
    step_index: Optional[int] = None
    max_attempts: Optional[int] = None
    attempts: Optional[int] = None
    score: Optional[int] = None
    user_id: Optional[int] = None
    total_steps: Optional[int] = None

class SubmitResponse(BaseModel):
    correct: bool
    attempts: int
    max_attempts: int
    hint: Optional[str] = None
    finished: Optional[bool] = None
# Admin Service
class UserUpdate(BaseModel):
    username: Optional[SanitizedStr] = None
    full_name: Optional[SanitizedStr] = None
    role: Optional[str] = None
    password: Optional[str] = None
    active: Optional[int] = None

class ClassCreate(BaseModel):
    name: SanitizedStr
    description: Optional[SanitizedStr] = None
    teacher_id: Optional[int] = None

class ClassUpdate(BaseModel):
    name: Optional[SanitizedStr] = None
    description: Optional[SanitizedStr] = None
    teacher_id: Optional[int] = None

class DeviceCreate(BaseModel):
    device_id: SanitizedStr
    name: Optional[SanitizedStr] = None

class AssignStudentsRequest(BaseModel):
    student_ids: List[int]

class AssignTeacherRequest(BaseModel):
    teacher_id: Optional[int] = None
    
# Devices Service
class TogglePointRequest(BaseModel):
    punto: int = Field(..., ge=0, le=5, description="Número de punto Braille (0-5)")

class SendLetterRequest(BaseModel):
    letra: str = Field(..., min_length=1, max_length=1, description="Letra a mostrar (A-Z)")

# Teacher Service
class LessonStepCreate(BaseModel):
    type: str = "input"
    target: SanitizedStr
    prompt: SanitizedStr
    hint: Optional[SanitizedStr] = None
    max_attempts: int = 3

class LessonCreate(BaseModel):
    title: SanitizedStr
    description: Optional[SanitizedStr] = ""
    difficulty: str = "beginner"
    priority: int = 1
    steps: List[LessonStepCreate]

class LessonUpdate(BaseModel):
    title: Optional[SanitizedStr] = None
    description: Optional[SanitizedStr] = None
    difficulty: Optional[str] = None
    priority: Optional[int] = None
    active: Optional[int] = None
    steps: Optional[List[LessonStepCreate]] = None

class AssignLessonRequest(BaseModel):
    class_id: int