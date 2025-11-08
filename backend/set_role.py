# set_admin.py
import firebase_admin
from firebase_admin import credentials, auth

SERVICE_ACCOUNT = "service-account.json"
UID = "lTwyjUVjZcX8biy7L1Q0m3jgSD53"  # <-- put the user's UID here

def main():
    cred = credentials.Certificate(SERVICE_ACCOUNT)
    firebase_admin.initialize_app(cred)

    # Set admin=true
    # Preserve any existing claims and set role="admin"
    u = auth.get_user(UID)
    claims = (u.custom_claims or {}).copy()
    claims["role"] = "admin"
    auth.set_custom_user_claims(UID, claims)
    print(f"✅ Admin claim set for UID: {UID}")

    # (Optional) Force token refresh on next sign-in:
    # auth.revoke_refresh_tokens(UID)
    # print("🔁 Revoked refresh tokens to force claim refresh.")

if __name__ == "__main__":
    main()
