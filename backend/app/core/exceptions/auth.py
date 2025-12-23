"""Authentication-related exceptions."""

class AuthenticationError(Exception):
    """Base exception for authentication errors."""
    
    def __init__(self, message: str = "Authentication error"):
        self.message = message
        super().__init__(self.message)

class InvalidCredentialsError(Exception):
    """Raised when invalid credentials are provided."""
    
    def __init__(self, message: str = "Invalid credentials"):
        self.message = message
        super().__init__(self.message)


class TokenExpiredError(Exception):
    """Raised when an authentication token has expired."""
    
    def __init__(self, message: str = "Token has expired"):
        self.message = message
        super().__init__(self.message)


class InvalidTokenError(Exception):
    """Raised when an invalid token is provided."""
    
    def __init__(self, message: str = "Invalid token"):
        self.message = message
        super().__init__(self.message)


class AuthenticationRequiredError(Exception):
    """Raised when authentication is required but not provided."""
    
    def __init__(self, message: str = "Authentication required"):
        self.message = message
        super().__init__(self.message)

class OTPExpiredError(Exception):
    """Raised when an OTP has expired."""
    
    def __init__(self, message: str = "OTP has expired"):
        self.message = message
        super().__init__(self.message)

class MaxAttemptsExceededError(Exception):
    """Raised when maximum verification attempts have been exceeded."""
    
    def __init__(self, message: str = "Maximum verification attempts exceeded"):
        self.message = message
        super().__init__(self.message)