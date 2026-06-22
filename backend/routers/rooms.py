from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import models
import schemas
from database import get_db
from auth import get_current_user
from controllers import room_controller

router = APIRouter(prefix="/rooms", tags=["rooms"])


def _require_admin(current_user: models.User):
    if current_user.role not in (models.UserRole.admin, models.UserRole.staff, models.UserRole.doctor):
        raise HTTPException(status_code=403, detail="Access denied")


def _require_not_patient(current_user: models.User):
    if current_user.role == models.UserRole.patient:
        raise HTTPException(status_code=403, detail="Access denied")


@router.get("/", response_model=schemas.PaginatedRooms)
def list_rooms(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    _require_not_patient(current_user)
    return room_controller.get_all(db, page, limit)


@router.post("/", response_model=schemas.RoomOut, status_code=status.HTTP_201_CREATED)
def create_room(
    data: schemas.RoomCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    _require_admin(current_user)
    return room_controller.create(db, data)


@router.get("/{room_id}", response_model=schemas.RoomOut)
def get_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    _require_not_patient(current_user)
    return room_controller.get_by_id(db, room_id)


@router.put("/{room_id}", response_model=schemas.RoomOut)
def update_room(
    room_id: int,
    data: schemas.RoomUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    _require_admin(current_user)
    return room_controller.update(db, room_id, data)


@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    _require_admin(current_user)
    room_controller.delete(db, room_id)
