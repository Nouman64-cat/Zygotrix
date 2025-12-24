"""
Client Information Extraction.

Utilities for extracting client information from HTTP requests.
"""

from typing import Dict, Any, Optional
from fastapi import Request
import re


class ClientInfoExtractor:
    """Extract client information from HTTP requests."""

    @staticmethod
    def get_ip_address(request: Request) -> str:
        """
        Extract client IP address, handling proxies and load balancers.

        Checks headers in order:
        1. X-Forwarded-For (first IP in chain)
        2. X-Real-IP
        3. Direct client connection

        Args:
            request: FastAPI Request object

        Returns:
            Client IP address as string, or "Unknown" if unavailable
        """
        # Check for forwarded headers (when behind proxy/load balancer)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Get the first IP in the chain (original client)
            return forwarded_for.split(",")[0].strip()

        # Check X-Real-IP header
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()

        # Fall back to direct client IP
        return request.client.host if request.client else "Unknown"

    @staticmethod
    def get_user_agent(request: Request) -> str:
        """
        Extract user agent string from request headers.

        Args:
            request: FastAPI Request object

        Returns:
            User agent string, or "Unknown" if not present
        """
        return request.headers.get("User-Agent", "Unknown")

    @staticmethod
    def parse_browser_info(user_agent: str) -> str:
        """
        Parse browser information from user agent string.

        Args:
            user_agent: User agent string

        Returns:
            Browser name and version, or "Unknown Browser"
        """
        if not user_agent or user_agent == "Unknown":
            return "Unknown Browser"

        # Common browser patterns
        patterns = {
            r"Edg/(\d+\.\d+)": "Edge",
            r"Chrome/(\d+\.\d+)": "Chrome",
            r"Firefox/(\d+\.\d+)": "Firefox",
            r"Safari/(\d+\.\d+)": "Safari",
            r"OPR/(\d+\.\d+)": "Opera",
        }

        for pattern, browser_name in patterns.items():
            match = re.search(pattern, user_agent)
            if match:
                version = match.group(1).split(".")[0]  # Major version only
                return f"{browser_name} {version}"

        return "Unknown Browser"

    @staticmethod
    def extract_all(request: Request) -> Dict[str, Any]:
        """
        Extract all client information from request.

        Args:
            request: FastAPI Request object

        Returns:
            Dictionary containing:
            - ip_address: Client IP
            - user_agent: Full user agent string
            - browser: Parsed browser info
        """
        ip_address = ClientInfoExtractor.get_ip_address(request)
        user_agent = ClientInfoExtractor.get_user_agent(request)
        browser = ClientInfoExtractor.parse_browser_info(user_agent)

        return {
            "ip_address": ip_address,
            "user_agent": user_agent,
            "browser": browser,
        }
