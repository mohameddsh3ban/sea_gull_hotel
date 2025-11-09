from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from firebase_admin import firestore
from google.cloud.firestore_v1 import SERVER_TIMESTAMP, Increment
from typing import Dict
import uuid
from datetime import datetime

from app.models.reservation import (
    ReservationCreate,
    ReservationResponse,
    ReservationFilter,
    PaginatedReservations
)
from app.api.deps import get_current_user, require_role
from app.services.email import send_confirmation_email
from app.services.firestore import get_db
from app.core.config import settings

router = APIRouter()

@router.post("/reservations", response_model=Dict[str, str])
async def create_reservation(
    data: ReservationCreate,
    background_tasks: BackgroundTasks
):
    """Create a new reservation with transactional safety."""
    db = get_db()
    
    # Generate cancel token
    cancel_token = str(uuid.uuid4())
    name = f"{data.first_name} {data.last_name}".strip()
    
    # Prepare reservation data
    reservation_data = {
        "name": name,
        "first_name": data.first_name,
        "last_name": data.last_name,
        "email": data.email,
        "room": data.room,
        "date": data.date,
        "time": data.time,
        "guests": data.guests,
        "restaurant": data.restaurant,
        "restaurantId": data.restaurant,
        "cancel_token": cancel_token,
        "main_courses": data.main_courses,
        "comments": data.comments or "",
        "upsell_items": data.upsell_items,
        "upsell_total_price": data.upsell_total_price,
        "status": "confirmed",
        "paid": False,
        "email_status": "pending",
        "created_at": SERVER_TIMESTAMP
    }
    
    capacity_key = f"{data.restaurant}_{data.date}"
    capacity_ref = db.collection("capacities").document(capacity_key)
    new_reservation_ref = db.collection("reservations").document()
    
    @firestore.async_transactional
    async def create_reservation_transaction(transaction, db_client):
        capacity_doc = await capacity_ref.get(transaction=transaction)
        
        if not capacity_doc.exists:
            raise ValueError(f"No capacity set for {data.restaurant} on {data.date}")
        
        capacity_data = capacity_doc.to_dict()
        total_capacity = capacity_data.get("capacity", 0)
        reserved_guests = capacity_data.get("reserved_guests", 0)
        
        if reserved_guests + data.guests > total_capacity:
            remaining = max(0, total_capacity - reserved_guests)
            raise ValueError(f"Only {remaining} seats available")
        
        # Update capacity atomically
        transaction.update(capacity_ref, {
            "reserved_guests": Increment(data.guests)
        })
        
        # Create reservation atomically
        transaction.set(new_reservation_ref, reservation_data)
        
        return new_reservation_ref.id
    
    try:
        reservation_id = await create_reservation_transaction(db.transaction(), db)
        
        # Queue email
        background_tasks.add_task(
            send_confirmation_email,
            email=data.email,
            name=name,
            reservation_id=reservation_id,
            **reservation_data
        )
        
        return {"message": "Reservation confirmed", "reservation_id": reservation_id}
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/reservations", response_model=PaginatedReservations)
async def list_reservations(
    filters: ReservationFilter = Depends(),
    user: dict = Depends(require_role("admin", "reception", "kitchen", "accounting"))
):
    """List reservations with server-side filtering and pagination."""
    db = get_db()
    
    # Build query
    query = db.collection("reservations")
    
    if filters.restaurant != "all":
        query = query.where("restaurant", "==", filters.restaurant)
    
    if filters.date != "all":
        query = query.where("date", "==", filters.date)
    elif filters.from_date and filters.to_date:
        query = query.where("date", ">=", filters.from_date).where("date", "<=", filters.to_date)
    elif filters.from_date:
        query = query.where("date", ">=", filters.from_date)
    
    query = query.order_by("date", direction=firestore.Query.DESCENDING)
    
    # Cursor-based pagination
    if filters.last_id:
        last_doc_ref = db.collection("reservations").document(filters.last_id)
        last_doc = await last_doc_ref.get()
        if last_doc.exists:
            query = query.start_after(last_doc)
    
    # Apply limit
    query = query.limit(filters.limit)
    
    # Execute query
    docs = [doc async for doc in query.stream()]
    
    # In-memory search filter (if needed, as Firestore doesn't support full-text search)
    if filters.search:
        search_lower = filters.search.lower()
        docs = [
            doc for doc in docs
            if search_lower in str(doc.to_dict().get("name", "")).lower()
            or search_lower in str(doc.to_dict().get("room", "")).lower()
        ]
    
    # Format
    reservations = [
        ReservationResponse(id=doc.id, **doc.to_dict())
        for doc in docs
    ]
    
    # Determine next_last_id for cursor-based pagination
    next_last_id = reservations[-1].id if reservations else None
    
    # For total_items and total_pages, a separate count query would be needed for true server-side pagination.
    # For simplicity, we'll return a basic pagination info.
    return PaginatedReservations(
        items=reservations,
        pagination={
            "current_page_items": len(reservations),
            "per_page": filters.limit,
            "next_last_id": next_last_id,
            "has_next": len(docs) == filters.limit # If we got 'limit' items, there might be more
        }
    )

@router.delete("/reservations/{reservation_id}")
async def cancel_reservation(
    reservation_id: str,
    user: dict = Depends(require_role("admin"))
):
    """Cancel a reservation (admin only)."""
    db = get_db()
    
    doc_ref = db.collection("reservations").document(reservation_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    data = doc.to_dict()
    
    # Update capacity
    capacity_key = f"{data['restaurant']}_{data['date']}"
    capacity_ref = db.collection("capacities").document(capacity_key)
    
    transaction = db.transaction()
    
    @firestore.transactional
    def cancel_transaction(transaction):
        capacity_doc = capacity_ref.get(transaction=transaction)
        if capacity_doc.exists:
            transaction.update(capacity_ref, {
                "reserved_guests": Increment(-int(data.get("guests", 0)))
            })
        transaction.delete(doc_ref)
    
    cancel_transaction(transaction)
    
    return {"message": "Reservation cancelled"}
