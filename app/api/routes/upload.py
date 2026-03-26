import os
import shutil
import uuid
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.db import database, models
from app.api.dependencies import get_current_active_user
from app.engine.processing import process_case_data
from app.engine.tracking import log_experiment
from app.llm.rag import initialize_rag_pipeline, retrieve_aml_context
from app.llm.chains import generate_sar_narrative

router = APIRouter()

UPLOAD_DIR = "data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Initialize the RAG pipeline once on module load
rag_index = initialize_rag_pipeline()

def _run_pipeline(file_path: str, case_id: int, db: Session):
    """Background task: runs the full AML + LLM pipeline on an uploaded file."""
    print(f"🎬 Starting background pipeline for Case ID: {case_id}")
    try:
        case = db.query(models.CaseData).filter(models.CaseData.id == case_id).first()
        if not case:
            print("❌ Case not found in database.")
            return

        print("🔍 Step 1: Running AML Feature Engineering...")
        file_ext = os.path.splitext(file_path)[1].lower().lstrip(".")
        features = process_case_data(file_path, format=file_ext)
        print(f"✅ Features engineered: {len(features)} records.")

        print("📚 Step 2: Retrieving AML Context (RAG)...")
        aml_context = retrieve_aml_context(
            f"Suspicious activity: smurfing and rapid movements for account {case.customer_id}",
            rag_index
        )
        print("✅ RAG context retrieved.")

        print("🤖 Step 3: Generating SAR Narrative (Ollama)...")
        narrative = generate_sar_narrative(features, aml_context)
        print("✅ Narrative generation complete.")

        print("💾 Step 4: Saving results and updating status...")
        case.generated_sar = narrative
        case.raw_data = {"features": features}
        case.status = "Generated"
        db.commit()

        log_experiment(
            run_name=f"case_{case.case_reference}",
            parameters={"model": "llama3.1", "case_ref": case.case_reference},
            metrics={
                "txn_frequency": features[0].get("txn_frequency_score", 0) if features else 0,
                "foreign_transfers": features[0].get("total_foreign_transfers", 0) if features else 0,
            }
        )

        audit = models.AuditLog(
            case_id=case.id,
            user_id=case.assigned_analyst_id,
            action="SAR_GENERATED",
            details=f"Narrative generated via Ollama llama3.1 with {len(features)} feature rows."
        )
        db.add(audit)
        db.commit()
        print(f"🎉 Pipeline finished successfully for Case {case.case_reference}")
    except Exception as e:
        print(f"❌ Background pipeline error: {e}")
        case = db.query(models.CaseData).filter(models.CaseData.id == case_id).first()
        if case:
            case.status = f"Error: {str(e)[:200]}"
            db.commit()


@router.post("/")
async def upload_suspicious_case(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Upload a suspicious case file (CSV or JSON with transaction data).
    Triggers the PySpark AML processing + LangChain SAR generation pipeline in the background.
    """
    if not file.filename.endswith((".csv", ".json")):
        raise HTTPException(status_code=400, detail="Only CSV and JSON files are accepted.")

    case_ref = f"SAR-{uuid.uuid4().hex[:8].upper()}"
    save_path = os.path.join(UPLOAD_DIR, f"{case_ref}_{file.filename}")

    with open(save_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    new_case = models.CaseData(
        case_reference=case_ref,
        customer_id="PENDING",
        status="Processing",
        assigned_analyst_id=current_user.id
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    background_tasks.add_task(_run_pipeline, save_path, new_case.id, db)

    return {
        "message": "File uploaded. SAR generation pipeline started.",
        "case_reference": case_ref,
        "case_id": new_case.id
    }
