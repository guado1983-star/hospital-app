from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import models
import schemas
from database import get_db
from auth import get_current_user
from controllers import asset_controller

router = APIRouter(prefix="/assets", tags=["assets"])


def _require_admin(current_user: models.User):
    if current_user.role not in (models.UserRole.admin, models.UserRole.staff, models.UserRole.doctor):
        raise HTTPException(status_code=403, detail="Access denied")


def _require_not_patient(current_user: models.User):
    if current_user.role == models.UserRole.patient:
        raise HTTPException(status_code=403, detail="Access denied")


@router.get("/", response_model=schemas.PaginatedAssets)
def list_assets(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    _require_not_patient(current_user)
    return asset_controller.get_all(db, page, limit)


@router.post("/", response_model=schemas.AssetOut, status_code=status.HTTP_201_CREATED)
def create_asset(
    data: schemas.AssetCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    _require_admin(current_user)
    return asset_controller.create(db, data)


@router.get("/{asset_id}", response_model=schemas.AssetOut)
def get_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    _require_not_patient(current_user)
    return asset_controller.get_by_id(db, asset_id)


@router.put("/{asset_id}", response_model=schemas.AssetOut)
def update_asset(
    asset_id: int,
    data: schemas.AssetUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    _require_admin(current_user)
    return asset_controller.update(db, asset_id, data)


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    _require_admin(current_user)
    asset_controller.delete(db, asset_id)
