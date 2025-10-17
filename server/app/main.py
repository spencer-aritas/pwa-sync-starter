# server/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from server.app.routers import baseline
from .settings import settings
from .models.db import engine, Base
from .jobs.scheduler import start_scheduler
from server.app.api.sync import sf_router
from server.app.db import init_schema_and_seed
import uuid
from .api import sync, device, health

init_schema_and_seed()

app = FastAPI(title="TGTHR Sync API", version="0.1.0")
app.include_router(sf_router, prefix="/api")
app.include_router(baseline.router)
# Initialize DB schema
Base.metadata.create_all(bind=engine)

# CORS for local dev (adjust for prod)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://localhost:5174",
        "http://localhost:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers under /api
app.include_router(sync.router, prefix="/api")
app.include_router(device.router, prefix="/api")
app.include_router(health.router, prefix="/api")

# Simple top-level health
@app.get("/health")
def healthcheck():
    return {"ok": True}

# Start background jobs once per process (avoids double-start with --reload)
@app.on_event("startup")
def _startup():
    start_scheduler()
