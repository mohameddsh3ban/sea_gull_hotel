from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ReviewCreate(BaseModel):
    token: str
    rating: int = Field(..., ge=1, le=10)
    comment: Optional[str] = Field(None, max_length=500)

class ReviewResponse(BaseModel):
    id: str
    reservationId: str
    restaurantId: str
    rating: int
    comment: Optional[str]
    createdAt: datetime
    guestName: Optional[str]
    guestEmail: Optional[str]
    room: Optional[str]
    dinnerDate: Optional[str]
    
    class Config:
        from_attributes = True
