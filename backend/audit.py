from sqlalchemy.orm import Session
import models


def actor(user) -> str:
    if user.role.value == 'doctor':
        return f"Dr. {user.full_name}"
    elif user.role.value == 'admin':
        return f"Admin {user.full_name}"
    else:
        return user.full_name


def log_action(db: Session, user, detail: str):
    entry = models.AuditLog(
        user_id=user.id,
        user_name=user.full_name,
        role=user.role.value,
        detail=detail,
    )
    db.add(entry)
    db.commit()
