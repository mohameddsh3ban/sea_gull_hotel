from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import firestore
from google.cloud.firestore_v1 import Increment
from datetime import datetime, timedelta

from app.api.deps import require_role
from app.services.firestore import get_db

router = APIRouter()

@router.get("/capacities/overview")
async def get_capacities_overview():
    """Get capacity overview as a list for the dashboard."""
    db = get_db()
    
    docs = db.collection("capacities").stream()
    result = []
    
    for doc in docs:
        data = doc.to_dict()
        result.append(data)
    
    return result

@router.get("/capacities")
async def get_capacities():
    """Get all capacities with reserved counts."""
    db = get_db()
    
    result = {}
    docs = db.collection("capacities").stream()
    
    for doc in docs:
        data = doc.to_dict()
        key = f"{data['restaurant']}_{data['date']}"
        result[key] = {
            "capacity": data.get("capacity", 0),
            "reserved_guests": data.get("reserved_guests", 0),
            "available": data.get("capacity", 0) - data.get("reserved_guests", 0)
        }
    
    return result

@router.post("/capacities", dependencies=[Depends(require_role("admin"))])
async def save_capacities(capacities: dict):
    """Save capacities with validation."""
    db = get_db()
    
    # Validate date range (only allow next 6 days)
    today = datetime.today()
    allowed_dates = [(today + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(6)]
    
    batch = db.batch()
    
    for key, value in capacities.items():
        restaurant, date = key.split('_')
        
        if date not in allowed_dates:
            continue
        
        new_capacity = int(value)
        doc_ref = db.collection("capacities").document(key)
        
        # Check if we can safely update
        doc = doc_ref.get()
        if doc.exists:
            current_data = doc.to_dict()
            reserved = current_data.get("reserved_guests", 0)
            
            if new_capacity < reserved:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot reduce capacity for {restaurant} on {date}. "
                           f"Already {reserved} guests reserved, cannot set to {new_capacity}."
                )
            
            batch.update(doc_ref, {"capacity": new_capacity})
        else:
            batch.set(doc_ref, {
                "restaurant": restaurant,
                "date": date,
                "capacity": new_capacity,
                "reserved_guests": 0
            })
    
    batch.commit()
    return {"message": "Capacities saved successfully"}
