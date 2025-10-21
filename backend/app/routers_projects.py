from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from .database import get_db
from . import schemas, crud, models
from .deps import require_role, get_current_user

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("/", response_model=List[schemas.ProjectOut])
def list_projects(q: Optional[str] = None, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return crud.list_projects(db, q=q)


@router.post("/", response_model=schemas.ProjectOut,
             dependencies=[Depends(require_role(models.Role.manager, models.Role.admin))])
def create_project(data: schemas.ProjectCreate, db: Session = Depends(get_db)):
    return crud.create_project(db, data)


@router.put("/{pid}", response_model=schemas.ProjectOut,
            dependencies=[Depends(require_role(models.Role.manager, models.Role.admin))])
def update_project(pid: int, data: schemas.ProjectUpdate, db: Session = Depends(get_db)):
    obj = crud.update_project(db, pid, data)
    if not obj: raise HTTPException(404, "Project not found")
    return obj


@router.delete("/{pid}", dependencies=[Depends(require_role(models.Role.admin))])
def delete_project(pid: int, db: Session = Depends(get_db)):
    ok = crud.delete_project(db, pid)
    if not ok: raise HTTPException(404, "Project not found")
    return {"ok": True}
