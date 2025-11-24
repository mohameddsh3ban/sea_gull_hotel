from pydantic import BaseModel, Field
from typing import Optional

class RestaurantConfig(BaseModel):
    restaurantId: str = Field(..., pattern="^(Indian|Chinese|Italian|Oriental)$")
    isActive: bool = True
    openingTime: str = Field("18:00", pattern=r"^\d{2}:\d{2}$")
    closingTime: str = Field("22:00", pattern=r"^\d{2}:\d{2}$")
    intervalMinutes: int = Field(30, ge=15, le=60)
    
    class Config:
        from_attributes = True
