
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime
from .models import Role, TaskStatus
import re

def _assert_strong_password(v: str) -> str:
    if len(v) < 8:
        raise ValueError("Password must be at least 8 characters.")
    if not re.search(r"[A-Z]", v):
        raise ValueError("Password must include at least one uppercase letter.")
    if not re.search(r"[a-z]", v):
        raise ValueError("Password must include at least one lowercase letter.")
    if not re.search(r"[0-9]", v):
        raise ValueError("Password must include at least one digit.")
    return v

# ---- Auth ----
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        return _assert_strong_password(v)

class UserOut(BaseModel):
    id: int
    email: EmailStr
    role: Role
    is_active: bool

    class Config:
        from_attributes = True

class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(min_length=8)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        return _assert_strong_password(v)


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=8)
    new_password: str = Field(min_length=8)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        return _assert_strong_password(v)


class UserRoleUpdate(BaseModel):
    role: Role

# ---- Projects & Tasks ----
class ProjectBase(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(ProjectBase):
    pass

class ProjectOut(ProjectBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    status: TaskStatus = TaskStatus.todo
    project_id: int

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=255)
    status: Optional[TaskStatus] = None

class TaskOut(TaskBase):
    id: int
    created_at: datetime
    owner_id: int
    class Config:
        from_attributes = True
