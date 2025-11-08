from firebase_admin import firestore

_db_client = None

def get_db():
    """Returns the Firestore client instance."""
    global _db_client
    if _db_client is None:
        _db_client = firestore.client()
    return _db_client
