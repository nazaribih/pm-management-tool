
from sqlalchemy.orm import Session
from typing import Optional, List
from . import models, schemas, security

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, data: schemas.UserCreate, role=models.Role.user) -> models.User:
    user = models.User(
        email=data.email,
        hashed_password=security.hash_password(data.password),
        role=role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def list_users(db: Session) -> List[models.User]:
    return db.query(models.User).order_by(models.User.id).all()


def update_user_role(db: Session, uid: int, role: models.Role) -> Optional[models.User]:
    user = db.query(models.User).get(uid)
    if not user:
        return None
    user.role = role
    db.commit()
    db.refresh(user)
    return user

def list_projects(db: Session, q: Optional[str] = None) -> List[models.Project]:
    query = db.query(models.Project)
    if q:
        ilike = f"%{q.lower()}%"
        query = query.filter(models.Project.name.ilike(ilike))
    return query.order_by(models.Project.created_at.desc()).all()

def create_project(db: Session, data: schemas.ProjectCreate) -> models.Project:
    obj = models.Project(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def update_project(db: Session, pid: int, data: schemas.ProjectUpdate) -> Optional[models.Project]:
    obj = db.query(models.Project).get(pid)
    if not obj: return None
    for k, v in data.model_dump().items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

def delete_project(db: Session, pid: int) -> bool:
    obj = db.query(models.Project).get(pid)
    if not obj: return False
    db.delete(obj)
    db.commit()
    return True

def list_tasks(db: Session, status: Optional[models.TaskStatus] = None, project_id: Optional[int] = None):
    q = db.query(models.Task)
    if status:
        q = q.filter(models.Task.status == status)
    if project_id:
        q = q.filter(models.Task.project_id == project_id)
    return q.order_by(models.Task.created_at.desc()).all()

def create_task(db: Session, owner_id: int, data: schemas.TaskCreate) -> models.Task:
    obj = models.Task(**data.model_dump(), owner_id=owner_id)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def update_task(db: Session, tid: int, data: schemas.TaskUpdate) -> Optional[models.Task]:
    obj = db.query(models.Task).get(tid)
    if not obj: return None
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

def delete_task(db: Session, tid: int) -> bool:
    obj = db.query(models.Task).get(tid)
    if not obj: return False
    db.delete(obj)
    db.commit()
    return True
