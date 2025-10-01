"""Database setup utilities for trait management."""

from datetime import datetime, timezone
from typing import Dict, Any
from pymongo.errors import PyMongoError
from app.services.common import get_traits_collection


def create_trait_indexes() -> bool:
    """
    Create MongoDB indexes for efficient trait querying and management.

    Indexes created:
    - unique(key, owner_id): Ensures unique trait keys per owner
    - partial index for visibility:"public": Efficient public trait queries
    - compound on (owner_id, status): Owner's trait management
    - text search on (name, gene_info.gene, category, tags): Full-text search
    - Additional indexes for filtering

    Returns:
        bool: True if successful, False otherwise
    """
    try:
        collection = get_traits_collection(required=True)
        if collection is None:
            print("Error: Could not connect to MongoDB traits collection")
            return False

        print("Creating MongoDB indexes for trait management...")

        def safe_create_index(spec, **kwargs):
            """Safely create index, handling existing indexes."""
            try:
                collection.create_index(spec, **kwargs)
                return True
            except PyMongoError as e:
                if "already exists" in str(e).lower():
                    print(
                        f"⚠️  Index already exists, skipping: {kwargs.get('name', spec)}"
                    )
                    return True
                else:
                    print(f"❌ Error creating index {kwargs.get('name', spec)}: {e}")
                    return False

        success_count = 0

        # Unique compound index on key and owner_id
        if safe_create_index(
            [("key", 1), ("owner_id", 1)], unique=True, name="unique_key_owner"
        ):
            print("✅ Created unique index on (key, owner_id)")
            success_count += 1

        # Partial index for public visibility
        if safe_create_index(
            [("visibility", 1)],
            partialFilterExpression={"visibility": "public"},
            name="public_visibility",
        ):
            print("✅ Created partial index for public visibility")
            success_count += 1

        # Compound index for owner and status
        if safe_create_index([("owner_id", 1), ("status", 1)], name="owner_status"):
            print("✅ Created compound index on (owner_id, status)")
            success_count += 1

        # Text search index
        if safe_create_index(
            [
                ("name", "text"),
                ("gene_info.gene", "text"),
                ("category", "text"),
                ("tags", "text"),
            ],
            name="text_search",
        ):
            print("✅ Created text search index")
            success_count += 1

        # Additional filtering indexes
        filter_indexes = [
            ("inheritance_pattern", "inheritance_pattern"),
            ("verification_status", "verification_status"),
            ("category", "category"),
            ("created_at", "created_at"),
            ("updated_at", "updated_at"),
            ("version", "version"),
        ]

        for field, name in filter_indexes:
            if safe_create_index(field, name=name):
                success_count += 1

        print(f"✅ Created/verified {success_count} indexes")

        return True

    except PyMongoError as e:
        print(f"❌ Error creating indexes: {e}")
        return False


def drop_trait_indexes() -> bool:
    """
    Drop all trait-related indexes (for development/testing).

    Returns:
        bool: True if successful, False otherwise
    """
    try:
        collection = get_traits_collection(required=True)
        if collection is None:
            print("Error: Could not connect to MongoDB traits collection")
            return False

        print("Dropping all trait indexes...")

        # Drop all indexes except _id_
        collection.drop_indexes()
        print("✅ Dropped all trait indexes")

        return True

    except PyMongoError as e:
        print(f"❌ Error dropping indexes: {e}")
        return False


def setup_trait_collection() -> bool:
    """
    Complete setup of trait collection with indexes.

    Returns:
        bool: True if successful, False otherwise
    """
    print("🧬 Setting up trait management collection")
    print("=" * 50)

    success = create_trait_indexes()

    if success:
        print("\n🎉 Trait collection setup completed successfully!")
        print("The collection is ready for trait management operations.")
    else:
        print("\n⚠️  Setup failed. Please check the errors above.")

    return success


if __name__ == "__main__":
    import sys

    setup_trait_collection()
