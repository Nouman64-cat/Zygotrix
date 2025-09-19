import os

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("MONGODB_URI", "mongomock://localhost")
os.environ.setdefault("AUTH_SECRET_KEY", "test-secret-key")
os.environ.setdefault("RESEND_API_KEY", "test-key")
os.environ.setdefault("RESEND_FROM_EMAIL", "noreply@example.test")

from app import services
from app.main import app

client = TestClient(app)


def test_health_endpoint() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_user_signup_and_portal_flow(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(services, "generate_otp_code", lambda: "123456")

    payload = {
        "email": "tester@example.com",
        "password": "SuperSecure1",
        "full_name": "Portal Tester",
    }
    response = client.post("/api/auth/signup", json=payload)
    assert response.status_code == 202
    assert "expires_at" in response.json()

    wrong = client.post(
        "/api/auth/signup/verify",
        json={"email": payload["email"], "otp": "000000"},
    )
    assert wrong.status_code == 400

    verify = client.post(
        "/api/auth/signup/verify",
        json={"email": payload["email"], "otp": "123456"},
    )
    assert verify.status_code == 200
    assert "Account created" in verify.json()["message"]

    login = client.post(
        "/api/auth/login",
        json={"email": payload["email"], "password": payload["password"]},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]

    me_response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_response.status_code == 200
    assert me_response.json()["email"] == payload["email"]

    portal_response = client.get(
        "/api/portal/status",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert portal_response.status_code == 200
    assert "Welcome" in portal_response.json()["message"]


def test_duplicate_signup_rejected(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(services, "generate_otp_code", lambda: "111222")

    payload = {
        "email": "duplicate@example.com",
        "password": "UniquePass1",
    }
    client.post("/api/auth/signup", json=payload)
    client.post(
        "/api/auth/signup/verify",
        json={"email": payload["email"], "otp": "111222"},
    )

    second = client.post("/api/auth/signup", json=payload)
    assert second.status_code == 400


def test_login_with_invalid_password() -> None:
    services.create_user_account("loginuser@example.com", "ValidPass1", None)

    response = client.post(
        "/api/auth/login",
        json={"email": "loginuser@example.com", "password": "WrongPass1"},
    )
    assert response.status_code == 401


def test_portal_requires_authentication() -> None:
    response = client.get("/api/portal/status")
    assert response.status_code == 403


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
