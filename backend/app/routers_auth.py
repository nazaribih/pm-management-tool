from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from .database import get_db
from . import schemas, crud, security, models
from .deps import get_current_user
from .config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=schemas.UserOut)
def register(data: schemas.UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = crud.create_user(db, data)
    return user


@router.post("/login", response_model=schemas.TokenPair)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, form.username)
    if not user or not security.verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    access = security.create_token({"sub": str(user.id), "role": user.role.value}, settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh = security.create_token({"sub": str(user.id), "type": "refresh"}, settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    return {"access_token": access, "refresh_token": refresh, "token_type": "bearer"}


@router.post("/refresh", response_model=schemas.TokenPair)
def refresh(token: str, db: Session = Depends(get_db)):
    payload = security.verify_token(token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=400, detail="Invalid refresh token")
    user = db.query(models.User).get(int(payload["sub"]))
    access = security.create_token({"sub": str(user.id), "role": user.role.value}, settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh = security.create_token({"sub": str(user.id), "type": "refresh"}, settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    return {"access_token": access, "refresh_token": refresh, "token_type": "bearer"}


@router.get("/me", response_model=schemas.UserOut)
def me(user=Depends(get_current_user)):
    return user


@router.post("/password-reset/request")
def password_reset_request(payload: schemas.PasswordResetRequest, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, payload.email)
    if not user:
        return {"message": "If the email exists, a reset token has been issued."}
    token = security.create_token({"sub": str(user.id), "type": "reset"}, 30)
    user.reset_token = token
    db.commit()
    print(f"[DEMO] Password reset token for {user.email}: {token}")
    return {"message": "If the email exists, a reset token has been issued."}


@router.post("/password-reset/confirm")
def password_reset_confirm(payload: schemas.PasswordResetConfirm, db: Session = Depends(get_db)):
    data = security.verify_token(payload.token)
    if not data or data.get("type") != "reset":
        raise HTTPException(status_code=400, detail="Invalid reset token")
    user = db.query(models.User).get(int(data["sub"]))
    if not user or user.reset_token != payload.token:
        raise HTTPException(status_code=400, detail="Invalid reset token")
    user.hashed_password = security.hash_password(payload.new_password)
    user.reset_token = None
    db.commit()
    return {"message": "Password updated"}


@router.post("/change-password")
def change_password(
        payload: schemas.PasswordChange,
        user=Depends(get_current_user),
        db: Session = Depends(get_db)
):
    if not security.verify_password(payload.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    user.hashed_password = security.hash_password(payload.new_password)
    db.commit()
    return {"message": "Password updated"}
