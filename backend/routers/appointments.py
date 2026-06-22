from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
from database import get_db
from auth import get_current_user
from audit import log_action, actor

router = APIRouter(prefix="/appointments", tags=["appointments"])


@router.post("/", response_model=schemas.AppointmentOut, status_code=status.HTTP_201_CREATED)
def book_appointment(
    data: schemas.AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.patient:
        raise HTTPException(status_code=403, detail="Only patients can book appointments")

    doctor = db.query(models.User).filter(
        models.User.id == data.doctor_id,
        models.User.role == models.UserRole.doctor
    ).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    conflict = db.query(models.Appointment).filter(
        models.Appointment.doctor_id == data.doctor_id,
        models.Appointment.date == data.date,
        models.Appointment.time_slot == data.time_slot,
        models.Appointment.status != models.AppointmentStatus.cancelled,
    ).first()
    if conflict:
        raise HTTPException(status_code=400, detail="That time slot is already booked")

    appointment = models.Appointment(
        patient_id=current_user.id,
        doctor_id=data.doctor_id,
        date=data.date,
        time_slot=data.time_slot,
        notes=data.notes,
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    log_action(db, current_user, f"{actor(current_user)} booked appointment with Doctor #{data.doctor_id} on {data.date} at {data.time_slot}")
    return appointment


@router.get("/mine", response_model=List[schemas.AppointmentOut])
def my_appointments(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role == models.UserRole.patient:
        return db.query(models.Appointment).filter(
            models.Appointment.patient_id == current_user.id
        ).order_by(models.Appointment.date, models.Appointment.time_slot).all()

    if current_user.role == models.UserRole.doctor:
        return db.query(models.Appointment).filter(
            models.Appointment.doctor_id == current_user.id
        ).order_by(models.Appointment.date, models.Appointment.time_slot).all()

    raise HTTPException(status_code=403, detail="Admins use /appointments/all")


@router.get("/all", response_model=List[schemas.AppointmentOut])
def all_appointments(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role == models.UserRole.patient:
        raise HTTPException(status_code=403, detail="Access denied")
    return db.query(models.Appointment).order_by(
        models.Appointment.date, models.Appointment.time_slot
    ).all()


@router.put("/{appointment_id}", response_model=schemas.AppointmentOut)
def update_appointment(
    appointment_id: int,
    data: schemas.AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    appt = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if current_user.role == models.UserRole.doctor and appt.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your appointment")

    if current_user.role == models.UserRole.patient and appt.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your appointment")

    appt.status = data.status
    db.commit()
    db.refresh(appt)
    log_action(db, current_user, f"{actor(current_user)} updated Appointment #{appointment_id} status to {data.status.value}")
    return appt
