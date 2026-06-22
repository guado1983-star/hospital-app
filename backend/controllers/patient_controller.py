import math
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload
import models
import schemas


def get_all(db: Session, page: int, limit: int, search: str = '', status: str = '') -> schemas.PaginatedPatients:
    query = db.query(models.Patient).options(joinedload(models.Patient.room))
    if search:
        query = query.filter(models.Patient.full_name.ilike(f'%{search}%'))
    if status:
        query = query.filter(models.Patient.status == status)
    total = query.count()
    pages = math.ceil(total / limit) if total > 0 else 1
    skip = (page - 1) * limit
    items = query.offset(skip).limit(limit).all()
    return schemas.PaginatedPatients(total=total, page=page, pages=pages, items=items)


def get_by_id(db: Session, patient_id: int) -> models.Patient:
    patient = (
        db.query(models.Patient)
        .options(joinedload(models.Patient.room), joinedload(models.Patient.assets))
        .filter(models.Patient.id == patient_id)
        .first()
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


def create(db: Session, data: schemas.PatientCreate) -> models.Patient:
    if data.room_id:
        room = db.query(models.Room).filter(models.Room.id == data.room_id).first()
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")

    patient = models.Patient(**data.model_dump())
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


def update(db: Session, patient_id: int, data: schemas.PatientUpdate) -> models.Patient:
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(patient, field, value)

    db.commit()
    db.refresh(patient)
    return patient


def delete(db: Session, patient_id: int) -> None:
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    db.delete(patient)
    db.commit()
