#!/usr/bin/env python3
"""
Test script to verify C++ engine integration with backend.
This script tests the mendelian service directly without starting the full API server.
"""

from app.config import get_settings
from app.services import mendelian as mendelian_services
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))


def test_cpp_integration():
    """Test C++ engine integration with mendelian service."""

    print("=" * 60)
    print("Testing C++ Engine Integration with Backend")
    print("=" * 60)

    # Check configuration
    settings = get_settings()
    print(f"\nConfiguration:")
    print(f"  use_cpp_engine: {settings.use_cpp_engine}")
    print(f"  cpp_engine_cli_path: {settings.cpp_engine_cli_path}")

    # Test 1: Simple Mendelian cross (ABO Blood Group)
    print("\n" + "-" * 60)
    print("Test 1: ABO Blood Group Cross (AO × BO)")
    print("-" * 60)

    try:
        results, missing = mendelian_services.simulate_mendelian_traits(
            parent1={"abo_blood_group": "AO"},
            parent2={"abo_blood_group": "BO"},
            trait_filter=["abo_blood_group"],
            as_percentages=True,
            max_traits=5
        )

        print(f"✅ Success!")
        print(f"Missing traits: {missing}")
        print(f"Results: {results}")
        if results:
            for trait, data in results.items():
                print(f"  {trait}:")
                if isinstance(data, dict):
                    print(
                        f"    Genotypic ratios: {data.get('genotypic_ratios', {})}")
                    print(
                        f"    Phenotypic ratios: {data.get('phenotypic_ratios', {})}")
                else:
                    print(f"    Data: {data}")
        else:
            print("  (No results returned)")
    except Exception as e:
        print(f"❌ Failed: {e}")
        import traceback
        traceback.print_exc()
        return False

    # Test 2: Multiple traits
    print("\n" + "-" * 60)
    print("Test 2: Multiple Traits (ABO Blood + Rh Factor)")
    print("-" * 60)

    try:
        results, missing = mendelian_services.simulate_mendelian_traits(
            parent1={"abo_blood_group": "AB", "rh_factor": "Rh+Rh+"},
            parent2={"abo_blood_group": "OO", "rh_factor": "Rh-Rh-"},
            trait_filter=["abo_blood_group", "rh_factor"],
            as_percentages=True,
            max_traits=5
        )

        print(f"✅ Success!")
        print(f"Missing traits: {missing}")
        print(f"Results: {results}")
        if results:
            for trait, data in results.items():
                print(f"  {trait}:")
                if isinstance(data, dict):
                    print(
                        f"    Genotypic ratios: {data.get('genotypic_ratios', {})}")
                    print(
                        f"    Phenotypic ratios: {data.get('phenotypic_ratios', {})}")
                else:
                    print(f"    Data: {data}")
        else:
            print("  (No results returned)")
    except Exception as e:
        print(f"❌ Failed: {e}")
        import traceback
        traceback.print_exc()
        return False

    # Test 3: Joint phenotypes
    print("\n" + "-" * 60)
    print("Test 3: Joint Phenotypes (ABO Blood + Rh Factor)")
    print("-" * 60)

    try:
        results, missing = mendelian_services.simulate_joint_phenotypes(
            parent1={"abo_blood_group": "AB", "rh_factor": "Rh+Rh+"},
            parent2={"abo_blood_group": "OO", "rh_factor": "Rh-Rh-"},
            trait_filter=["abo_blood_group", "rh_factor"],
            as_percentages=True,
            max_traits=5
        )

        print(f"✅ Success!")
        print(f"Missing traits: {missing}")
        print(f"Joint phenotype results:")
        for phenotype, probability in results.items():
            print(f"  {phenotype}: {probability}%")
    except Exception as e:
        print(f"❌ Failed: {e}")
        import traceback
        traceback.print_exc()
        return False

    print("\n" + "=" * 60)
    print("✅ All Tests Passed!")
    print("=" * 60)
    return True


if __name__ == "__main__":
    success = test_cpp_integration()
    sys.exit(0 if success else 1)
