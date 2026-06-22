from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
from database import get_db
from auth import get_current_user
from audit import log_action, actor

router = APIRouter(prefix="/admin", tags=["admin"])


def _require_admin(current_user: models.User):
    if current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")


@router.get("/audit-logs", response_model=List[schemas.AuditLogOut])
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    _require_admin(current_user)
    return db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).limit(500).all()


@router.get("/users", response_model=List[schemas.UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    _require_admin(current_user)
    log_action(db, current_user, f"{actor(current_user)} viewed user list")
    return db.query(models.User).order_by(models.User.created_at).all()


@router.put("/users/{user_id}/role", response_model=schemas.UserOut)
def update_user_role(
    user_id: int,
    data: schemas.UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    _require_admin(current_user)
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot change your own role")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = data.role
    db.commit()
    db.refresh(user)
    log_action(db, current_user, f"{actor(current_user)} changed {user.full_name}'s role to {data.role.value}")
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    _require_admin(current_user)
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    deleted_name = user.full_name
    deleted_email = user.email
    db.delete(user)
    db.commit()
    log_action(db, current_user, f"{actor(current_user)} deleted user {deleted_name} ({deleted_email})")


@router.get("/reports")
def get_reports(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    _require_admin(current_user)

    patients = db.query(models.Patient).all()
    rooms = db.query(models.Room).all()
    appointments = db.query(models.Appointment).all()
    users = db.query(models.User).all()

    patient_by_status = {}
    for s in models.PatientStatus:
        patient_by_status[s.value] = sum(1 for p in patients if p.status == s)

    room_by_status = {}
    for s in models.RoomStatus:
        room_by_status[s.value] = sum(1 for r in rooms if r.status == s)

    appt_by_status = {}
    for s in models.AppointmentStatus:
        appt_by_status[s.value] = sum(1 for a in appointments if a.status == s)

    user_by_role = {}
    for r in models.UserRole:
        user_by_role[r.value] = sum(1 for u in users if u.role == r)

    return {
        "totals": {
            "patients": len(patients),
            "rooms": len(rooms),
            "appointments": len(appointments),
            "users": len(users),
        },
        "patients_by_status": patient_by_status,
        "rooms_by_status": room_by_status,
        "appointments_by_status": appt_by_status,
        "users_by_role": user_by_role,
    }
