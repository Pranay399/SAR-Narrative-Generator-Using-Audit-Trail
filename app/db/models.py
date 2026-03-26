from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False) # e.g., "Analyst", "Compliance Officer"
    is_active = Column(Boolean, default=True)

class CaseData(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    case_reference = Column(String, unique=True, index=True)
    customer_id = Column(String, index=True)
    status = Column(String, default="Pending") # Pending, Generated, Reviewed
    
    # Store raw or processed data briefly for regeneration if needed
    raw_data = Column(JSON, nullable=True)
    
    # The final output
    generated_sar = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Foreign key for analyst assignment (Customer-level Isolation/case visibility)
    assigned_analyst_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    analyst = relationship("User", foreign_keys=[assigned_analyst_id])

class AuditLog(Base):
    """
    MLflow will track experimentation, but this PostgreSQL table logs
    Generated SAR narratives, reason codes, and who generated/edited them.
    This fulfills the 'PostgreSQL Audit Logs Generated SAR Narrative Stored' requirement.
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    
    action = Column(String) # e.g., "SAR_GENERATED", "NARRATIVE_EDITED"
    details = Column(Text)  # JSON string of reason codes or what was edited
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    case = relationship("CaseData")
    user = relationship("User")
