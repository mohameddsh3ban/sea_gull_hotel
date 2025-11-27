# backend/app/api/v1/endpoints/restaurants.py
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.services.firestore import get_db
from app.models.restaurant import Restaurant
from app.api.deps import require_role # Import security dependency

router = APIRouter()

# 1. GET ALL (Public)
@router.get("/", response_model=List[Restaurant])
async def get_restaurants():
    """Get all active restaurants."""
    db = get_db()
    # Fetch all, frontend can filter by isActive if needed, 
    # or admin needs to see inactive ones too.
    docs = db.collection("restaurants").order_by("order").stream()
    
    results = []
    for doc in docs:
        results.append(doc.to_dict())
    return results

# 2. GET ONE (Public)
@router.get("/{restaurant_id}", response_model=Restaurant)
async def get_restaurant(restaurant_id: str):
    """Get details for a specific restaurant."""
    db = get_db()
    doc = db.collection("restaurants").document(restaurant_id).get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    return doc.to_dict()

# 3. CREATE (Admin Only)
@router.post("/", dependencies=[Depends(require_role("admin"))])
async def create_restaurant(restaurant: Restaurant):
    """Create a new restaurant."""
    db = get_db()
    
    doc_ref = db.collection("restaurants").document(restaurant.id)
    if doc_ref.get().exists:
        raise HTTPException(status_code=400, detail="Restaurant ID already exists")
    
    doc_ref.set(restaurant.model_dump())
    return {"message": "Restaurant created successfully", "id": restaurant.id}

# 4. UPDATE (Admin Only)
@router.put("/{restaurant_id}", dependencies=[Depends(require_role("admin"))])
async def update_restaurant(restaurant_id: str, restaurant: Restaurant):
    """Update an existing restaurant (Menu, Config, Media)."""
    db = get_db()
    
    doc_ref = db.collection("restaurants").document(restaurant_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    # Update the document
    doc_ref.set(restaurant.model_dump())
    return {"message": "Restaurant updated successfully"}

# 5. DELETE (Admin Only)
@router.delete("/{restaurant_id}", dependencies=[Depends(require_role("admin"))])
async def delete_restaurant(restaurant_id: str):
    """Delete a restaurant."""
    db = get_db()
    db.collection("restaurants").document(restaurant_id).delete()
    return {"message": "Restaurant deleted successfully"}
