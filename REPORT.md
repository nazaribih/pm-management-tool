
# Short Report

## Idea Outline
A small project management app showcasing role-based access control (RBAC):
- **Users** can authenticate and create/update their own tasks.
- **Managers** can additionally create/update projects and delete tasks.
- **Admins** have full rights, including deleting projects.

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
- Responsive layouts: desktop and mobile breakpoints

## Tests
- `test_auth.py`: registration and login flow
- `test_projects.py`: auth required + manager-only creation
- `test_tasks.py`: user creates/updates tasks
Run with coverage:
```bash
cd backend
pytest --cov=app
```
