"""
Authentication Strategies.

Different authentication methods following the Strategy Pattern.
"""

from .base import AuthenticationStrategy
from .password_strategy import PasswordAuthenticationStrategy
from .otp_strategy import OTPAuthenticationStrategy

__all__ = [
    "AuthenticationStrategy",
    "PasswordAuthenticationStrategy",
    "OTPAuthenticationStrategy",
]
