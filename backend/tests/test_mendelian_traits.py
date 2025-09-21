"""Tests for Mendelian traits functionality."""

import pytest
from fastapi.testclient import TestClient
from pymongo.collection import Collection

from app.main import app
from app.services import get_traits_collection, save_trait


@pytest.fixture
def client():
    """Test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
def clean_traits_collection():
    """Clean traits collection before each test."""
    collection = get_traits_collection()
    if collection:
        collection.delete_many({})
    yield collection
    if collection:
        collection.delete_many({})


class TestMendelianTraitMetadata:
    """Test Mendelian trait metadata functionality."""

    def test_save_trait_with_mendelian_metadata(self, clean_traits_collection):
        """Test saving a trait with Mendelian metadata fields."""
        trait_data = {
            "name": "Test Dimples",
            "alleles": ["D", "d"],
            "phenotype_map": {"DD": "Dimples", "Dd": "Dimples", "dd": "No dimples"},
            "description": "Test trait for dimples",
            "inheritance_pattern": "autosomal_dominant",
            "verification_status": "simplified",
            "gene_info": None,
            "category": "physical_traits",
            "metadata": {"source": "test"}
        }
        
        trait = save_trait("test_dimples", trait_data)
        
        assert trait.name == "Test Dimples"
        assert trait.alleles == ("D", "d")
        assert trait.metadata.get("inheritance_pattern") == "autosomal_dominant"
        assert trait.metadata.get("verification_status") == "simplified"
        assert trait.metadata.get("category") == "physical_traits"

    def test_save_trait_with_gene_info(self, clean_traits_collection):
        """Test saving a trait with gene information."""
        trait_data = {
            "name": "Red Hair Test",
            "alleles": ["R", "r"],
            "phenotype_map": {"RR": "Non-red", "Rr": "Non-red", "rr": "Red"},
            "description": "Test red hair trait",
            "inheritance_pattern": "autosomal_recessive",
            "verification_status": "verified",
            "gene_info": "MC1R",
            "category": "physical_traits"
        }
        
        trait = save_trait("test_red_hair", trait_data)
        
        assert trait.metadata.get("gene_info") == "MC1R"
        assert trait.metadata.get("verification_status") == "verified"

    def test_trait_backward_compatibility(self, clean_traits_collection):
        """Test that old traits without metadata still work."""
        trait_data = {
            "name": "Simple Trait",
            "alleles": ["A", "a"],
            "phenotype_map": {"AA": "Dominant", "Aa": "Dominant", "aa": "Recessive"},
            "description": "Simple test trait"
        }
        
        trait = save_trait("simple_trait", trait_data)
        
        assert trait.name == "Simple Trait"
        assert trait.metadata.get("inheritance_pattern") is None
        assert trait.metadata.get("verification_status") is None


class TestTraitFiltering:
    """Test trait filtering functionality."""

    def setup_method(self):
        """Set up test traits with different metadata."""
        # Clean collection
        collection = get_traits_collection()
        if collection:
            collection.delete_many({})
        
        # Create test traits
        dominant_trait = {
            "name": "Dominant Trait",
            "alleles": ["D", "d"],
            "phenotype_map": {"DD": "Dominant", "Dd": "Dominant", "dd": "Recessive"},
            "inheritance_pattern": "autosomal_dominant",
            "verification_status": "simplified",
            "category": "physical_traits"
        }
        save_trait("dominant_test", dominant_trait)
        
        recessive_trait = {
            "name": "Recessive Trait", 
            "alleles": ["R", "r"],
            "phenotype_map": {"RR": "Normal", "Rr": "Normal", "rr": "Trait"},
            "inheritance_pattern": "autosomal_recessive",
            "verification_status": "verified",
            "gene_info": "TEST_GENE",
            "category": "sensory_traits"
        }
        save_trait("recessive_test", recessive_trait)

    def test_filter_by_inheritance_pattern(self, client):
        """Test filtering traits by inheritance pattern."""
        self.setup_method()
        
        # Test dominant filter
        response = client.get("/api/traits?inheritance_pattern=autosomal_dominant")
        assert response.status_code == 200
        traits = response.json()["traits"]
        assert len(traits) >= 1
        assert all(t.get("inheritance_pattern") == "autosomal_dominant" for t in traits)
        
        # Test recessive filter
        response = client.get("/api/traits?inheritance_pattern=autosomal_recessive")
        assert response.status_code == 200
        traits = response.json()["traits"]
        assert len(traits) >= 1
        assert all(t.get("inheritance_pattern") == "autosomal_recessive" for t in traits)

    def test_filter_by_verification_status(self, client):
        """Test filtering traits by verification status."""
        self.setup_method()
        
        # Test verified filter
        response = client.get("/api/traits?verification_status=verified")
        assert response.status_code == 200
        traits = response.json()["traits"]
        assert len(traits) >= 1
        assert all(t.get("verification_status") == "verified" for t in traits)
        
        # Test simplified filter
        response = client.get("/api/traits?verification_status=simplified")
        assert response.status_code == 200
        traits = response.json()["traits"]
        assert len(traits) >= 1
        assert all(t.get("verification_status") == "simplified" for t in traits)

    def test_filter_by_category(self, client):
        """Test filtering traits by category."""
        self.setup_method()
        
        response = client.get("/api/traits?category=physical_traits")
        assert response.status_code == 200
        traits = response.json()["traits"]
        assert len(traits) >= 1
        assert all(t.get("category") == "physical_traits" for t in traits)

    def test_filter_by_gene_info(self, client):
        """Test filtering traits by gene information."""
        self.setup_method()
        
        response = client.get("/api/traits?gene_info=TEST_GENE")
        assert response.status_code == 200
        traits = response.json()["traits"]
        assert len(traits) >= 1
        assert all(t.get("gene_info") == "TEST_GENE" for t in traits)

    def test_multiple_filters(self, client):
        """Test applying multiple filters simultaneously."""
        self.setup_method()
        
        response = client.get("/api/traits?inheritance_pattern=autosomal_recessive&verification_status=verified")
        assert response.status_code == 200
        traits = response.json()["traits"]
        assert len(traits) >= 1
        for trait in traits:
            assert trait.get("inheritance_pattern") == "autosomal_recessive"
            assert trait.get("verification_status") == "verified"


class TestAPI:
    """Test API endpoints for Mendelian traits."""

    def test_create_trait_with_metadata(self, client, clean_traits_collection):
        """Test creating a trait with Mendelian metadata via API."""
        payload = {
            "key": "api_test_trait",
            "name": "API Test Trait",
            "alleles": ["T", "t"],
            "phenotype_map": {"TT": "Trait", "Tt": "Trait", "tt": "No trait"},
            "description": "Test trait created via API",
            "inheritance_pattern": "autosomal_dominant",
            "verification_status": "simplified",
            "category": "physical_traits"
        }
        
        response = client.post("/api/traits", json=payload)
        assert response.status_code == 201
        
        trait_data = response.json()["trait"]
        assert trait_data["key"] == "api_test_trait"
        assert trait_data["inheritance_pattern"] == "autosomal_dominant"
        assert trait_data["verification_status"] == "simplified"
        assert trait_data["category"] == "physical_traits"

    def test_update_trait_with_metadata(self, client, clean_traits_collection):
        """Test updating a trait with new metadata."""
        # First create a trait
        create_payload = {
            "key": "update_test",
            "name": "Update Test",
            "alleles": ["U", "u"],
            "phenotype_map": {"UU": "Trait", "Uu": "Trait", "uu": "No trait"}
        }
        client.post("/api/traits", json=create_payload)
        
        # Then update it with metadata
        update_payload = {
            "key": "update_test",
            "name": "Updated Test",
            "alleles": ["U", "u"],
            "phenotype_map": {"UU": "Trait", "Uu": "Trait", "uu": "No trait"},
            "inheritance_pattern": "autosomal_dominant",
            "verification_status": "verified",
            "gene_info": "UPDATE_GENE"
        }
        
        response = client.put("/api/traits/update_test", json=update_payload)
        assert response.status_code == 200
        
        trait_data = response.json()["trait"]
        assert trait_data["name"] == "Updated Test"
        assert trait_data["inheritance_pattern"] == "autosomal_dominant"
        assert trait_data["gene_info"] == "UPDATE_GENE"

    def test_list_traits_with_filters(self, client):
        """Test the traits listing endpoint with filters."""
        response = client.get("/api/traits")
        assert response.status_code == 200
        all_traits = response.json()["traits"]
        
        # Test filtering
        response = client.get("/api/traits?inheritance_pattern=autosomal_dominant")
        assert response.status_code == 200
        filtered_traits = response.json()["traits"]
        
        # Should have fewer or equal traits when filtered
        assert len(filtered_traits) <= len(all_traits)


class TestMendelianSimulation:
    """Test Mendelian simulations with new traits."""

    def test_simulate_dominant_trait(self, client):
        """Test simulation of autosomal dominant trait."""
        payload = {
            "parent1": {"dimples": "Dd"},
            "parent2": {"dimples": "dd"},
            "traits": ["dimples"],
            "as_percentages": True
        }
        
        response = client.post("/api/mendelian/simulate", json=payload)
        assert response.status_code == 200
        
        results = response.json()["results"]
        assert "dimples" in results
        
        # Should have 50% Dimples, 50% No dimples
        dimples_result = results["dimples"]
        assert "Dimples" in dimples_result
        assert "No dimples" in dimples_result
        assert abs(dimples_result["Dimples"] - 50.0) < 1.0
        assert abs(dimples_result["No dimples"] - 50.0) < 1.0

    def test_simulate_recessive_trait(self, client):
        """Test simulation of autosomal recessive trait."""
        payload = {
            "parent1": {"red_hair": "Rr"},
            "parent2": {"red_hair": "Rr"},
            "traits": ["red_hair"],
            "as_percentages": True
        }
        
        response = client.post("/api/mendelian/simulate", json=payload)
        assert response.status_code == 200
        
        results = response.json()["results"]
        assert "red_hair" in results
        
        # Should have 75% Non-red, 25% Red
        red_hair_result = results["red_hair"]
        assert "Non-red" in red_hair_result
        assert "Red" in red_hair_result
        assert abs(red_hair_result["Non-red"] - 75.0) < 1.0
        assert abs(red_hair_result["Red"] - 25.0) < 1.0


if __name__ == "__main__":
    pytest.main([__file__])