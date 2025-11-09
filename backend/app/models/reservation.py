from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict
from datetime import datetime

class ReservationCreate(BaseModel):
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    guests: int = Field(..., ge=1, le=4)
    room: str = Field(..., min_length=1, max_length=10)
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    restaurant: str = Field(..., pattern="^(Indian|Chinese|Italian|Oriental)$")
    main_courses: Optional[List[str]] = []
    comments: Optional[str] = Field(None, max_length=500)
    upsell_items: Optional[Dict[str, int]] = {}
    upsell_total_price: Optional[float] = 0.0
    
    @validator('main_courses')
    def validate_main_courses(cls, v, values):
        restaurant = values.get('restaurant', '').lower()
        guests = values.get('guests', 0)
        
        if restaurant in ['chinese', 'indian', 'italian']:
            if len(v) != guests:
                raise ValueError(f"Must select {guests} main courses")
            
            allowed = {
                'italian': {'quatro_formagi', 'chicken_pizza', 'petto_chicken'},
                'indian': {'chicken', 'meat'},
                'chinese': {'chicken', 'meat'}
            }
            
            for course in v:
                if course.lower() not in allowed.get(restaurant, set()):
                    raise ValueError(f"Invalid course: {course}")
        
        return v
    
    @validator('upsell_items')
    def validate_upsell(cls, v):
        return {k.strip(): int(count) for k, count in v.items() if int(count) > 0}

class ReservationResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    room: str
    date: str
    time: str
    guests: int
    restaurant: str
    main_courses: List[str]
    comments: Optional[str]
    upsell_items: Dict[str, int]
    upsell_total_price: float
    status: str
    paid: bool
    email_status: str
    cancel_token: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ReservationFilter(BaseModel):
    page: int = Field(1, ge=1)
    limit: int = Field(50, ge=1, le=100)
    restaurant: Optional[str] = "all"
    date: Optional[str] = "all"
    from_date: Optional[str] = None
    to_date: Optional[str] = None
    search: Optional[str] = None
    last_id: Optional[str] = None # For cursor-based pagination

class PaginatedReservations(BaseModel):
    items: List[ReservationResponse]
    pagination: Dict[str, int]
