from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .seed_data import seed_database
from .api import auth, leads, scoring, filters, duplicates, pipeline, imports, analytics, tasks

# Initialize FastAPI App
app = FastAPI(
    title="Lead Intelligence & CRM System API",
    description="Engine-driven B2B Lead Intelligence, Dynamic Scoring Rules, AST Filter Engine, Duplicate Deduplication, and CRM Pipeline API.",
    version="1.0.0"
)

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup Database Initialization & Auto-Seeding
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    seed_database()

# Register Routers
app.include_router(auth.router)
app.include_router(leads.router)
app.include_router(scoring.router)
app.include_router(filters.router)
app.include_router(duplicates.router)
app.include_router(pipeline.router)
app.include_router(imports.router)
app.include_router(analytics.router)
app.include_router(tasks.router)

@app.get("/")
def root():
    return {
        "status": "online",
        "system": "Lead Intelligence & CRM System",
        "version": "1.0.0",
        "admin_credentials": {
            "email": "admin@admin.com",
            "password": "admin@access.com"
        }
    }
