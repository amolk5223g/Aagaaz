from sqlalchemy.orm import Session
from typing import Optional, Any
from app.models import AuditLog

def log_audit(
    db: Session,
    action: str,
    target_entity: str,
    target_id: Optional[str] = None,
    actor_id: Optional[str] = None,
    actor_email: Optional[str] = None,
    actor_role: Optional[str] = None,
    details: Optional[dict] = None,
    ip_address: Optional[str] = None
):
    """Safely records an audit entry to the database."""
    try:
        log_entry = AuditLog(
            action=action,
            target_entity=target_entity,
            target_id=target_id,
            actor_id=actor_id,
            actor_email=actor_email,
            actor_role=actor_role,
            details=details,
            ip_address=ip_address
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[AUDIT LOG ERROR] Failed to record audit log: {e}")

