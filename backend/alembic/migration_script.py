# migration_script.py - Run this to add reserved_guests to existing capacities
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timedelta
import json
import base64
import os

# Initialize Firebase
firebase_json_b64 = os.getenv("FIREBASE_CREDENTIALS_B64")
firebase_dict = json.loads(base64.b64decode(firebase_json_b64))
cred = credentials.Certificate(firebase_dict)
firebase_admin.initialize_app(cred)
db = firestore.client()

# Update all capacity documents
capacities = db.collection("capacities").stream()
batch = db.batch()

for cap in capacities:
    data = cap.to_dict()
    if "reserved_guests" not in data:
        # Count actual reservations for this restaurant/date
        restaurant = data.get("restaurant")
        date = data.get("date")
        
        reservations = db.collection("reservations") \
            .where("restaurant", "==", restaurant) \
            .where("date", "==", date) \
            .stream()
        
        total_guests = sum(int(r.to_dict().get("guests", 0)) for r in reservations)
        
        batch.update(cap.reference, {
            "reserved_guests": total_guests
        })

batch.commit()
print("✅ Migration complete!")