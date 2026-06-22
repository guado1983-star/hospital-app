import math
from fastapi import HTTPException
from sqlalchemy.orm import Session
import models
import schemas


def get_all(db: Session, page: int, limit: int) -> schemas.PaginatedRooms:
    total = db.query(models.Room).count()
    pages = math.ceil(total / limit) if total > 0 else 1
    skip = (page - 1) * limit
    items = db.query(models.Room).offset(skip).limit(limit).all()
    return schemas.PaginatedRooms(total=total, page=page, pages=pages, items=items)


def get_by_id(db: Session, room_id: int) -> models.Room:
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room


def create(db: Session, data: schemas.RoomCreate) -> models.Room:
    existing = db.query(models.Room).filter(models.Room.room_number == data.room_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Room number already exists")

    room = models.Room(**data.model_dump())
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


def update(db: Session, room_id: int, data: schemas.RoomUpdate) -> models.Room:
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(room, field, value)

    db.commit()
    db.refresh(room)
    return room


def delete(db: Session, room_id: int) -> None:
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    db.delete(room)
    db.commit()
