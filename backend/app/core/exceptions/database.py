"""Database-related exceptions."""

class DatabaseError(Exception):
    """Base exception for database errors."""
    
    def __init__(self, message: str = "Database error"):
        self.message = message
        super().__init__(self.message)


class RecordNotFoundError(Exception):
    """Raised when a requested record is not found in the database."""
    
    def __init__(self, message: str = "Record not found"):
        self.message = message
        super().__init__(self.message)

class DatabaseNotAvailableError(Exception):
    """Raised when the database connection is not available."""
    
    def __init__(self, message: str = "Database is not available"):
        self.message = message
        super().__init__(self.message)


class DatabaseConnectionError(Exception):
    """Raised when there's an error connecting to the database."""
    
    def __init__(self, message: str = "Failed to connect to database"):
        self.message = message
        super().__init__(self.message)


class DatabaseQueryError(Exception):
    """Raised when a database query fails."""
    
    def __init__(self, message: str = "Database query failed"):
        self.message = message
        super().__init__(self.message)