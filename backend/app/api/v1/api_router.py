from fastapi import APIRouter

from app.api.v1.endpoints import reservations
from app.api.v1.endpoints import capacities
from app.api.v1.endpoints import reviews
from app.api.v1.endpoints import admin
from app.api.v1.endpoints import auth
from app.api.v1.endpoints import config

api_router = APIRouter()
api_router.include_router(reservations.router, tags=["reservations"])
api_router.include_router(capacities.router, tags=["capacities"])
api_router.include_router(reviews.router, tags=["reviews"])
api_router.include_router(admin.router, tags=["admin"])
api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(config.router, tags=["config"])
