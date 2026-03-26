from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.db import database, models
from app.api.dependencies import get_current_active_user, require_role

router = APIRouter()

class NarrativeUpdate(BaseModel):
    narrative: str
    edit_reason: Optional[str] = "Manual review edit"

@router.get("/")
def list_cases(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Lists cases. Analysts see only their own; Compliance Officers see all (Customer-level Isolation).
    """
    if current_user.role == "Compliance Officer":
        cases = db.query(models.CaseData).all()
    else:
        cases = db.query(models.CaseData).filter(
            models.CaseData.assigned_analyst_id == current_user.id
        ).all()

    return [
        {
            "id": c.id,
            "case_reference": c.case_reference,
            "customer_id": c.customer_id,
            "status": c.status,
            "created_at": c.created_at,
        }
        for c in cases
    ]

@router.get("/{case_id}")
def get_case(
    case_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """View Generated SAR for a specific case."""
    case = db.query(models.CaseData).filter(models.CaseData.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    if current_user.role != "Compliance Officer" and case.assigned_analyst_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return {
        "id": case.id,
        "case_reference": case.case_reference,
        "status": case.status,
        "generated_sar": case.generated_sar,
        "raw_data": case.raw_data,
        "created_at": case.created_at,
    }

@router.patch("/{case_id}/narrative")
def edit_narrative(
    case_id: int,
    update: NarrativeUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Edit Narrative - allows analysts/compliance officers to refine the generated SAR text."""
    case = db.query(models.CaseData).filter(models.CaseData.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    case.generated_sar = update.narrative
    case.status = "Reviewed"
    db.commit()

    audit = models.AuditLog(
        case_id=case.id,
        user_id=current_user.id,
        action="NARRATIVE_EDITED",
        details=update.edit_reason
    )
    db.add(audit)
    db.commit()

    return {"message": "Narrative updated successfully."}

@router.get("/{case_id}/download", response_class=PlainTextResponse)
def download_sar_report(
    case_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Download SAR Report as plain text."""
    case = db.query(models.CaseData).filter(models.CaseData.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    if not case.generated_sar:
        raise HTTPException(status_code=400, detail="SAR has not been generated yet.")

    report_text = f"""
SAR NARRATIVE REPORT
====================
Case Reference: {case.case_reference}
Customer ID   : {case.customer_id}
Status        : {case.status}
Generated On  : {case.created_at}

--- NARRATIVE ---
{case.generated_sar}
"""
    return report_text
