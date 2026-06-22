import math
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload
import models
import schemas


def get_all(db: Session, page: int, limit: int) -> schemas.PaginatedAssets:
    total = db.query(models.Asset).count()
    pages = math.ceil(total / limit) if total > 0 else 1
    skip = (page - 1) * limit
    items = (
        db.query(models.Asset)
        .options(joinedload(models.Asset.room), joinedload(models.Asset.patient))
        .offset(skip)
        .limit(limit)
        .all()
    )
    return schemas.PaginatedAssets(total=total, page=page, pages=pages, items=items)


def get_by_id(db: Session, asset_id: int) -> models.Asset:
    asset = (
        db.query(models.Asset)
        .options(joinedload(models.Asset.room), joinedload(models.Asset.patient))
        .filter(models.Asset.id == asset_id)
        .first()
    )
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


def create(db: Session, data: schemas.AssetCreate) -> models.Asset:
    if data.serial_number:
        existing = db.query(models.Asset).filter(
            models.Asset.serial_number == data.serial_number
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Serial number already exists")

    asset = models.Asset(**data.model_dump())
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


def update(db: Session, asset_id: int, data: schemas.AssetUpdate) -> models.Asset:
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(asset, field, value)

    db.commit()
    db.refresh(asset)
    return asset


def delete(db: Session, asset_id: int) -> None:
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    db.delete(asset)
    db.commit()
