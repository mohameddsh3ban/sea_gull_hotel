# 🔽 Import required libraries
from flask import Flask, request, jsonify
import firebase_admin
from firebase_admin import credentials, firestore
from flask_cors import CORS
import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv
import base64
import json
import uuid, threading # MODIFIED
from datetime import datetime, timedelta, timezone, time as dt_time
from werkzeug.utils import secure_filename
from firebase_admin import storage
import pandas as pd
from io import BytesIO
from rapidfuzz import fuzz
import re
import requests
import secrets
from dateutil import tz
from google.cloud.firestore_v1 import Query
from google.cloud.firestore_v1 import SERVER_TIMESTAMP
from google.api_core.exceptions import FailedPrecondition, GoogleAPICallError

# NEW: Import transactional decorator and Increment
from firebase_admin.firestore import transactional, Increment




# 🔄 Load environment variables
load_dotenv()
ADMIN_SECRET = os.getenv("ADMIN_SECRET")
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")
CRON_SECRET = os.getenv("CRON_SECRET", "")


# 🔐 Decode and initialize Firebase Admin
firebase_json_b64 = os.getenv("FIREBASE_CREDENTIALS_B64")
if not firebase_json_b64:
    raise Exception("FIREBASE_CREDENTIALS_B64 is not set.")

firebase_dict = json.loads(base64.b64decode(firebase_json_b64))

cred = credentials.Certificate(firebase_dict)
app_instance = firebase_admin.initialize_app(cred, {
    'storageBucket': 'hotel-backend-87480.firebasestorage.app'
})

db = firestore.client()
bucket = storage.bucket(app=app_instance)

# ---- Auth helpers: verify Firebase ID token + role guard ----
from functools import wraps
from firebase_admin import auth as admin_auth

def verify_firebase_token():
    """Reads Bearer token from Authorization header and returns (decoded_token, error_response_or_None)."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None, (jsonify({"error": "missing Authorization Bearer token"}), 401)
    id_token = auth_header.split(" ", 1)[1].strip()
    try:
        decoded = admin_auth.verify_id_token(id_token, check_revoked=True)
        return decoded, None
    except Exception as e:
        return None, (jsonify({"error": f"invalid token: {str(e)}"}), 401)

def require_role(*roles):
    """Decorator to enforce one of the allowed roles from custom claims 'role'."""
    def _wrap(fn):
        @wraps(fn)
        def _inner(*args, **kwargs):
            decoded, error = verify_firebase_token()
            if error:
                return error
            role = (decoded.get("role") or decoded.get("claims", {}).get("role") or "guest")
            if roles and role not in roles:
                return jsonify({"error": "forbidden: role not allowed", "role": role}), 403
            # attach user info for handlers if needed
            request.user = {
                "uid": decoded.get("uid"),
                "email": decoded.get("email"),
                "role": role,
            }
            return fn(*args, **kwargs)
        return _inner
    return _wrap



# 🚀 Initialize Flask app
app = Flask(__name__)

# ✅ CORS setup
CORS(app, resources={r"/*": {
    "origins": [
        "https://fir-restaurant-reservati-5ac70.web.app",
        "http://localhost:5173",
    ],
    "methods": ["GET", "POST", "DELETE", "OPTIONS", "PATCH"],
    "allow_headers": ["Content-Type", "Authorization"]


}}, supports_credentials=True)

ALLOWED_ORIGINS = [
    "https://fir-restaurant-reservati-5ac70.web.app",
    "http://localhost:5173",
]

@app.after_request
def add_cors_headers(resp):
    origin = request.headers.get("Origin")
    if origin in ALLOWED_ORIGINS:
        resp.headers["Access-Control-Allow-Origin"] = origin
        resp.headers["Vary"] = "Origin"
        resp.headers["Access-Control-Allow-Credentials"] = "true"
        resp.headers["Access-Control-Allow-Methods"] = "GET,POST,DELETE,OPTIONS,PATCH"
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"

    return resp

def is_valid_origin():
    origin = request.headers.get("Origin")
    return origin in ALLOWED_ORIGINS

def require_cron_secret():
    key = request.headers.get("X-CRON-KEY", "")
    return bool(CRON_SECRET and key == CRON_SECRET)

@app.route("/<path:path>", methods=["OPTIONS"])
def handle_options(path):
    return '', 204

MAILGUN_API_KEY = os.getenv("MAILGUN_API_KEY")
MAILGUN_DOMAIN = os.getenv("MAILGUN_DOMAIN")


#send confirmation email using mailgun
def send_confirmation_email(to_email, name, date, time, guests, room, restaurant, cancel_token, main_courses=None, upsell_items=None, upsell_total_price=None):
    # 🍽 Main course section
    main_course_html = ""
    if restaurant.lower() in ['chinese', 'indian', 'italian'] and main_courses:
        def display_course(c):
            # prettify: "petto_chicken" -> "Petto di Pollo (Chicken Breast)"
            if c.strip().lower() == 'petto_chicken':
                return "Petto di Pollo (Chicken Breast)"
            elif c.strip().lower() == 'quatro_formagi':
                return "Quattro Formaggi"
            elif c.strip().lower() == 'chicken_pizza':
                return "Chicken Pizza"
            return c.replace('_', ' ').title()

        course_list_html = "<ul style='margin-top: 4px; padding-left: 20px;'>"
        for i, course in enumerate(main_courses, 1):
            course_list_html += f"<li>Guest {i}: {display_course(course)}</li>"
        course_list_html += "</ul>"
        main_course_html = f"<p><strong>🍽 Main Course(s):</strong> {course_list_html}</p>"

    # 🍣 Sushi section
    sushi_html = ""
    if upsell_items:
        sushi_list_html = "<ul style='margin-top: 4px; padding-left: 20px;'>"
        for item_name, qty in upsell_items.items():
            sushi_list_html += f"<li>{item_name} × {qty}</li>"
        sushi_list_html += "</ul>"
        sushi_html = f"<p><strong>🍣 Sushi Order:</strong> {sushi_list_html}</p>"

        if upsell_total_price and upsell_total_price > 0:
            sushi_html += f"<p><strong>💰 Sushi Total:</strong> {upsell_total_price:.2f} $</p>"

    # 📧 Final HTML content
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <h1 style="text-align: center; color: #333;">Reservation Confirmation</h1>
        <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
          <p>Hello <strong>{name}</strong>,</p>
          <p>Thank you for booking a table at <strong>Seagull Restaurants</strong>!</p>
          <hr style="margin: 20px 0;">
          <p><strong>📍 Restaurant:</strong> {restaurant.capitalize()}</p>
          <p><strong>🔢 Room:</strong> {room}</p>
          <p><strong>🗓 Date:</strong> {date}</p>
          <p><strong>⏰ Time:</strong> {time}</p>
          {main_course_html}
          {sushi_html}
          <p><strong>👥 Guests:</strong> {guests}</p>
          <hr style="margin: 20px 0;">
          <p>We look forward to serving you.</p>
          <p style="margin-top: 20px;">
            If you need to cancel your reservation, click below:<br>
            <a href="{FRONTEND_BASE_URL}/cancel/{cancel_token}" style="color: #d9534f; text-decoration: underline;">
              Cancel Reservation
            </a>
          </p>
          <p style="margin-top: 30px;">Best regards,<br>Seagull Hotel Team</p>
        </div>
      </body>
    </html>
    """

    response = requests.post(
        f"https://api.mailgun.net/v3/{MAILGUN_DOMAIN}/messages",
        auth=("api", MAILGUN_API_KEY),
        data={
            "from": f"Seagull Restaurant Reservations <reservations@{MAILGUN_DOMAIN}>",
            "to": [to_email],
            "subject": "Reservation Confirmation",
            "html": html_content
        }
    )
    response.raise_for_status()

# NEW: Wrapper for running email sending in a background thread
def send_email_in_background(app_context, *args):
    """Pushes an app context to a new thread to run a function."""
    with app_context:
        try:
            send_confirmation_email(*args)
            print(f"✅ Background email sent to {args[0]}")
        except Exception as e:
            print(f"❌ Failed to send background email to {args[0]}: {e}")

# Timezone for "yesterday" window (Cairo hotel local time)
LOCAL_TZ = tz.gettz("Africa/Cairo")
FRONTEND_BASE_URL = "https://fir-restaurant-reservati-5ac70.web.app"


def generate_review_token():
    return secrets.token_urlsafe(24)

def send_review_request_email(to_email: str, guest_name: str | None, restaurant: str, token: str):
    review_url = f"{FRONTEND_BASE_URL}/review/{token}"
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f7f7f7; padding: 20px;">
        <div style="max-width: 640px; margin: auto; background: #ffffff; padding: 24px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.06);">
          <h2 style="margin: 0 0 12px; color: #0C6DAE;">How was your dinner at {restaurant} Restaurant?</h2>
          <p style="margin: 0 0 16px;">{('Hello ' + guest_name + ',') if guest_name else 'Hello,'}</p>
          <p style="margin: 0 0 16px;">We’d love a quick 1–10 rating of your experience. It takes ~10 seconds.</p>
          <p style="margin: 0 0 20px;">
            <a href="{review_url}" style="display:inline-block; padding:12px 18px; border-radius:8px; text-decoration:none; background:#0C6DAE; color:#fff;">
              Rate your dinner
            </a>
          </p>
          <p style="margin: 0; color:#666;">Thank you for dining with us at Seagull Beach Resort.</p>
        </div>
      </body>
    </html>
    """

    resp = requests.post(
        f"https://api.mailgun.net/v3/{MAILGUN_DOMAIN}/messages",
        auth=("api", MAILGUN_API_KEY),
        data={
            "from": f"Seagull Restaurant Reviews <reviews@{MAILGUN_DOMAIN}>",
            "to": [to_email],
            "subject": f"Rate your {restaurant} dinner (1–10)",
            "html": html_content
        },
        timeout=15
    )
    resp.raise_for_status()


# 📩 Make a reservation
@app.route("/reserve", methods=["POST"])
def reserve():
    if not is_valid_origin():
        return jsonify({"error": "Unauthorized origin"}), 403
    try:
        data = request.get_json()

        # NEW: Get the application context for the background thread
        current_app_context = app.app_context()

        # ✅ Required fields
        cancel_token = str(uuid.uuid4())
        data["cancel_token"] = cancel_token

        required = ['date', 'time', 'guests', 'room', 'email', 'restaurant']
        if not all(key in data for key in required):
            return jsonify({"error": "Missing reservation fields"}), 400

        # 👤 Construct full name
        first_name = data.get("first_name", "").strip()
        last_name = data.get("last_name", "").strip()
        name = f"{first_name} {last_name}".strip()

        # Fallback: use provided name or email prefix if name is missing
        if not name:
            name = data.get("name", "").strip()
        if not name:
            name = data.get("email", "").split("@")[0].replace(".", " ").title()

        data["name"] = name  # Ensure correct name is stored

        # 🕛 Date and room normalization
        room = str(data['room']).strip()
        date = data['date']

        # Build a timezone-aware datetime from the incoming date+time in Cairo TZ, then convert to UTC
        time_str = data['time']  # e.g. "19:00"
        year, month, day = map(int, date.split("-"))
        hour, minute = map(int, time_str.split(":"))

        dinner_local = datetime(year, month, day, hour, minute, tzinfo=LOCAL_TZ)
        dinner_utc = dinner_local.astimezone(tz.UTC)

        # store both for convenience (UTC for queries, originals for UI)
        data["dinnerAt"] = dinner_utc
        data["dinnerAtLocal"] = dinner_local.isoformat()

        # 🚫 Prevent duplicate booking for same room and date
        existing_room_reservation = db.collection("reservations") \
            .where("room", "==", room) \
            .where("date", "==", date) \
            .limit(1) \
            .stream()

        if any(existing_room_reservation):
            return jsonify({"error": "This room has already booked a restaurant today."}), 400

        restaurant_raw = data['restaurant'].strip()
        restaurant_lower = restaurant_raw.lower()
        guests = int(data.get('guests', 0))

        # Normalize a stable restaurant id field for analytics & reviews
        data["restaurantId"] = restaurant_raw  # e.g., "Italian", "Chinese", etc.

        # --- review tracking defaults (used by the email-sender + submit endpoints) ---
        data["review"] = {
            "requestSent": False,
            "requestSentAt": None,
            "token": None,
            "received": False,
            "receivedAt": None
        }
        data["status"] = "confirmed"

        # -------------------------------------------------------------------------------

        if restaurant_lower in ['chinese', 'indian', 'italian']:
            main_courses = data.get("main_courses", [])
            data["main_courses"] = [str(course).strip().lower() for course in main_courses]
            if (not isinstance(main_courses, list) or len(main_courses) != guests or any(not c for c in main_courses)):
                return jsonify({"error": "Main course selection is required for each guest at this restaurant."}), 400
            allowed_by_restaurant = {
                "italian": {"quatro_formagi", "chicken_pizza", "petto_chicken"},
                "indian": {"chicken", "meat"},
                "chinese": {"chicken", "meat"}
            }
            invalid = [c for c in data["main_courses"] if c not in allowed_by_restaurant.get(restaurant_lower, set())]
            if invalid:
                return jsonify({"error": "Invalid main course selection."}), 400

        # 🍣 Optional sushi upsell items
        upsell_items = data.get("upsell_items", {})
        if not isinstance(upsell_items, dict):
            upsell_items = {}
        
        # Clean sushi items (remove zero values and ensure int quantities)
        cleaned_upsell = {
            k.strip(): int(v)
            for k, v in upsell_items.items()
            if isinstance(v, int) and v > 0
        }
        data["upsell_items"] = cleaned_upsell  # Store cleaned version
        if "upsell_total_price" in data:
            data["upsell_total_price"] = float(data["upsell_total_price"])

        # NEW: Transactional logic to prevent race conditions
        transaction = db.transaction()
        capacity_ref = db.collection("capacities").document(f"{restaurant_raw}_{date}")
        new_reservation_ref = db.collection("reservations").document()

        @transactional
        def update_in_transaction(transaction, data_to_save):
            capacity_snapshot = capacity_ref.get(transaction=transaction)
            if not capacity_snapshot.exists:
                raise ValueError(f"No capacity set for {restaurant_raw} on {date}")

            capacity_data = capacity_snapshot.to_dict()
            capacity = capacity_data.get("capacity", 0)
            reserved_guests = capacity_data.get("reserved_guests", 0)

            if reserved_guests + guests > capacity:
                raise ValueError("Apologies, the restaurant is fully booked for this time.")

            # Atomically update the guest count and create the reservation
            transaction.update(capacity_ref, {"reserved_guests": Increment(guests)})
            transaction.set(new_reservation_ref, data_to_save)

        # Execute the transaction
        update_in_transaction(transaction, data)

        # NEW: Send email in a background thread to avoid blocking
        email_args = (
            current_app_context, data['email'], name, date, data['time'], data['guests'],
            room, restaurant_raw, cancel_token, data.get("main_courses", []),
            data.get("upsell_items", {}), data.get("upsell_total_price", 0)
        )
        email_thread = threading.Thread(target=send_email_in_background, args=email_args)
        email_thread.start()

        return jsonify({"message": "Reservation saved and confirmation email sent."}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

def _get_paginated_reservations(base_query):
    """Helper to paginate and filter reservations for admin dashboards."""
    # Pagination parameters
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 50))
    offset = (page - 1) * limit

    # Get total count for pagination UI
    count_query = base_query.count()
    total_items = count_query.get()[0][0].value

    # Fetch the paginated data
    docs = base_query.limit(limit).offset(offset).stream()
    reservations = [dict(id=doc.id, **doc.to_dict()) for doc in docs]

    return jsonify({
        "items": reservations,
        "total_items": total_items,
        "total_pages": (total_items + limit - 1) // limit,
        "current_page": page,
        "per_page": limit,
    })

############################################
#           Sending Review Email.          #
############################################

@app.post("/api/tasks/send-review-requests")
def send_review_requests():

    # 🔐 require cron secret
    if not require_cron_secret():
        return jsonify({"error": "unauthorized"}), 401
    # Compute yesterday in Cairo local time
    now_local = datetime.now(tz=LOCAL_TZ)
    y_date = (now_local - timedelta(days=1)).date()
    start_local = datetime(y_date.year, y_date.month, y_date.day, 0, 0, 0, tzinfo=LOCAL_TZ)
    end_local   = datetime(y_date.year, y_date.month, y_date.day, 23, 59, 59, tzinfo=LOCAL_TZ)

    # Use the stored "date" string (YYYY-MM-DD) to avoid any DST/UTC edge cases
    y_date_str = y_date.isoformat()  # e.g., "2025-10-28"

    q = (db.collection("reservations")
        .where("status", "==", "confirmed")
        .where("review.requestSent", "==", False)
        .where("date", "==", y_date_str))

    batch = db.batch()
    sent = 0
    failures = []

    for snap in q.stream():
        data = snap.to_dict()
        email = data.get("email")
        name  = data.get("name") or (data.get("email","").split("@")[0].replace(".", " ").title() if data.get("email") else None)
        restaurant = data.get("restaurantId")
        if not email or not restaurant:
            continue

        token = generate_review_token()
        try:
            send_review_request_email(email, name, restaurant, token)
            batch.update(snap.reference, {
                "review.requestSent": True,
                "review.requestSentAt": SERVER_TIMESTAMP,
                "review.token": token
            })
            sent += 1
        except Exception as e:
            failures.append({"id": snap.id, "error": str(e)})

    if sent > 0:
        batch.commit()

    return jsonify({"ok": True, "sent": sent, "failed": failures})




############################################
#           Submitting Review.             #
############################################
@app.post("/api/reviews/submit")
def submit_review():
    payload = request.get_json(force=True)
    token = payload.get("token")
    rating = payload.get("rating")
    comment = (payload.get("comment") or "").strip() or None

    if not token or not isinstance(rating, int) or rating < 1 or rating > 10:
        return jsonify({"ok": False, "error": "Invalid input"}), 400

    # Find reservation by token
    res_q = (db.collection("reservations")
               .where("review.token", "==", token)
               .limit(1))
    res_docs = list(res_q.stream())
    if not res_docs:
        return jsonify({"ok": False, "error": "Invalid or expired token"}), 400

    res_snap = res_docs[0]
    res = res_snap.to_dict()

    # Idempotency—if already received, return ok (do not duplicate)
    if (res.get("review") or {}).get("received") is True:
        return jsonify({"ok": True, "message": "Already recorded"})

    restaurant_id = res.get("restaurantId")
    if not restaurant_id:
        return jsonify({"ok": False, "error": "Reservation missing restaurantId"}), 400


    # Save the review (with guest details for reporting)
    db.collection("restaurant_reviews").document().set({
        "reservationId": res_snap.id,
        "restaurantId": restaurant_id,
        "rating": rating,
        "comment": comment,
        "createdAt": SERVER_TIMESTAMP,
        "source": "email_link",
        # extra fields from the reservation:
        "guestName": res.get("name"),
        "guestEmail": res.get("email"),
        "room": res.get("room"),
        # optional but handy for analytics:
        "dinnerDate": res.get("date"),            # "YYYY-MM-DD"
        "dinnerTime": res.get("time"),            # "HH:MM"
        "dinnerAtLocal": res.get("dinnerAtLocal") # ISO string
    })

    # Mark reservation as reviewed
    db.collection("reservations").document(res_snap.id).update({
        "review.received": True,
        "review.receivedAt": SERVER_TIMESTAMP
    })

    return jsonify({"ok": True})


##################################################################
# Admin read APIs (90-day default windows, changeable)           #
##################################################################

from datetime import datetime

def ts_to_datetime(value):
    """
    Normalize Firestore Timestamp / datetime / ISO string / None -> AWARE UTC datetime | None
    """
    if value is None:
        return None

    # Firestore Timestamp (admin SDK) → often has .to_datetime()
    if hasattr(value, "to_datetime"):
        dt = value.to_datetime()
    elif isinstance(value, datetime):
        dt = value
    elif isinstance(value, str):
        # maybe you stored it as string once
        try:
            dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except Exception:
            return None
    else:
        return None

    # make sure it's UTC-aware
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    else:
        dt = dt.astimezone(timezone.utc)

    return dt

@app.get("/api/reviews/summary")
@require_role("admin")
def reviews_summary():
    restaurant_id = request.args.get("restaurantId")
    period_days = int(request.args.get("period_days", "90"))

    if not restaurant_id:
        return jsonify({"error": "restaurantId required"}), 400

    cutoff = datetime.now(timezone.utc) - timedelta(days=period_days)

    q = db.collection("restaurant_reviews").where("restaurantId", "==", restaurant_id)

    count, total = 0, 0
    hist = {str(i): 0 for i in range(1, 11)}
    newest = None
    oldest = None

    try:
        for d in q.stream():
            r = d.to_dict()

            raw_created = r.get("createdAt")
            created = ts_to_datetime(raw_created)

            # if it's a bad date, just skip it instead of 500
            if created is not None and created < cutoff:
                continue

            # rating
            v_raw = r.get("rating", 0)
            try:
                v = int(v_raw)
            except (TypeError, ValueError):
                v = 0

            if 1 <= v <= 10:
                count += 1
                total += v
                hist[str(v)] += 1

            # track newest/oldest ONLY if created is valid
            if created is not None:
                if newest is None or created > newest:
                    newest = created
                if oldest is None or created < oldest:
                    oldest = created

    except Exception as e:
        # 👇 return REAL error to the frontend so you see it
        return jsonify({
            "error": "summary_failed",
            "message": str(e),
            "restaurantId": restaurant_id
        }), 500

    avg = round(total / count, 2) if count else 0.0

    def dt_to_iso(dt):
        if dt is None:
            return None
        try:
            return dt.isoformat()
        except Exception:
            return str(dt)

    return jsonify({
        "restaurantId": restaurant_id,
        "period_days": period_days,
        "count": count,
        "avg": avg,
        "histogram": hist,
        "newest": dt_to_iso(newest),
        "oldest": dt_to_iso(oldest),
    })

@app.get("/api/reviews/log")
@require_role("admin")
def reviews_log():
    restaurant_id = request.args.get("restaurantId")
    limit = int(request.args.get("limit", "100"))
    if not restaurant_id:
        return jsonify({"error": "restaurantId required"}), 400

    try:
        q = db.collection("restaurant_reviews").where("restaurantId", "==", restaurant_id)
        docs = list(q.stream())

        rows = []
        for d in docs:
            data = d.to_dict()
            data["id"] = d.id
            data["_createdAt"] = ts_to_datetime(data.get("createdAt"))
            rows.append(data)

        # sort safely
        rows.sort(
            key=lambda r: r["_createdAt"] or datetime.min,
            reverse=True
        )

        rows = rows[:limit]

        # drop helper field before sending
        for r in rows:
            r.pop("_createdAt", None)

        return jsonify({"restaurantId": restaurant_id, "items": rows})

    except Exception as e:
        return jsonify({
            "error": "log_failed",
            "message": str(e),
            "restaurantId": restaurant_id
        }), 500





# 📊 Get reservations summaries
@app.route("/reservations", methods=["GET"])
def get_reservations_summary():
    if not is_valid_origin():
        return jsonify({"error": "Unauthorized origin"}), 403
    try:
        restaurant = request.args.get("restaurant")
        date = request.args.get("date")
        if not restaurant or not date:
            return jsonify({"error": "Missing restaurant or date"}), 400
        query = db.collection("reservations")\
            .where("restaurant", "==", restaurant)\
            .where("date", "==", date)
        total_guests = sum(int(doc.to_dict().get("guests", 0)) for doc in query.stream())
        return jsonify({"totalGuests": total_guests}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 📦 Get all capacities
@app.route("/capacities", methods=["GET"])
def get_capacities():
    if not is_valid_origin():
        return jsonify({"error": "Unauthorized origin"}), 403
    try:
        result = {}
        docs = db.collection("capacities").stream()
        for doc in docs:
            data = doc.to_dict()
            result[f"{data['restaurant']}_{data['date']}"] = data['capacity']
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 💾 Save capacities
@app.route("/capacities", methods=["POST"])
@require_role("admin")
def save_capacities():
    if not is_valid_origin():
        return jsonify({"error": "Unauthorized origin"}), 403
    try:
        capacities = request.get_json()

        # Create allowed dates: today + next 5 days
        today = datetime.today()
        allowed_dates = [(today + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(6)]

        for key, value in capacities.items():
            restaurant, date = key.split('_')

            # Skip dates not in the allowed range
            if date not in allowed_dates:
                continue
        
            new_capacity = int(value)
            
            doc_ref = db.collection("capacities").document(f"{restaurant}_{date}")
            doc = doc_ref.get()
            
            if doc.exists:
                capacity_data = doc.to_dict()
                reserved_guests = capacity_data.get("reserved_guests", 0)
                if new_capacity < reserved_guests:
                     return jsonify({
                        "error": f"❌ Cannot set capacity for {restaurant} on {date} to {new_capacity}. There are already {reserved_guests} guests reserved."
                    }), 400
                # Update existing document
                doc_ref.update({"capacity": new_capacity})
            else:
                # Create new document with reserved_guests initialized to 0
                doc_ref.set({
                    "restaurant": restaurant,
                    "date": date,
                    "capacity": new_capacity,
                    "reserved_guests": 0
                })

        return jsonify({"message": "Capacities saved successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    


# 📥 Get all reservations with password protection
@app.route("/all-reservations", methods=["GET"])
@require_role("admin")
def all_reservations():

    try:
        # Filtering parameters
        restaurant_filter = request.args.get("restaurant")
        date_filter = request.args.get("date")
        
        query = db.collection("reservations").order_by("date", direction=Query.DESCENDING)

        if restaurant_filter and restaurant_filter != 'all':
            query = query.where("restaurant", "==", restaurant_filter)
        if date_filter and date_filter != 'all':
            query = query.where("date", "==", date_filter)

        return _get_paginated_reservations(query)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

# 📥 Get all reservations (Reception view)
@app.route("/reception/reservations", methods=["GET"])
@require_role("reception", "admin")
def reception_reservations():
    try:
        restaurant_filter = request.args.get("restaurant")
        date_filter = request.args.get("date")
        
        query = db.collection("reservations").order_by("date", direction=Query.DESCENDING)
        if restaurant_filter and restaurant_filter != 'all':
            query = query.where("restaurant", "==", restaurant_filter)
        if date_filter and date_filter != 'all':
            query = query.where("date", "==", date_filter)

        return _get_paginated_reservations(query)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 📥 Get all reservations (Kitchen view - read-only)
@app.route("/kitchen/reservations", methods=["GET"])
@require_role("kitchen", "admin")
def kitchen_reservations():
    try:
        restaurant_filter = request.args.get("restaurant")
        date_filter = request.args.get("date")
        
        query = db.collection("reservations").order_by("date", direction=Query.DESCENDING)
        if restaurant_filter and restaurant_filter != 'all':
            query = query.where("restaurant", "==", restaurant_filter)
        if date_filter and date_filter != 'all':
            query = query.where("date", "==", date_filter)

        return _get_paginated_reservations(query)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
# post paid or not
@app.route("/reception/reservations/<reservation_id>", methods=["PATCH"])
@require_role("reception", "admin")
def patch_reservation(reservation_id):


    try:
        body = request.get_json(silent=True) or {}
        if "paid" not in body or not isinstance(body["paid"], bool):
            return jsonify({"error": "'paid' (boolean) is required"}), 400

        doc_ref = db.collection("reservations").document(reservation_id)
        snap = doc_ref.get()
        if not snap.exists:
            return jsonify({"error": "Reservation not found"}), 404

        # just update paid
        doc_ref.update({"paid": body["paid"]})

        updated = doc_ref.get().to_dict()
        updated["id"] = reservation_id
        return jsonify(updated), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    


# ===============================
# 📊 Accounting Reservations API
# ===============================
@app.route("/accounting/reservations", methods=["GET"])
@require_role("accounting", "admin")
def get_accounting_reservations():
    try:
        # Optional filters
        start_date = request.args.get("from")  # "YYYY-MM-DD"
        end_date   = request.args.get("to")    # "YYYY-MM-DD"

        # If your Firestore 'date' field is a STRING "YYYY-MM-DD", this works:
        query = db.collection("reservations").order_by("date", direction=Query.DESCENDING)
        if start_date:
            query = query.where("date", ">=", start_date)
        if end_date:
            query = query.where("date", "<=", end_date)

        # NOTE: Accounting does not need pagination for now, but uses the same filters.
        docs = query.stream()
        reservations = [dict(id=doc.id, **doc.to_dict()) for doc in docs]
        return jsonify(reservations)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ❌ Delete reservation by ID
@app.route("/reservations/<reservation_id>", methods=["DELETE"])
@require_role("admin")
def delete_reservation(reservation_id):
    try:
        db.collection("reservations").document(reservation_id).delete()
        return jsonify({"message": "Reservation deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 📋 Capacity overview
# 📋 Capacity overview (next N days only)
@app.route("/capacity-overview", methods=["GET"])
def capacity_overview():
    if not is_valid_origin():
        return jsonify({"error": "Unauthorized origin"}), 403
    try:
        # ---- parse params ----
        start_str = request.args.get("start")  # 'YYYY-MM-DD' (optional)
        days_str = request.args.get("days", "6")  # default 6
        rest_str = request.args.get("restaurants", "")  # 'Oriental,Chinese,...' (optional)

        try:
            days = max(1, min(int(days_str), 31))  # clamp to sane range
        except ValueError:
            return jsonify({"error": "days must be an integer"}), 400

        if start_str:
            try:
                start_dt = datetime.strptime(start_str, "%Y-%m-%d")
            except ValueError:
                return jsonify({"error": "start must be YYYY-MM-DD"}), 400
        else:
            # default to *today* in server local date (00:00)
            now = datetime.now()
            start_dt = datetime(now.year, now.month, now.day)

        end_dt = start_dt + timedelta(days=days)
        start_key = start_dt.strftime("%Y-%m-%d")
        end_key = end_dt.strftime("%Y-%m-%d")
        date_keys = [(start_dt + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(days)]

        requested_restaurants = [r.strip() for r in rest_str.split(",") if r.strip()]

        # ---- find restaurants if none provided (only within the window) ----
        if not requested_restaurants:
            cap_seed_q = (
                db.collection("capacities")
                  .where("date", ">=", start_key)
                  .where("date", "<", end_key)
            )
            requested_restaurants = sorted({
                (doc.to_dict().get("restaurant") or "").strip()
                for doc in cap_seed_q.stream()
            } - {""})
            # If still none, return empty (no capacities defined in window)
            if not requested_restaurants:
                return jsonify([]), 200


        # ---- pull capacities in range (ONLY next N days) ----
        capacity_map = {}  # (restaurant, date) -> capacity (int)
        caps_q = (
            db.collection("capacities")
            .where("date", ">=", start_key)
            .where("date", "<", end_key)
        )
        for doc in caps_q.stream():
            d = doc.to_dict() or {}
            r = (d.get("restaurant") or "").strip()
            dt = (d.get("date") or "").strip()
            if not r or not dt:
                continue
            if requested_restaurants and r not in requested_restaurants:
                continue
            capacity_map[(r, dt)] = int(d.get("capacity") or 0)

        # ---- pull reservations in range (ONLY next N days) ----
        reserved_map = {}  # (restaurant, date) -> total guests (int)
        res_q = (
            db.collection("reservations")
            .where("date", ">=", start_key)
            .where("date", "<", end_key)
        )
        for doc in res_q.stream():
            d = doc.to_dict() or {}
            r = (d.get("restaurant") or "").strip()
            dt = (d.get("date") or "").strip()
            if not r or not dt:
                continue
            if requested_restaurants and r not in requested_restaurants:
                continue
            guests = int(d.get("guests", 0) or 0)
            reserved_map[(r, dt)] = reserved_map.get((r, dt), 0) + guests

        # ---- emit ONLY the requested window (restaurant × dates) ----
        result = []
        for r in requested_restaurants:
            for dt in date_keys:
                cap = int(capacity_map.get((r, dt), 0))
                res = int(reserved_map.get((r, dt), 0))
                remaining = max(cap - res, 0)
                result.append({
                    "restaurant": r,
                    "date": dt,
                    "capacity": cap,
                    "reserved": res,
                    "remaining": remaining
                })

        result.sort(key=lambda x: (x["restaurant"], x["date"]))
        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

    
# ❌ Guest cancels a reservation by token
@app.route("/cancel/<token>", methods=["GET"])
def get_reservation_for_cancellation(token):
    try:
        # 🔍 Look for the reservation with this token
        query = db.collection("reservations").where("cancel_token", "==", token).stream()
        found = None
        for doc in query:
            found = doc
            break

        if not found:
            return jsonify({"error": "Invalid or expired cancellation link."}), 404

        data = found.to_dict()
        # Return minimal info for confirmation
        return jsonify({
            "name": data.get("name"),
            "restaurant": data.get("restaurant"),
            "date": data.get("date"),
            "time": data.get("time"),
            "guests": data.get("guests")
        }), 200

    except Exception as e:
        print("❌ Cancellation error:", e)
        return "<h2>❌ Something went wrong. Please try again later.</h2>", 500




@app.route("/cancel/<token>", methods=["POST"])
def cancel_reservation(token):
    try:
        # 🔍 Find reservation by token
        query = db.collection("reservations").where("cancel_token", "==", token).stream()
        found = None
        for doc in query:
            found = doc
            break

        if not found:
            return jsonify({"error":"Invalid or expired cancellation link"}),404

        data = found.to_dict()

        # ⏳ Check if token has expired (older than 48 hours)
        issued_at_str = data.get("cancel_token_issued_at")
        if issued_at_str:
            issued_at = datetime.fromisoformat(issued_at_str)
            if datetime.now(timezone.utc) - issued_at > timedelta(hours=48):
                return jsonify({"error": "Cancellation link has expired"}), 403
            
        
        # 🕚 11AM same-day cancellation restriction
        reservation_date_str = data.get("date")
        if reservation_date_str:
            reservation_date = datetime.strptime(reservation_date_str, "%Y-%m-%d").date()
            now_utc = datetime.now(timezone.utc)
            cancellation_deadline = datetime.combine(reservation_date, dt_time(11, 0), tzinfo=timezone.utc)
            
            if now_utc.date() == reservation_date and now_utc > cancellation_deadline:
                return jsonify({"error": "Cancellations are not allowed after 11:00 AM on the reservation day."}), 403


        db.collection("reservations").document(found.id).delete()
        return jsonify({"message": "Reservation cancelled successfully."}), 200


    except Exception as e:
        print("❌ Cancellation error:", e)
        return jsonify({"error": "Something went wrong."}), 500


@app.route("/me", methods=["GET"])
@require_role("admin","reception","kitchen","accounting")
def me():
    return jsonify(getattr(request, "user", {})), 200
    
    
# 🟢 Run the Flask server
if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=True)
