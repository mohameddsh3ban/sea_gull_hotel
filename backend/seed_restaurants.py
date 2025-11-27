# backend/seed_restaurants.py
import firebase_admin
from firebase_admin import credentials, firestore
import os

# 1. Initialize Firebase (Script-level)
if not firebase_admin._apps:
    cred = credentials.Certificate("service-account.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

def seed_restaurants():
    print("🌱 Seeding Firestore with Smart Restaurant Data...")

    # Define the "Smart" Data for your current restaurants
    restaurants_data = [
        {
            "id": "Italian",
            "name": "Italian Restaurant",
            "description": "Enjoy hand-tossed pizzas and creamy pastas in a relaxed setting.",
            "isActive": True,
            "order": 1,
            "media": {
                "cardImage": "assets/images/italian.png", # Frontend will treat these as relative paths for now
                "coverImage": "assets/images/italian-cover.jpg", 
                "menuPdfUrl": "/menus/Italian.pdf"
            },
            "config": {
                "openingTime": "18:00",
                "closingTime": "22:00",
                "timeSlotInterval": 30,
                "maxGuestsPerBooking": 8
            },
            "menuConfig": {
                "hasMainCourseSelection": True,
                "mainCourseLabel": "Select your Main Course",
                "mainCourses": [
                    { "id": "quatro_formagi", "label": "Quattro Formaggi", "available": True },
                    { "id": "chicken_pizza", "label": "Chicken Pizza", "available": True },
                    { "id": "petto_chicken", "label": "Petto di Pollo", "available": True }
                ],
                "hasUpsells": False,
                "upsellLabel": "",
                "upsellItems": []
            }
        },
        {
            "id": "Chinese",
            "name": "Chinese Restaurant",
            "description": "Explore bold Asian flavors prepared using traditional techniques.",
            "isActive": True,
            "order": 2,
            "media": {
                "cardImage": "assets/images/chinese.png",
                "coverImage": "assets/images/chinese-cover.jpg",
                "menuPdfUrl": "/menus/Chinese.pdf"
            },
            "config": {
                "openingTime": "18:00",
                "closingTime": "22:00",
                "timeSlotInterval": 30,
                "maxGuestsPerBooking": 8
            },
            "menuConfig": {
                "hasMainCourseSelection": True,
                "mainCourseLabel": "Select your Main Dish",
                "mainCourses": [
                    { "id": "chicken", "label": "Chicken", "available": True },
                    { "id": "meat", "label": "Meat", "available": True }
                ],
                "hasUpsells": True,
                "upsellLabel": "Add Sushi (Extra Charge)",
                "upsellItems": [
                    { "id": "Hot Dynamites", "label": "Hot Dynamites", "price": 4, "category": "Hot Rolls" },
                    { "id": "Hot Crab", "label": "Hot Crab", "price": 4, "category": "Hot Rolls" },
                    { "id": "Hot Dragon", "label": "Hot Dragon", "price": 4, "category": "Hot Rolls" },
                    { "id": "Sake Maki", "label": "Sake Maki", "price": 3, "category": "Maki" },
                    { "id": "Seagull Roll", "label": "Seagull Roll", "price": 5, "category": "Maki" },
                    { "id": "Kappa Roll", "label": "Kappa Roll", "price": 2, "category": "Maki" },
                    { "id": "Kabi Maki", "label": "Kabi Maki", "price": 4, "category": "Maki" }
                ]
            }
        },
        {
            "id": "Indian",
            "name": "Indian Restaurant",
            "description": "Taste the vibrant spices of India with rich curries.",
            "isActive": True,
            "order": 3,
            "media": {
                "cardImage": "assets/images/indian.png",
                "coverImage": "assets/images/indian-cover.jpg",
                "menuPdfUrl": "/menus/Indian.pdf"
            },
            "config": {
                "openingTime": "18:00",
                "closingTime": "22:00",
                "timeSlotInterval": 30,
                "maxGuestsPerBooking": 8
            },
            "menuConfig": {
                "hasMainCourseSelection": True,
                "mainCourseLabel": "Select your Main Dish",
                "mainCourses": [
                    { "id": "chicken", "label": "Chicken", "available": True },
                    { "id": "meat", "label": "Meat", "available": True }
                ],
                "hasUpsells": False,
                "upsellLabel": "",
                "upsellItems": []
            }
        },
        {
            "id": "Oriental",
            "name": "Oriental Restaurant",
            "description": "Authentic local cuisine.",
            "isActive": True,
            "order": 4,
            "media": {
                "cardImage": "assets/images/oriental.png", # Ensure you have this image or change it
                "coverImage": "assets/images/oriental-cover.jpg",
                "menuPdfUrl": "/menus/Oriental.pdf"
            },
            "config": {
                "openingTime": "18:00",
                "closingTime": "22:00",
                "timeSlotInterval": 30,
                "maxGuestsPerBooking": 8
            },
            "menuConfig": {
                "hasMainCourseSelection": False, # Oriental usually set menu/buffet in this context
                "mainCourseLabel": "",
                "mainCourses": [],
                "hasUpsells": False,
                "upsellLabel": "",
                "upsellItems": []
            }
        }
    ]

    batch = db.batch()
    collection_ref = db.collection("restaurants")

    for rest in restaurants_data:
        doc_ref = collection_ref.document(rest["id"])
        batch.set(doc_ref, rest)
    
    batch.commit()
    print("✅ Successfully seeded 4 restaurants into 'restaurants' collection.")

if __name__ == "__main__":
    seed_restaurants()
