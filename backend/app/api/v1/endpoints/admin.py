from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import firestore
from google.cloud.firestore_v1 import SERVER_TIMESTAMP
from datetime import datetime, time as dt_time, timezone

from app.api.deps import require_role
from app.services.firestore import get_db
from app.core.config import settings

router = APIRouter()

@router.patch("/reservations/{reservation_id}/payment")
async def update_payment_status(
    reservation_id: str,
    payload: dict,
    user: dict = Depends(require_role("reception", "admin"))
):
    """Update payment status."""
    db = get_db()
    
    if "paid" not in payload:
        raise HTTPException(status_code=400, detail="Field 'paid' is required")
    
    doc_ref = db.collection("reservations").document(reservation_id)
    
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    doc_ref.update({
        "paid": bool(payload["paid"]),
        "payment_updated_at": SERVER_TIMESTAMP,
        "payment_updated_by": user.get("uid")
    })
    
    return {"message": "Payment status updated"}

@router.post("/cancel-reservation-admin/{reservation_id}")
async def cancel_reservation_admin(
    reservation_id: str,
    user: dict = Depends(require_role("admin"))
):
    """Admin-initiated cancellation of a reservation."""
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
                "reserved_guests": firestore.Increment(-int(data.get("guests", 0)))
            })
        transaction.delete(doc_ref)
    
    cancel_transaction(transaction)
    
    return {"message": "Reservation cancelled by admin"}
