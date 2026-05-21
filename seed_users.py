"""
Seed script: ensures 3 demo accounts exist and the admin account has System Admin role.
Run from the project root: python seed_users.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal, engine, Base
from app.db import models
from app.core.security import get_password_hash_direct

Base.metadata.create_all(bind=engine)

DEMO_USERS = [
    {"username": "analyst@fintrace.com",    "password": "Analyst123!",    "role": "Analyst"},
    {"username": "compliance@fintrace.com", "password": "Compliance123!", "role": "Compliance Officer"},
    {"username": "admin@fintrace.com",      "password": "Admin123!",      "role": "System Admin"},
]

def seed():
    db = SessionLocal()
    try:
        for u in DEMO_USERS:
            existing = db.query(models.User).filter(models.User.username == u["username"]).first()
            if existing:
                # Update role to ensure it matches
                existing.role = u["role"]
                existing.is_active = True
                db.commit()
                print(f"[UPDATED] {u['username']} -> role={u['role']}")
            else:
                hashed = get_password_hash_direct(u["password"])
                new_user = models.User(
                    username=u["username"],
                    hashed_password=hashed,
                    role=u["role"]
                )
                db.add(new_user)
                db.commit()
                print(f"[CREATED] {u['username']} -> role={u['role']}")

        print("\nDemo accounts ready:")
        print("  analyst@fintrace.com    / Analyst123!    -> Analyst")
        print("  compliance@fintrace.com / Compliance123! -> Compliance Officer")
        print("  admin@fintrace.com      / Admin123!      -> System Admin")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
