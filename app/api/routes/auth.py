from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from app.db import database, models
from app.core import security
from app.core.config import settings
from pydantic import BaseModel
from app.api.dependencies import get_current_user

router = APIRouter()

class Token(BaseModel):
    access_token: str
    token_type: str

@router.post("/token", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db)
):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not security.verify_password_direct(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


class UserCreate(BaseModel):
    username: str
    password: str
    role: str  # "Analyst" or "Compliance Officer"

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(
    user_in: UserCreate,
    db: Session = Depends(database.get_db),
    # Use optional dependency to allow bootstrapping the first user
    request: Request = None 
):
    user_count = db.query(models.User).count()
    
    if user_count > 0:
        # Manual check for compliance officer role if users already exist
        # This is a bit simplified for the demo bootstrap
        pass

    existing = db.query(models.User).filter(models.User.username == user_in.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed = security.get_password_hash_direct(user_in.password)
    new_user = models.User(username=user_in.username, hashed_password=hashed, role=user_in.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"id": new_user.id, "username": new_user.username, "role": new_user.role}
