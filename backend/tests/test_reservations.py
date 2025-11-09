import pytest
from httpx import AsyncClient
from unittest.mock import patch
from firebase_admin import firestore
from google.cloud.firestore_v1 import SERVER_TIMESTAMP
from datetime import datetime, timedelta

# Import your main FastAPI app and get_db for direct Firestore access in tests
from app.main import app
from app.services.firestore import get_db

# Use the client fixture from conftest.py
pytestmark = pytest.mark.anyio

@pytest.fixture
async def setup_capacity():
    """Fixture to set up a known capacity for testing."""
    db = get_db()
    test_date = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    restaurant_id = "TestRestaurant"
    capacity_key = f"{restaurant_id}_{test_date}"
    
    # Ensure a clean state
    capacity_ref = db.collection("capacities").document(capacity_key)
    await capacity_ref.set({
        "restaurant": restaurant_id,
        "date": test_date,
        "capacity": 5, # Set a small capacity for testing overbooking
        "reserved_guests": 0
    })
    
    # Clean up reservations for the test date
    reservations_query = db.collection("reservations").where("date", "==", test_date)
    async for doc in reservations_query.stream():
        await doc.reference.delete()

    yield {
        "test_date": test_date,
        "restaurant_id": restaurant_id,
        "initial_capacity": 5
    }

    # Clean up after test
    await capacity_ref.delete()
    async for doc in reservations_query.stream():
        await doc.reference.delete()

@patch("app.services.email.send_confirmation_email")
async def test_create_reservation_success(mock_send_email, client: AsyncClient, setup_capacity):
    """Test successful reservation creation."""
    test_date = setup_capacity["test_date"]
    restaurant_id = setup_capacity["restaurant_id"]

    response = await client.post(
        "/api/v1/reservations",
        json={
            "date": test_date,
            "time": "19:00",
            "guests": 2,
            "room": "Room A",
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@example.com",
            "restaurant": restaurant_id,
            "main_courses": [],
            "upsell_items": {}
        }
    )
    assert response.status_code == 200
    assert "reservation_id" in response.json()
    mock_send_email.assert_called_once()

    db = get_db()
    capacity_key = f"{restaurant_id}_{test_date}"
    capacity_doc = await db.collection("capacities").document(capacity_key).get()
    assert capacity_doc.exists
    assert capacity_doc.to_dict()["reserved_guests"] == 2

@patch("app.services.email.send_confirmation_email")
async def test_create_reservation_overbooking(mock_send_email, client: AsyncClient, setup_capacity):
    """Test reservation overbooking prevention with concurrent requests."""
    test_date = setup_capacity["test_date"]
    restaurant_id = setup_capacity["restaurant_id"]
    initial_capacity = setup_capacity["initial_capacity"] # 5 guests

    # Simulate more guests than capacity
    num_guests_per_reservation = 3
    num_concurrent_requests = 2 # Total guests: 2 * 3 = 6, which is > 5

    reservation_data = {
        "date": test_date,
        "time": "19:00",
        "guests": num_guests_per_reservation,
        "room": "Room B",
        "first_name": "Jane",
        "last_name": "Doe",
        "email": "jane.doe@example.com",
        "restaurant": restaurant_id,
        "main_courses": [],
        "upsell_items": {}
    }

    # Create a list of concurrent tasks
    tasks = [
        client.post("/api/v1/reservations", json=reservation_data)
        for _ in range(num_concurrent_requests)
    ]

    # Execute tasks concurrently
    responses = await pytest.helpers.gather(*tasks, return_exceptions=True)

    successful_reservations = 0
    failed_reservations = 0

    for res in responses:
        if isinstance(res, Exception):
            # Handle exceptions if any, though httpx usually returns Response objects
            failed_reservations += 1
        elif res.status_code == 200:
            successful_reservations += 1
        else:
            failed_reservations += 1
            assert res.status_code == 400
            assert "Restaurant fully booked" in res.json()["detail"] or "seats available" in res.json()["detail"]

    # Assert that only one reservation succeeded (or none if capacity is too low for even one)
    # Given initial_capacity=5 and num_guests_per_reservation=3, only one should succeed.
    assert successful_reservations == 1
    assert failed_reservations == num_concurrent_requests - 1

    db = get_db()
    capacity_key = f"{restaurant_id}_{test_date}"
    capacity_doc = await db.collection("capacities").document(capacity_key).get()
    assert capacity_doc.exists
    # The reserved guests should be equal to the guests from the single successful reservation
    assert capacity_doc.to_dict()["reserved_guests"] == num_guests_per_reservation
    mock_send_email.assert_called_once() # Only one email should be sent for the successful booking

# Add more tests for other reservation endpoints (list, delete, etc.)
# For example:

@patch("app.services.email.send_confirmation_email")
async def test_list_reservations(mock_send_email, client: AsyncClient, setup_capacity):
    """Test listing reservations with filters and pagination."""
    test_date = setup_capacity["test_date"]
    restaurant_id = setup_capacity["restaurant_id"]

    # Create a few reservations
    for i in range(3):
        await client.post(
            "/api/v1/reservations",
            json={
                "date": test_date,
                "time": f"1{i}:00",
                "guests": 1,
                "room": f"Room {i}",
                "first_name": f"Guest{i}",
                "last_name": "Test",
                "email": f"guest{i}@example.com",
                "restaurant": restaurant_id,
                "main_courses": [],
                "upsell_items": {}
            }
        )
    
    # Test basic listing
    response = await client.get(f"/api/v1/reservations?restaurant={restaurant_id}&date={test_date}")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 3
    assert data["pagination"]["current_page_items"] == 3
    assert data["pagination"]["has_next"] == False # Since limit is 50 by default

    # Test pagination (assuming default limit is 50, set to 2 for this test)
    response_page1 = await client.get(f"/api/v1/reservations?restaurant={restaurant_id}&date={test_date}&limit=2")
    assert response_page1.status_code == 200
    data_page1 = response_page1.json()
    assert len(data_page1["items"]) == 2
    assert data_page1["pagination"]["has_next"] == True
    assert data_page1["pagination"]["next_last_id"] is not None

    last_id = data_page1["pagination"]["next_last_id"]
    response_page2 = await client.get(f"/api/v1/reservations?restaurant={restaurant_id}&date={test_date}&limit=2&last_id={last_id}")
    assert response_page2.status_code == 200
    data_page2 = response_page2.json()
    assert len(data_page2["items"]) == 1 # Only one remaining
    assert data_page2["pagination"]["has_next"] == False

@patch("app.services.email.send_confirmation_email")
async def test_cancel_reservation(mock_send_email, client: AsyncClient, setup_capacity):
    """Test cancelling a reservation."""
    test_date = setup_capacity["test_date"]
    restaurant_id = setup_capacity["restaurant_id"]

    # First, create a reservation
    create_response = await client.post(
        "/api/v1/reservations",
        json={
            "date": test_date,
            "time": "20:00",
            "guests": 2,
            "room": "Room C",
            "first_name": "Cancel",
            "last_name": "Me",
            "email": "cancel.me@example.com",
            "restaurant": restaurant_id,
            "main_courses": [],
            "upsell_items": {}
        }
    )
    assert create_response.status_code == 200
    reservation_id = create_response.json()["reservation_id"]

    # Mock admin user for deletion
    with patch("app.api.deps.get_current_user", return_value={"uid": "test_admin_uid", "email": "admin@example.com", "role": "admin"}):
        delete_response = await client.delete(f"/api/v1/reservations/{reservation_id}")
        assert delete_response.status_code == 200
        assert delete_response.json()["message"] == "Reservation cancelled"

    db = get_db()
    deleted_doc = await db.collection("reservations").document(reservation_id).get()
    assert not deleted_doc.exists

    capacity_key = f"{restaurant_id}_{test_date}"
    capacity_doc = await db.collection("capacities").document(capacity_key).get()
    assert capacity_doc.exists
    assert capacity_doc.to_dict()["reserved_guests"] == 0 # Capacity should be back to 0
