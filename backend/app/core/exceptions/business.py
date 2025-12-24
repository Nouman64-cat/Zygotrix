"""Business logic exceptions."""


class OTPExpiredError(Exception):
    """Raised when an OTP has expired."""
    
    def __init__(self, message: str = "OTP has expired"):
        self.message = message
        super().__init__(self.message)


class MaxAttemptsExceededError(Exception):
    """Raised when maximum OTP verification attempts have been exceeded."""
    
    def __init__(self, message: str = "Maximum verification attempts exceeded"):
        self.message = message
        super().__init__(self.message)


class InvalidOTPError(Exception):
    """Raised when an invalid OTP is provided."""
    
    def __init__(self, message: str = "Invalid OTP provided"):
        self.message = message
        super().__init__(self.message)


class UserNotFoundError(Exception):
    """Raised when a user is not found."""
    
    def __init__(self, message: str = "User not found"):
        self.message = message
        super().__init__(self.message)


class UnauthorizedError(Exception):
    """Raised when an unauthorized action is attempted."""
    
    def __init__(self, message: str = "Unauthorized"):
        self.message = message
        super().__init__(self.message)