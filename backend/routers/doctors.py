from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/doctors", tags=["doctors"])

ALL_SLOTS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"]


@router.get("/", response_model=List[schemas.UserOut])
def list_doctors(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.User).filter(models.User.role == models.UserRole.doctor).all()


@router.get("/{doctor_id}/slots")
def get_available_slots(
    doctor_id: int,
    date: str = Query(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    booked = db.query(models.Appointment).filter(
        models.Appointment.doctor_id == doctor_id,
        models.Appointment.date == date,
        models.Appointment.status != models.AppointmentStatus.cancelled,
    ).all()
    booked_slots = {a.time_slot for a in booked}
    return {"slots": [s for s in ALL_SLOTS if s not in booked_slots]}
