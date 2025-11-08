from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    
class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    uid: str
    role: str = "guest"
    
    class Config:
        from_attributes = True
