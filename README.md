# Hospital Patient & Asset Tracker

A full-stack web app for managing hospital patients, rooms, equipment, appointments, and staff. Built with FastAPI (Python) on the backend and React on the frontend.

## Features

- **Patients** — admit, discharge, and track patient status (admitted, critical, stable, etc.)
- **Rooms** — manage room availability, occupancy, and maintenance
- **Assets** — track hospital equipment with serial numbers and assignment to rooms/patients
- **Appointments** — schedule and manage patient-doctor appointments
- **Doctors & Staff** — user management with role-based access
- **Audit Logs** — full history of all actions (admin only)
- **Auth** — login, registration, email verification, forgot/reset password, account lockout after 5 failed attempts

## Roles

| Role | Access |
|---|---|
| `admin` | Full access including audit logs and user management |
| `doctor` | Patients, appointments, rooms, assets |
| `staff` | Patients, rooms, assets |
| `patient` | Own appointments and health info (MyChart) |

## Tech Stack

**Backend**
- Python / FastAPI
- SQLAlchemy (SQLite database)
- JWT authentication (python-jose)
- Email via Gmail SMTP

**Frontend**
- React + Vite
- React Router

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/guado1983-star/hospital-app.git
cd hospital-app
```

### 2. Set up the backend

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` folder (use `.env.example` as a guide):

```
SECRET_KEY=your_secret_key_here
GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
FRONTEND_URL=http://localhost:5173
```

> For `GMAIL_APP_PASSWORD`, generate one at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) — do not use your regular Gmail password.

### 3. Set up the frontend

```bash
cd frontend
npm install
```

### 4. Run the app

Double-click `start.bat` (Windows) — it opens both the backend and frontend in separate terminals.

Or run them manually:

```bash
# Terminal 1 — backend
cd backend
uvicorn main:app --reload

# Terminal 2 — frontend
cd frontend
npm run dev
```

Open your browser at **http://localhost:5173**

## Default Admin Account

On first run, a default admin account is created automatically:

| Field | Value |
|---|---|
| Email | `admin@hospital.com` |
| Password | `admin123` |

Change the password after your first login.

## API Docs

FastAPI generates interactive API documentation automatically. Once the backend is running, visit:

- **http://localhost:8000/docs** — Swagger UI
- **http://localhost:8000/redoc** — ReDoc
