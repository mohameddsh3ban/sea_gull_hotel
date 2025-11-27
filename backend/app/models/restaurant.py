# backend/app/models/restaurant.py
from pydantic import BaseModel
from typing import List, Optional, Any

class MediaConfig(BaseModel):
    cardImage: str
    coverImage: str
    menuPdfUrl: str

class TimeConfig(BaseModel):
    openingTime: str
    closingTime: str
    timeSlotInterval: int
    maxGuestsPerBooking: int

class MainCourseItem(BaseModel):
    id: str
    label: str
    available: bool

class UpsellItem(BaseModel):
    id: str
    label: str
    price: float
    category: Optional[str] = "General"

class MenuConfig(BaseModel):
    hasMainCourseSelection: bool
    mainCourseLabel: Optional[str] = ""
    mainCourses: List[MainCourseItem] = []
    
    hasUpsells: bool
    upsellLabel: Optional[str] = ""
    upsellItems: List[UpsellItem] = []

class Restaurant(BaseModel):
    id: str
    name: str
    description: str
    isActive: bool
    order: int
    media: MediaConfig
    config: TimeConfig
    menuConfig: MenuConfig

class RestaurantListResponse(BaseModel):
    items: List[Restaurant]
