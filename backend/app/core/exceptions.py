from fastapi import HTTPException

class AppException(HTTPException):
    """Custom exception for application-specific errors."""
    def __init__(self, status_code: int, message: str, detail: str = None):
        super().__init__(status_code=status_code, detail=detail or message)
        self.message = message
        self.detail = detail
