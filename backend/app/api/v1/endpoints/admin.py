from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from firebase_admin import firestore
from google.cloud.firestore_v1 import SERVER_TIMESTAMP
from datetime import datetime, time as dt_time, timezone

from app.api.deps import require_role
from app.services.firestore import get_db
from app.core.config import settings
import pandas as pd
from datetime import datetime, timedelta
# ... existing imports

router = APIRouter()

@router.get("/analytics/dashboard")
async def get_analytics_dashboard(
    user: dict = Depends(require_role("admin"))
):
    """
    Aggregates stats for the last 30 days:
    - Total Revenue (Upsells)
    - Total Covers (Guests)
    - Occupancy Rates
    - Daily Trends
    """
    db = get_db()
    
    # Date Range: Last 30 Days
    today = datetime.now()
    start_date = (today - timedelta(days=30)).strftime("%Y-%m-%d")
    end_date = today.strftime("%Y-%m-%d")

    # 1. Fetch Reservations
    res_docs = db.collection("reservations") \
        .where("date", ">=", start_date) \
        .where("status", "==", "confirmed") \
        .stream()

    total_revenue = 0.0
    total_guests = 0
    reservations_by_date = {} # { "2023-10-01": 12, ... }
    revenue_by_date = {}

    for doc in res_docs:
        data = doc.to_dict()
        d_date = data.get("date")
        guests = int(data.get("guests", 0))
        rev = float(data.get("upsell_total_price", 0.0))

        total_guests += guests
        total_revenue += rev

        # Aggregate for Charts
        reservations_by_date[d_date] = reservations_by_date.get(d_date, 0) + guests
        revenue_by_date[d_date] = revenue_by_date.get(d_date, 0.0) + rev

    # 2. Fetch Capacities (for Occupancy)
    # We only care about the next 7 days for occupancy forecast
    forecast_end = (today + timedelta(days=7)).strftime("%Y-%m-%d")
    cap_docs = db.collection("capacities") \
        .where("date", ">=", end_date) \
        .where("date", "<=", forecast_end) \
        .stream()
    
    occupancy_data = []
    
    for doc in cap_docs:
        data = doc.to_dict()
        cap = data.get("capacity", 0)
        res = data.get("reserved_guests", 0)
        pct = (res / cap * 100) if cap > 0 else 0
        
        occupancy_data.append({
            "date": data.get("date"),
            "restaurant": data.get("restaurant"),
            "occupancy": round(pct, 1),
            "reserved": res,
            "capacity": cap
        })

    # 3. Format Chart Data (Timeline)
    chart_data = []
    # Fill in last 30 days
    for i in range(30):
        d = (today - timedelta(days=30 - i)).strftime("%Y-%m-%d")
        chart_data.append({
            "date": d,
            "guests": reservations_by_date.get(d, 0),
            "revenue": revenue_by_date.get(d, 0)
        })

    return {
        "kpi": {
            "total_revenue": round(total_revenue, 2),
            "total_guests": total_guests,
            "reservation_count": len(chart_data) # roughly
        },
        "charts": {
            "timeline": chart_data,
            "occupancy": occupancy_data
        }
    }

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

@router.post("/upload-guestlist")
async def upload_guest_list(
    file: UploadFile = File(...),
    user: dict = Depends(require_role("admin", "reception"))
):
    """
    Parses an Excel file (Room, Last Name, VIP Level) and stores it in Firestore.
    """
    if not file.filename.endswith('.xlsx'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload .xlsx")

    try:
        # 1. Read Excel into Pandas DataFrame
        content = await file.read()
        df = pd.read_excel(io.BytesIO(content))
        
        # 2. Normalize Headers (ensure columns exist)
        # Expected columns: 'Room', 'Last Name', 'VIP'
        df.columns = [c.strip().lower().replace(' ', '_') for c in df.columns]
        
        required_cols = ['room', 'last_name']
        if not all(col in df.columns for col in required_cols):
            raise HTTPException(status_code=400, detail=f"Excel must contain columns: Room, Last Name. Found: {df.columns}")

        db = get_db()
        batch = db.batch()
        count = 0
        
        # 3. Clear old list (Optional: strictly depends on if you want to replace or append)
        # For a hotel, usually you replace the list daily. Deleting all is slow in Firestore.
        # For MVP, we will just Overwrite existing rooms or add new ones.
        
        collection_ref = db.collection("guest_list")

        for _, row in df.iterrows():
            room_num = str(row['room']).strip()
            last_name = str(row['last_name']).strip()
            vip_level = str(row.get('vip', 'Standard')).strip() # Default to Standard if empty
            
            # Create a searchable document ID based on Room Number
            # Logic: One room usually has one primary guest name we match against.
            doc_ref = collection_ref.document(room_num)
            
            batch.set(doc_ref, {
                "room": room_num,
                "last_name": last_name,
                "last_name_normalized": last_name.lower(), # Helper for case-insensitive match
                "vip_level": vip_level,
                "is_vip": vip_level.lower() not in ['standard', 'nan', 'none', '']
            })
            
            count += 1
            
            # Firestore batches are limited to 500 ops
            if count % 400 == 0:
                batch.commit()
                batch = db.batch()

        if count % 400 != 0:
            batch.commit()

        return {"message": f"Successfully processed {count} guests."}

    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
