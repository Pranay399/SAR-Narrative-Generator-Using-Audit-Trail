from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base
from app.api.routes import auth, upload, cases, explanation

# Create all DB tables on startup
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    pass

app = FastAPI(
    title="SAR Narrative Generator API",
    description="Backend API for the SAR Narrative Generator with Audit Trail",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Register Routers ----
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(upload.router, prefix="/api/v1/upload", tags=["Upload Case"])
app.include_router(cases.router, prefix="/api/v1/cases", tags=["Cases"])
app.include_router(explanation.router, prefix="/api/v1/explanation", tags=["Explanation"])

@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "message": "SAR Narrative Generator API is running."}
