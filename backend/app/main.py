from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import firebase_admin
from firebase_admin import credentials
import os
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.exceptions import AppException
from app.api.v1 import api_router
# from prometheus_fastapi_instrumentator import Instrumentator

# Lifespan context for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting up FastAPI application...")
    
    # Initialize Firebase
    cred = credentials.Certificate("service-account.json")
    firebase_admin.initialize_app(cred, {
        'storageBucket': settings.FIREBASE_STORAGE_BUCKET
    })
    print("✅ Firebase initialized")
    
    yield
    
    # Shutdown
    print("⬇️ Shutting down...")

# Initialize FastAPI
app = FastAPI(
    title="Restaurant Reservation API",
    description="Scalable API for managing restaurant reservations",
    version="2.0.0",
    lifespan=lifespan
)

# Instrumentator().instrument(app).expose(app)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Custom exception handler
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.message, "detail": exc.detail}
    )

# Include API routes
app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "2.0.0"}
