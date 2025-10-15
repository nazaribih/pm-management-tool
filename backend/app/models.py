
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base
import enum

class Role(str, enum.Enum):
    user = "user"
    manager = "manager"
    admin = "admin"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(Role), default=Role.user, nullable=False)
    is_active = Column(Boolean, default=True)
    reset_token = Column(String(255), nullable=True)

    tasks = relationship("Task", back_populates="owner")

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    tasks = relationship("Task", back_populates="project", cascade="all,delete")

class TaskStatus(str, enum.Enum):
    todo = "todo"
    doing = "doing"
    done = "done"

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    status = Column(Enum(TaskStatus), default=TaskStatus.todo, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"))
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="tasks")
    owner = relationship("User", back_populates="tasks")
