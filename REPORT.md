
# Short Report

## Idea Outline
A small project management app showcasing role-based access control (RBAC):
- **Users** authenticate and create/update their own tasks.
- **Managers** additionally create/update projects and delete tasks.
- **Admins** gain everything managers have plus project deletion and team-role management.

## Dataflow
```
[Frontend React Forms] --(AJAX JSON)--> [FastAPI Routers]
   -> [Dependencies: JWT, Role checks]
   -> [CRUD Services] -> [SQLAlchemy ORM] -> [PostgreSQL]
   <-(JSON responses)--
```

## Main Views (Screenshots)
> Placeholders (once running, capture via browser DevTools or OS screenshot):
- Login screen (email + password)
- Projects list (filterable) + create form
- Tasks list (filterable) + create form
- Password change modal-style card
- Admin team management panel
- Responsive layouts: desktop and mobile breakpoints

## Tests
- `test_auth.py`: registration, login, profile fetch, password change, and admin role management
- `test_projects.py`: auth required + manager-only creation
- `test_tasks.py`: user creates/updates tasks
Run with coverage:
```bash
cd backend
pytest --cov=app
```
