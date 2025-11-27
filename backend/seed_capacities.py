import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timedelta

# Initialize (if not already initialized in app context)
if not firebase_admin._apps:
    cred = credentials.Certificate("service-account.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

def seed_capacities():
    print("📅 Seeding Capacities for the next 30 days...")
    
    restaurants = ["Italian", "Chinese", "Indian", "Oriental"]
    today = datetime.now()
    batch = db.batch()
    count = 0

    for i in range(30):
        # Generate date string YYYY-MM-DD
        date_obj = today + timedelta(days=i)
        date_str = date_obj.strftime("%Y-%m-%d")
        
        for rest in restaurants:
            key = f"{rest}_{date_str}"
            doc_ref = db.collection("capacities").document(key)
            
            # Only create if it doesn't exist to preserve existing reservations
            if not doc_ref.get().exists:
                batch.set(doc_ref, {
                    "restaurant": rest,
                    "date": date_str,
                    "capacity": 50, # Default seats
                    "reserved_guests": 0
                })
                count += 1
                
                if count % 400 == 0:
                    batch.commit()
                    batch = db.batch()
                    print(f"   Committed batch...")

    if count > 0:
        batch.commit()
    
    print(f"✅ Successfully initialized {count} capacity records.")

if __name__ == "__main__":
    seed_capacities()
