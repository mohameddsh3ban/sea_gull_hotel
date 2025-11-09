
from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import auth as admin_auth

from app.api.deps import get_current_user, require_role

router = APIRouter()

# REMOVE THE "/token" ENDPOINT AND ITS IMPORTS

@router.get("/users/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    """Get current user information."""
    return current_user

@router.post("/admin/set-user-role")
async def set_user_role(
    payload: dict,
    admin_user: dict = Depends(require_role("admin"))
):
    """Set a user's custom role (admin only)."""
    uid = payload.get("uid")
    role = payload.get("role")
    
    if not uid or not role:
        raise HTTPException(status_code=400, detail="UID and role are required")
    
    try:
        admin_auth.set_custom_user_claims(uid, {"role": role})
        return {"message": f"Role '{role}' set for user {uid}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set role: {str(e)}")