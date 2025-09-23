#!/usr/bin/env python3
"""
Test the joint phenotype API endpoint.
"""

import json
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from fastapi.testclient import TestClient
from backend.app.main import app


def test_joint_phenotype_api():
    """Test the joint phenotype simulation API endpoint."""

    client = TestClient(app)

    # Test payload
    payload = {
        "parent1_genotypes": {"eye_color": "Bb", "hair_texture": "Cc"},
        "parent2_genotypes": {"eye_color": "Bb", "hair_texture": "Cc"},
        "as_percentages": True,
    }

    print("Testing joint phenotype API endpoint...")
    print(f"Payload: {json.dumps(payload, indent=2)}")

    # Make the request
    response = client.post("/api/mendelian/simulate-joint", json=payload)

    print(f"Response status: {response.status_code}")

    if response.status_code == 200:
        result = response.json()
        print("API Response:")
        print(json.dumps(result, indent=2))

        # Check if we have the expected results
        expected_phenotypes = [
            "Brown + Curly",
            "Brown + Straight",
            "Blue + Curly",
            "Blue + Straight",
        ]
        actual_phenotypes = list(result["results"].keys())

        print("\nVerification:")
        all_correct = True
        for phenotype in expected_phenotypes:
            if phenotype in actual_phenotypes:
                print(f"  ✓ {phenotype}: {result['results'][phenotype]:.2f}%")
            else:
                print(f"  ✗ {phenotype}: Not found")
                all_correct = False

        if all_correct:
            print("\n✓ API test passed!")
            return True
        else:
            print("\n✗ API test failed!")
            return False
    else:
        print(f"Error response: {response.text}")
        return False


if __name__ == "__main__":
    success = test_joint_phenotype_api()
    sys.exit(0 if success else 1)
