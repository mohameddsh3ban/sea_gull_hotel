from fastapi import Depends, HTTPException, Header
from firebase_admin import auth as admin_auth
from typing import Optional

async def get_current_user(authorization: Optional[str] = Header(None)):
    """Verify Firebase ID token from Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid Authorization header"
        )
    
    id_token = authorization.split(" ", 1)[1]
    
    try:
        decoded = admin_auth.verify_id_token(id_token, check_revoked=True)
        return {
            "uid": decoded.get("uid"),
            "email": decoded.get("email"),
            "role": decoded.get("role", decoded.get("claims", {}).get("role", "guest"))
        }
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid token: {str(e)}"
        )

def require_role(*allowed_roles: str):
    """Dependency to enforce role-based access."""
    async def role_checker(user: dict = Depends(get_current_user)):
        if allowed_roles and user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Required roles: {allowed_roles}"
            )
        return user
    return role_checker
