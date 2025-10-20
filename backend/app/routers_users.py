from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .database import get_db
from . import schemas, crud, models
from .deps import require_role

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=List[schemas.UserOut], dependencies=[Depends(require_role(models.Role.admin))])
def list_users(db: Session = Depends(get_db)):
    return crud.list_users(db)


@router.patch("/{uid}/role", response_model=schemas.UserOut, dependencies=[Depends(require_role(models.Role.admin))])
def change_role(uid: int, payload: schemas.UserRoleUpdate, db: Session = Depends(get_db)):
    user = crud.update_user_role(db, uid, payload.role)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
