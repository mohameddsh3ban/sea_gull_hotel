from fastapi import APIRouter, Depends, HTTPException, Request
from firebase_admin import firestore
from google.cloud.firestore_v1 import SERVER_TIMESTAMP
from datetime import datetime, timedelta, time as dt_time
import secrets

from app.api.deps import require_role
from app.services.email import send_review_request_email
from app.services.firestore import get_db
from app.core.config import settings

router = APIRouter()

def generate_review_token():
    return secrets.token_urlsafe(24)

@router.post("/tasks/send-review-requests")
async def send_review_requests(request: Request):
    """Cron job to send review emails for yesterday's reservations."""
    # This endpoint should be protected by a cron secret or similar mechanism
    # For now, we'll assume it's called internally or by a trusted cron service
    # if not require_cron_secret():
    #     raise HTTPException(status_code=401, detail="Unauthorized")
    
    db = get_db()
    
    now_local = datetime.now(tz=settings.LOCAL_TIMEZONE)
    yesterday = (now_local - timedelta(days=1)).date()
    yesterday_str = yesterday.isoformat()
    
    query = (db.collection("reservations")
        .where("status", "==", "confirmed")
        .where("review.requestSent", "==", False)
        .where("date", "==", yesterday_str))
    
    batch = db.batch()
    sent = 0
    failures = []
    
    for doc in query.stream():
        data = doc.to_dict()
        email = data.get("email")
        name = data.get("name")
        restaurant = data.get("restaurantId")
        
        if not email or not restaurant:
            continue
        
        token = generate_review_token()
        
        try:
            send_review_request_email(email, name, restaurant, token)
            batch.update(doc.reference, {
                "review.requestSent": True,
                "review.requestSentAt": SERVER_TIMESTAMP,
                "review.token": token
            })
            sent += 1
        except Exception as e:
            failures.append({"id": doc.id, "error": str(e)})
    
    if sent > 0:
        batch.commit()
    
    return {"sent": sent, "failed": failures}

@router.post("/reviews/submit")
async def submit_review(payload: dict):
    """Submit a review."""
    db = get_db()
    
    token = payload.get("token")
    rating = payload.get("rating")
    comment = (payload.get("comment") or "").strip() or None
    
    if not token or not isinstance(rating, int) or rating < 1 or rating > 10:
        raise HTTPException(status_code=400, detail="Invalid input")
    
    # Find reservation
    res_query = db.collection("reservations").where("review.token", "==", token).limit(1)
    res_docs = list(res_query.stream())
    
    if not res_docs:
        raise HTTPException(status_code=404, detail="Invalid token")
    
    res_doc = res_docs[0]
    res_data = res_doc.to_dict()
    
    # Check if already reviewed
    if res_data.get("review", {}).get("received"):
        return {"message": "Already reviewed"}
    
    # Save review
    db.collection("restaurant_reviews").add({
        "reservationId": res_doc.id,
        "restaurantId": res_data.get("restaurantId"),
        "rating": rating,
        "comment": comment,
        "createdAt": SERVER_TIMESTAMP,
        "guestName": res_data.get("name"),
        "guestEmail": res_data.get("email"),
        "room": res_data.get("room"),
        "dinnerDate": res_data.get("date")
    })
    
    # Update reservation
    res_doc.reference.update({
        "review.received": True,
        "review.receivedAt": SERVER_TIMESTAMP
    })
    
    return {"message": "Review submitted"}
