from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from models import UserRole, PatientStatus, RoomStatus, AssetStatus, AppointmentStatus


# --- Auth ---
class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: UserRole = UserRole.staff


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserRoleUpdate(BaseModel):
    role: UserRole


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


# --- Rooms ---
class RoomBase(BaseModel):
    room_number: str
    floor: int
    capacity: int = 1
    status: RoomStatus = RoomStatus.available


class RoomCreate(RoomBase):
    pass


class RoomUpdate(BaseModel):
    room_number: Optional[str] = None
    floor: Optional[int] = None
    capacity: Optional[int] = None
    status: Optional[RoomStatus] = None


class RoomOut(RoomBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Patients ---
class PatientBase(BaseModel):
    full_name: str
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    room_id: Optional[int] = None
    status: PatientStatus = PatientStatus.admitted
    diagnosis: Optional[str] = None


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    room_id: Optional[int] = None
    status: Optional[PatientStatus] = None
    diagnosis: Optional[str] = None
    discharged_date: Optional[datetime] = None


class PatientOut(PatientBase):
    id: int
    user_id: Optional[int] = None
    admitted_date: datetime
    discharged_date: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    room: Optional[RoomOut] = None

    class Config:
        from_attributes = True


# --- Assets ---
class AssetBase(BaseModel):
    name: str
    asset_type: str
    serial_number: Optional[str] = None
    room_id: Optional[int] = None
    patient_id: Optional[int] = None
    status: AssetStatus = AssetStatus.available
    notes: Optional[str] = None


class AssetCreate(AssetBase):
    pass


class AssetUpdate(BaseModel):
    name: Optional[str] = None
    asset_type: Optional[str] = None
    serial_number: Optional[str] = None
    room_id: Optional[int] = None
    patient_id: Optional[int] = None
    status: Optional[AssetStatus] = None
    notes: Optional[str] = None


class AssetOut(AssetBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    room: Optional[RoomOut] = None
    patient: Optional["PatientOut"] = None

    class Config:
        from_attributes = True


AssetOut.model_rebuild()


# --- Appointments ---
class AppointmentCreate(BaseModel):
    doctor_id: int
    date: str
    time_slot: str
    notes: Optional[str] = None


class AppointmentUpdate(BaseModel):
    status: AppointmentStatus


class AppointmentOut(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    date: str
    time_slot: str
    status: AppointmentStatus
    notes: Optional[str] = None
    created_at: datetime
    patient: UserOut
    doctor: UserOut

    class Config:
        from_attributes = True


# --- Audit Logs ---
class AuditLogOut(BaseModel):
    id: int
    timestamp: datetime
    user_name: str
    role: str
    detail: str

    class Config:
        from_attributes = True


# --- Paginated Responses ---
class PaginatedPatients(BaseModel):
    total: int
    page: int
    pages: int
    items: List[PatientOut]


class PaginatedRooms(BaseModel):
    total: int
    page: int
    pages: int
    items: List[RoomOut]


class PaginatedAssets(BaseModel):
    total: int
    page: int
    pages: int
    items: List[AssetOut]
