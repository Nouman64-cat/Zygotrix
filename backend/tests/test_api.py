import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_trait_catalogue_lists_defaults() -> None:
    response = client.get("/api/traits")
    payload = response.json()
    assert response.status_code == 200
    trait_keys = {trait["key"] for trait in payload["traits"]}
    assert {"eye_color", "blood_type", "hair_color"}.issubset(trait_keys)


def test_create_custom_trait_persists() -> None:
    payload = {
        "key": "coat_color_create",
        "name": "Coat Color",
        "alleles": ["B", "b"],
        "phenotype_map": {"BB": "Black", "Bb": "Black", "bb": "Brown"},
        "description": "Coat color example",
        "metadata": {"source": "unit-test"},
    }
    response = client.post("/api/traits", json=payload)
    assert response.status_code == 201
    trait = response.json()["trait"]
    assert trait["key"] == payload["key"]
    assert trait["metadata"]["source"] == "unit-test"

    listing = client.get("/api/traits").json()
    assert any(tr["key"] == payload["key"] for tr in listing["traits"])


def test_update_custom_trait() -> None:
    base_payload = {
        "key": "coat_color_update",
        "name": "Coat Color",
        "alleles": ["B", "b"],
        "phenotype_map": {"BB": "Black", "Bb": "Black", "bb": "Brown"},
    }
    client.post("/api/traits", json=base_payload)

    update_payload = {
        "key": "coat_color_update",
        "name": "Updated Coat Color",
        "alleles": ["B", "b"],
        "phenotype_map": {"BB": "Black", "Bb": "Chocolate", "bb": "Brown"},
        "description": "Updated description",
        "metadata": {"updated": "true"},
    }
    response = client.put("/api/traits/coat_color_update", json=update_payload)
    assert response.status_code == 200
    trait = response.json()["trait"]
    assert trait["name"] == "Updated Coat Color"
    assert trait["phenotype_map"]["Bb"] == "Chocolate"


def test_delete_trait() -> None:
    payload = {
        "key": "coat_color_delete",
        "name": "Delete Coat",
        "alleles": ["C", "c"],
        "phenotype_map": {"CC": "Cream", "Cc": "Cream", "cc": "White"},
    }
    client.post("/api/traits", json=payload)

    response = client.delete("/api/traits/coat_color_delete")
    assert response.status_code == 204

    second_delete = client.delete("/api/traits/coat_color_delete")
    assert second_delete.status_code == 404


def test_mendelian_simulation_returns_percentages() -> None:
    body = {
        "parent1_genotypes": {"eye_color": "Bb", "blood_type": "AO"},
        "parent2_genotypes": {"eye_color": "bb", "blood_type": "BO"},
        "trait_filter": ["blood_type"],
        "as_percentages": True,
    }
    response = client.post("/api/mendelian/simulate", json=body)
    payload = response.json()
    assert response.status_code == 200
    assert "blood_type" in payload["results"]
    distribution = payload["results"]["blood_type"]
    assert sum(distribution.values()) == 100.0
    assert payload["missing_traits"] == []


def test_polygenic_score_endpoint() -> None:
    body = {
        "parent1_genotype": {"rs1": 1.0, "rs2": 0.0},
        "parent2_genotype": {"rs1": 2.0, "rs2": 0.0},
        "weights": {"rs1": 0.6, "rs2": -0.2},
    }
    response = client.post("/api/polygenic/score", json=body)
    assert response.status_code == 200
    assert response.json()["expected_score"] == pytest.approx(0.9, rel=1e-6)


def test_mendelian_simulation_missing_trait() -> None:
    body = {
        "parent1_genotypes": {"unknown": "AA"},
        "parent2_genotypes": {"unknown": "AA"},
        "trait_filter": ["unknown"],
    }
    response = client.post("/api/mendelian/simulate", json=body)
    assert response.status_code == 404