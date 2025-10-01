#!/usr/bin/env python3
"""
Database initialization script for Zygotrix trait management.

This script sets up the MongoDB collection with proper indexes for efficient trait management.
Run this script after setting up your MongoDB connection.
"""

import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "app"))

from app.services.trait_db_setup import setup_trait_collection


def main():
    """Main entry point for database setup."""
    print("🧬 Zygotrix Trait Management Database Setup")
    print("=" * 50)

    success = setup_trait_collection()

    if success:
        print("\n✅ Database setup completed successfully!")
        print("The trait management system is ready to use.")
        sys.exit(0)
    else:
        print("\n❌ Database setup failed!")
        print("Please check the error messages above and try again.")
        sys.exit(1)


if __name__ == "__main__":
    main()
