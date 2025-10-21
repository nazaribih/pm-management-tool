from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .config import settings
from .database import Base, engine, SessionLocal
from . import models
from .routers_auth import router as auth_router
from .routers_projects import router as projects_router
from .routers_tasks import router as tasks_router
from .routers_users import router as users_router
from .security import hash_password

app = FastAPI(title="PM-management-tool API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


def seed():
    db: Session = SessionLocal()
    try:
        if not db.query(models.User).filter_by(email="admin@example.com").first():
            db.add(models.User(email="admin@example.com", hashed_password=hash_password("Admin123!"),
                               role=models.Role.admin))
        if not db.query(models.User).filter_by(email="manager@example.com").first():
            db.add(models.User(email="manager@example.com", hashed_password=hash_password("Manager123!"),
                               role=models.Role.manager))
        if not db.query(models.User).filter_by(email="user@example.com").first():
            db.add(
                models.User(email="user@example.com", hashed_password=hash_password("User123!"), role=models.Role.user))
        db.commit()

        if db.query(models.Project).count() == 0:
            p1 = models.Project(name="Website Revamp", description="New marketing site")
            p2 = models.Project(name="Mobile App", description="Customer app v1")
            db.add_all([p1, p2]);
            db.commit()
            db.add_all([
                models.Task(title="Landing page", project_id=p1.id, owner_id=1),
                models.Task(title="Auth flow", project_id=p2.id, owner_id=2, status=models.TaskStatus.doing),
                models.Task(title="Push notifications", project_id=p2.id, owner_id=3, status=models.TaskStatus.todo),
            ])
            db.commit()
    finally:
        db.close()


seed()


@app.get("/health")
def health():
    return {"ok": True}


app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(tasks_router)
app.include_router(users_router)
