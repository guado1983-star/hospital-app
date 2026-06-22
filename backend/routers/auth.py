from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
import models
import schemas
import auth as auth_utils
from database import get_db
from email_utils import send_reset_password_email
from audit import log_action, actor

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    if auth_utils.get_user_by_email(db, user_data.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=auth_utils.hash_password(user_data.password),
        role=user_data.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    log_action(db, user, f"New {user.role.value} account registered: {user.email}")
    return user


MAX_ATTEMPTS = 5
LOCKOUT_MINUTES = 15

@router.post("/login", response_model=schemas.Token)
def login(credentials: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = auth_utils.get_user_by_email(db, credentials.email)

    if user and user.locked_until and user.locked_until > datetime.utcnow():
        remaining = max(1, int((user.locked_until - datetime.utcnow()).total_seconds() / 60) + 1)
        raise HTTPException(status_code=423, detail=f"Account locked. Try again in {remaining} minute(s).")

    authenticated = auth_utils.authenticate_user(db, credentials.email, credentials.password)

    if not authenticated:
        if user:
            user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
            if user.failed_login_attempts >= MAX_ATTEMPTS:
                user.locked_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_MINUTES)
                db.commit()
                log_action(db, user, f"{actor(user)} account locked after {MAX_ATTEMPTS} failed attempts")
                raise HTTPException(status_code=423, detail=f"Account locked for {LOCKOUT_MINUTES} minutes after {MAX_ATTEMPTS} failed attempts.")
            db.commit()
            log_action(db, user, f"Failed login attempt {user.failed_login_attempts}/{MAX_ATTEMPTS} for {user.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    authenticated.failed_login_attempts = 0
    authenticated.locked_until = None
    authenticated.last_login = datetime.utcnow()
    db.commit()

    token = auth_utils.create_access_token(
        data={"sub": authenticated.email},
        expires_delta=timedelta(minutes=auth_utils.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    log_action(db, authenticated, f"{actor(authenticated)} logged in")
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(auth_utils.get_current_user)):
    return current_user


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(payload: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = auth_utils.get_user_by_email(db, payload.email)
    if user:
        token = secrets.token_urlsafe(32)
        user.reset_password_token = token
        db.commit()
        send_reset_password_email(user.email, user.full_name, token)
    return {"message": "If that email exists, a reset link has been sent."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(payload: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.reset_password_token == payload.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")
    user.hashed_password = auth_utils.hash_password(payload.new_password)
    user.reset_password_token = None
    db.commit()
    log_action(db, user, f"{actor(user)} changed their password")
    return {"message": "Password updated successfully."}
