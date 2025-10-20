
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

Each user has a description with his rights in the top right corner. The views and availability of the functions is distributed accordingly.
  
- Login screen (email + password). Initial passwords for all three created users are displayed for simplicity
- <img width="1470" height="596" alt="image" src="https://github.com/user-attachments/assets/f92c1b83-6039-4052-8acc-641dfb8c7235"/>

- Admin overview with filterable projects list, create form, and task list
- <img width="1018" height="765" alt="image" src="https://github.com/user-attachments/assets/1ee88628-249b-43e7-8ceb-be63bf03a91c" />

- Team access management (Admin view)
- <img width="480" height="325" alt="image" src="https://github.com/user-attachments/assets/86f6b253-5685-4044-854f-f14a005e6a49" />

- Update password. Each password should be at leas 8 characters long, with at least one lower/upper-case letter and a special character
- <img width="510" height="309" alt="image" src="https://github.com/user-attachments/assets/ca842eed-267b-4223-852b-358c36554004" />

- Manager view
- <img width="1073" height="377" alt="image" src="https://github.com/user-attachments/assets/bf79f8e2-f3b0-4c71-8950-18ddaf4b3211" />

- User view
- <img width="1056" height="739" alt="image" src="https://github.com/user-attachments/assets/221fc69f-c423-487c-9a6c-0abfcc36b993" />



## Tests
- `test_auth.py`: registration (not in the UI), login, profile fetch, password change, and admin role management
- `test_projects.py`: auth required + manager-only creation
- `test_tasks.py`: user creates/updates tasks
- `test_utils.py`

- 86% coverage achieved
- <img width="1280" height="388" alt="image" src="https://github.com/user-attachments/assets/c6aec162-26a6-4ff7-beff-b95d49938ae0" />

Run with coverage:
```bash
cd backend
pytest --cov=app
```
