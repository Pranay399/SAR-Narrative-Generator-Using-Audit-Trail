from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db import database, models
from app.api.dependencies import require_role, get_current_active_user
from app.core import security

router = APIRouter()

# All endpoints in this router require System Admin role
AdminOnly = Depends(require_role(["System Admin"]))


@router.get("/")
def list_all_users(
    db: Session = Depends(database.get_db),
    _: models.User = AdminOnly
):
    """System Admin: List all registered users."""
    users = db.query(models.User).order_by(models.User.id).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "role": u.role,
            "is_active": u.is_active,
        }
        for u in users
    ]


class RoleUpdate(BaseModel):
    role: str


@router.patch("/{user_id}/role")
def update_user_role(
    user_id: int,
    body: RoleUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role(["System Admin"]))
):
    """System Admin: Change a user's role."""
    valid_roles = ["Analyst", "Compliance Officer", "System Admin"]
    if body.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Choose from: {valid_roles}")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")

    user.role = body.role
    db.commit()
    return {"id": user.id, "username": user.username, "role": user.role}


@router.patch("/{user_id}/toggle-active")
def toggle_user_active(
    user_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role(["System Admin"]))
):
    """System Admin: Activate or deactivate a user account."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")

    user.is_active = not user.is_active
    db.commit()
    return {"id": user.id, "username": user.username, "is_active": user.is_active}


class CreateUserByAdmin(BaseModel):
    username: str
    password: str
    role: str


@router.post("/", status_code=201)
def create_user_by_admin(
    body: CreateUserByAdmin,
    db: Session = Depends(database.get_db),
    _: models.User = AdminOnly
):
    """System Admin: Create a new user with any role."""
    valid_roles = ["Analyst", "Compliance Officer", "System Admin"]
    if body.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role")

    existing = db.query(models.User).filter(models.User.username == body.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")

    hashed = security.get_password_hash_direct(body.password)
    new_user = models.User(username=body.username, hashed_password=hashed, role=body.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"id": new_user.id, "username": new_user.username, "role": new_user.role}
