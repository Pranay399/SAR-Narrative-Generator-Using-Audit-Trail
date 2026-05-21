"""Check admin password and fix it + update all demo passwords."""
import sqlite3
import bcrypt

DB_PATH = "sar_app.db"

DEMO_USERS = [
    {"username": "analyst@fintrace.com",    "password": "Analyst123!",    "role": "Analyst"},
    {"username": "compliance@fintrace.com", "password": "Compliance123!", "role": "Compliance Officer"},
    {"username": "admin@fintrace.com",      "password": "Admin123!",      "role": "System Admin"},
]

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

print("=== Current Users ===")
cur.execute("SELECT id, username, hashed_password, role, is_active FROM users")
rows = cur.fetchall()
for row in rows:
    print(f"  ID={row[0]} | {row[1]} | role={row[3]} | active={row[4]}")

print("\n=== Testing admin password ===")
admin_row = next((r for r in rows if r[1] == "admin@fintrace.com"), None)
if admin_row:
    for p in ["Admin123!", "admin@fintrace.com", "password", "admin123"]:
        ok = verify_password(p, admin_row[2])
        print(f"  '{p}': {'MATCH' if ok else 'no'}")

print("\n=== Fixing all demo passwords and roles ===")
for u in DEMO_USERS:
    new_hash = hash_password(u["password"])
    cur.execute(
        "UPDATE users SET hashed_password=?, role=?, is_active=1 WHERE username=?",
        (new_hash, u["role"], u["username"])
    )
    if cur.rowcount == 0:
        cur.execute(
            "INSERT INTO users (username, hashed_password, role, is_active) VALUES (?,?,?,1)",
            (u["username"], new_hash, u["role"])
        )
        print(f"  [CREATED] {u['username']} -> {u['role']}")
    else:
        print(f"  [FIXED]   {u['username']} -> {u['role']} / password reset")

conn.commit()
conn.close()

print("\nAll demo accounts ready:")
print("  analyst@fintrace.com    / Analyst123!")
print("  compliance@fintrace.com / Compliance123!")
print("  admin@fintrace.com      / Admin123!")
