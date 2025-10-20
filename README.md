# PM Management Tool (FastAPI + React + PostgreSQL)

A lightweight, Dockerized project management system inspired by Jira — built with **FastAPI**, **React**, and **PostgreSQL**.  
It includes authentication, role-based access control, password management, task and project tracking, validation, and testing.  

---

## Overview

The app demonstrates a clean full-stack architecture for managing projects and tasks with user roles (`User`, `Manager`, `Admin`).  
It’s designed to be modular, testable, and production-ready, showcasing secure API design, a responsive SPA frontend, and CI-friendly test coverage.

---

## Quick Start (Docker)

```bash
# Build and start all services
docker compose up --build

# After containers are healthy:
# Backend API: http://localhost:8000/docs
# Frontend:    http://localhost:5173
# PGAdmin:     http://localhost:5050  (email: admin@admin.com, pass: admin)

```
---

## Default Users (Seeded Data)

| Role | Email | Password |
|------|--------|-----------|
| **Admin** | `admin@example.com` | `Admin123!` |
| **Manager** | `manager@example.com` | `Manager123!` |
| **User** | `user@example.com` | `User123!` |

---

## Role Permissions Overview

- **User** — can create and update their own tasks.  
- **Manager** — can do everything a user can, plus create/update projects and tasks.  
- **Admin** — has full access: can do everything that Manager can and also can manage user roles.  

---

## Testing

Run backend tests with **pytest**:

```bash
cd backend
python -m pytest
```

To include a coverage report:
```bash
python -m pytest --cov=app --cov-report=term-missing
```

The project also includes the report in the Report.md
