from pydantic import BaseModel, Field
from typing import Optional

class Capacity(BaseModel):
    restaurant: str = Field(..., min_length=1)
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    capacity: int = Field(..., ge=0)
    reserved_guests: int = Field(0, ge=0)
    
    class Config:
        from_attributes = True
