"""Database module - MongoDB collections and utilities."""

from .collection_factory import CollectionFactory, get_collection

__all__ = [
    "CollectionFactory",
    "get_collection",
]
