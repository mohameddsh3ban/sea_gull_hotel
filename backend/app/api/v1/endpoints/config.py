from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict
from app.api.deps import require_role
from app.services.firestore import get_db
from app.models.config import RestaurantConfig

router = APIRouter()

@router.get("/config", response_model=Dict[str, RestaurantConfig])
async def get_configs():
    """Get configurations for all restaurants (Public/Guest)."""
    db = get_db()
    docs = db.collection("restaurant_configs").stream()
    
    configs = {}
    for doc in docs:
        data = doc.to_dict()
        configs[doc.id] = data
        
    return configs

@router.post("/config", dependencies=[Depends(require_role("admin"))])
async def update_config(config: RestaurantConfig):
    """Update a specific restaurant configuration (Admin only)."""
    db = get_db()
    
    # Store config using the restaurantId as the Document ID
    doc_ref = db.collection("restaurant_configs").document(config.restaurantId)
    doc_ref.set(config.model_dump())
    
    return {"message": "Configuration saved", "config": config}
