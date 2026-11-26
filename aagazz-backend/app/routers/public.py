from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Event
from app.schemas import EventResponse

router = APIRouter(prefix="/api/v1/events", tags=["Public Events"])

@router.get("/active", response_model=EventResponse)
def get_active_event(db: Session = Depends(get_db)):
    """Returns the primary active event for AAGAZZ 2K26."""
    event = db.query(Event).order_by(Event.created_at.desc()).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active event found"
        )
    return event

