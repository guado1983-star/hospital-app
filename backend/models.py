from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    staff = "staff"
    doctor = "doctor"
    patient = "patient"


class PatientStatus(str, enum.Enum):
    admitted = "admitted"
    discharged = "discharged"
    critical = "critical"
    stable = "stable"
    observation = "observation"


class RoomStatus(str, enum.Enum):
    available = "available"
    occupied = "occupied"
    maintenance = "maintenance"
    reserved = "reserved"


class AssetStatus(str, enum.Enum):
    available = "available"
    in_use = "in_use"
    maintenance = "maintenance"
    retired = "retired"


class AppointmentStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    cancelled = "cancelled"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.staff)
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_token = Column(String, nullable=True)
    reset_password_token = Column(String, nullable=True)
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime, nullable=True)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String, unique=True, nullable=False, index=True)
    floor = Column(Integer, nullable=False)
    capacity = Column(Integer, default=1)
    status = Column(Enum(RoomStatus), default=RoomStatus.available)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    patients = relationship("Patient", back_populates="room")
    assets = relationship("Asset", back_populates="room")


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, unique=True)
    full_name = Column(String, nullable=False)
    date_of_birth = Column(String)
    gender = Column(String)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)
    status = Column(Enum(PatientStatus), default=PatientStatus.admitted)
    diagnosis = Column(String)
    admitted_date = Column(DateTime(timezone=True), server_default=func.now())
    discharged_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    room = relationship("Room", back_populates="patients")
    assets = relationship("Asset", back_populates="patient")


class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    asset_type = Column(String, nullable=False)
    serial_number = Column(String, unique=True, nullable=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    status = Column(Enum(AssetStatus), default=AssetStatus.available)
    notes = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    room = relationship("Room", back_populates="assets")
    patient = relationship("Patient", back_populates="assets")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    user_id = Column(Integer, nullable=True)
    user_name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    detail = Column(String, nullable=False)


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(String, nullable=False)
    time_slot = Column(String, nullable=False)
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.pending)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("User", foreign_keys=[patient_id])
    doctor = relationship("User", foreign_keys=[doctor_id])
