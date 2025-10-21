from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from .database import get_db
from . import schemas, crud, models
from .deps import require_role, get_current_user

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/", response_model=List[schemas.TaskOut])
def list_tasks(status: Optional[models.TaskStatus] = None, project_id: Optional[int] = None,
               db: Session = Depends(get_db), user=Depends(get_current_user)):
    return crud.list_tasks(db, status=status, project_id=project_id)


@router.post("/", response_model=schemas.TaskOut,
             dependencies=[Depends(require_role(models.Role.user, models.Role.manager, models.Role.admin))])
def create_task(data: schemas.TaskCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return crud.create_task(db, owner_id=user.id, data=data)


@router.put("/{tid}", response_model=schemas.TaskOut,
            dependencies=[Depends(require_role(models.Role.user, models.Role.manager, models.Role.admin))])
def update_task(tid: int, data: schemas.TaskUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    obj = crud.update_task(db, tid, data)
    if not obj: raise HTTPException(404, "Task not found")
    return obj


@router.delete("/{tid}", dependencies=[Depends(require_role(models.Role.manager, models.Role.admin))])
def delete_task(tid: int, db: Session = Depends(get_db)):
    ok = crud.delete_task(db, tid)
    if not ok: raise HTTPException(404, "Task not found")
    return {"ok": True}
