
# PM-management-tool (FastAPI + React + PostgreSQL)

A project management demo inspired by Jira with authentication, password management, role-based access (User / Manager / Admin),
filterable project/task tables, validation, admin-only role management, tests, and Dockerized deployment.

## Features Checklist
- ✅ Login, register, password reset (email token simulated to console/log for demo)
- ✅ Change password from the UI without leaving the workspace
- ✅ Roles: `user`, `manager`, `admin` (RBAC enforced in backend dependencies)
- ✅ Authenticated access to restricted resources (JWT, access/refresh)
- ✅ Two tables with filterable listings: **Projects** and **Tasks**
- ✅ Create / Update records (with role restrictions)
- ✅ Admin-only team management: list users and promote/demote roles
- ✅ Frontend SPA (React + Tailwind) — responsive & aesthetically clean
- ✅ Form validation (frontend: zod + react-hook-form; backend: Pydantic)
- ✅ AJAX via `fetch` (JSON APIs)
- ✅ Good practices: services/crud, schemas, deps, .env, typing, 12-factor-ish
- ✅ Dockerized with `docker-compose` (backend, frontend, postgres, pgadmin)
- ✅ Tests: unit + integration via `pytest` + `pytest-cov` (aim ~70% coverage)
- ✅ Short report with idea outline, dataflow, and main view screenshots (placeholders)

## Quick Start (Docker)
```bash
# 1) Copy the example envs
cp backend/.env.example backend/.env

# 2) Build & start
docker compose up --build

# 3) App URLs (after containers are healthy)
# Backend API: http://localhost:8000/docs
# Frontend:    http://localhost:5173
# PGAdmin:     http://localhost:5050  (email: admin@admin.com, pass: admin)
```

## Local Dev (without Docker)
### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```
### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Default Users (seeded)
- **Admin**: `admin@example.com` / `Admin123!`
- **Manager**: `manager@example.com` / `Manager123!`
- **User**: `user@example.com` / `User123!`

> Password reset workflow logs the reset token to the backend console for demo.

### Understanding the roles
- **User** — creates and updates personal tasks.
- **Manager** — everything a user can do, plus create/update projects and delete tasks.
- **Admin** — everything a manager can do, plus delete projects and change other users' roles.

---

See `REPORT.md` for the short report (idea outline, dataflow, screenshots).
