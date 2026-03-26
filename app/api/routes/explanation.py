from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import database, models
from app.api.dependencies import get_current_active_user
from app.llm.chains import generate_explanation

router = APIRouter()

@router.get("/{case_id}")
def get_explanation(
    case_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    See Explanation — calls Mistral AI (via Ollama) to generate a human-readable
    explanation of why the case was flagged, using stored feature data.
    This replicates the SHAP 'Convert field to Narrative / Why it was flagged' step.
    """
    case = db.query(models.CaseData).filter(models.CaseData.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    if not case.raw_data:
        raise HTTPException(status_code=400, detail="No feature data available for explanation.")

    features = case.raw_data.get("features", {})

    # Derive SHAP-style feature importance from feature values  
    # In production, you'd compute real SHAP values from an ML model here
    feature_importance = {}
    if isinstance(features, list) and len(features) > 0:
        f = features[0]
        feature_importance = {
            "txn_frequency_score": f.get("txn_frequency_score", 0),
            "total_foreign_transfers": f.get("total_foreign_transfers", 0),
            "smurfing_flags": f.get("smurfing_flags", 0),
            "rapid_movement_flags": f.get("rapid_movement_flags", 0),
            "large_txns_count": f.get("large_txns_count", 0),
        }

    explanation = generate_explanation(features, feature_importance)

    if case.explanation != explanation:
        case.explanation = explanation
        db.commit()

    return {
        "case_id": case.id,
        "case_reference": case.case_reference,
        "feature_importance": feature_importance or {},
        "explanation": explanation
    }
