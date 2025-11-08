# Example test file for reservations
import pytest
from httpx import AsyncClient
from fastapi import FastAPI

# Assuming you have a test app instance
# from main import app as test_app

# @pytest.mark.asyncio
# async def test_create_reservation():
#     async with AsyncClient(app=test_app, base_url="http://test") as ac:
#         response = await ac.post("/api/v1/reservations", json={
#             "date": "2025-12-25",
#             "time": "19:00",
#             "guests": 2,
#             "room": "Room A",
#             "first_name": "John",
#             "last_name": "Doe",
#             "email": "john.doe@example.com",
#             "restaurant": "Italian"
#         })
#         assert response.status_code == 200
#         assert "reservation_id" in response.json()
