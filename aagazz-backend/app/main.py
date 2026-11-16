from contextlib import asynccontextmanager
from datetime import date, time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models import Event, UserRole
from app.security import hash_password

from app.routers import public, auth, students, volunteer, admin

def seed_initial_data():
    """Initializes tables and seeds default records if database is empty."""
    try:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            # 1. Seed Event
            existing_event = db.query(Event).first()
            if not existing_event:
                default_event = Event(
                    id="a0000000-0000-0000-0000-000000000001",
                    title="AAGAZZ 2K26",
                    department="AI & DS",
                    college="S. G. Balekundri Institute of Technology, Belagavi",
                    batch="2025–29",
                    event_date=date(2026, 11, 20),
                    start_time=time(10, 0, 0),
                    end_time=time(14, 0, 0),
                    venue="C102, Department of AI & DS",
                    is_registration_open=True
                )
                db.add(default_event)
                print("[INIT] Created official AAGAZZ 2K26 Event")

            # 2. Seed Default Admin & Volunteer
            existing_admin = db.query(UserRole).filter(UserRole.email == "admin@sgbit.edu.in").first()
            if not existing_admin:
                admin_user = UserRole(
                    id="b0000000-0000-0000-0000-000000000001",
                    email="admin@sgbit.edu.in",
                    hashed_password=hash_password("Aagazz@2026"),
                    full_name="Prof. Neha Jadhav (Admin)",
                    role="ADMIN",
                    is_active=True
                )
                db.add(admin_user)
                print("[INIT] Created default Admin: admin@sgbit.edu.in / Aagazz@2026")

            existing_volunteer = db.query(UserRole).filter(UserRole.email == "volunteer@sgbit.edu.in").first()
            if not existing_volunteer:
                volunteer_user = UserRole(
                    id="b0000000-0000-0000-0000-000000000002",
                    email="volunteer@sgbit.edu.in",
                    hashed_password=hash_password("Volunteer@2026"),
                    full_name="Shubham Kadam (Volunteer)",
                    role="VOLUNTEER",
                    is_active=True
                )
                db.add(volunteer_user)
                print("[INIT] Created default Volunteer: volunteer@sgbit.edu.in / Volunteer@2026")

            db.commit()
        except Exception as e:
            db.rollback()
            print(f"[INIT ERROR] Failed during data seeding: {e}")
        finally:
            db.close()
    except Exception as e:
        print(f"[INIT ERROR] Database connection or table creation failed on startup: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    seed_initial_data()
    yield

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Backend API for AAGAZZ 2K26 Student Food Coupon & Admin Scanner Portals",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(public.router)
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(volunteer.router)
app.include_router(admin.router)

@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "event": "AAGAZZ 2K26 - Freshers' Function",
        "department": "AI & DS, SGBIT Belagavi",
        "status": "online",
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    db_status = "connected"
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
    except Exception as e:
        db_status = f"error: {str(e)}"
    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "database": db_status
    }

