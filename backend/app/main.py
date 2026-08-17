import traceback
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .database import engine, Base
from .seed_data import seed_database
from .api import auth, leads, scoring, filters, duplicates, pipeline, imports, analytics, tasks

# Initialize FastAPI App
app = FastAPI(
    title="Lead Intelligence & CRM System API",
    description="Engine-driven B2B Lead Intelligence, Dynamic Scoring Rules, AST Filter Engine, Duplicate Deduplication, and CRM Pipeline API.",
    version="1.0.0"
)

# Global exception handler — ensures all 500s return JSON with CORS headers
# (Starlette's default ServerErrorMiddleware returns plain text which breaks the frontend)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    tb = traceback.format_exc()
    print(f"[ERROR] Unhandled exception on {request.method} {request.url}:\n{tb}")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "type": type(exc).__name__},
        headers={"Access-Control-Allow-Origin": "*"}
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
