#!/usr/bin/env python3
"""
Test the joint phenotype calculation implementation.
"""

import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from zygotrix_engine import Simulator, Trait


def test_joint_phenotype_calculation():
    """Test joint phenotype calculation with example traits."""

    # Define the traits for testing
    eye_color = Trait(
        name="Eye Color",
        alleles=("B", "b"),
        phenotype_map={"BB": "Brown", "Bb": "Brown", "bb": "Blue"},
        description="Simplified eye color model with brown dominant over blue",
    )

    hair_texture = Trait(
        name="Hair Texture",
        alleles=("C", "c"),
        phenotype_map={"CC": "Curly", "Cc": "Curly", "cc": "Straight"},
        description="Hair texture with curly dominant over straight",
    )

    # Create simulator with test traits
    trait_registry = {"eye_color": eye_color, "hair_texture": hair_texture}

    simulator = Simulator(trait_registry=trait_registry)

    # Test case: Bb × Bb for eye color, Cc × Cc for hair texture
    parent1_genotypes = {"eye_color": "Bb", "hair_texture": "Cc"}
    parent2_genotypes = {"eye_color": "Bb", "hair_texture": "Cc"}

    print("Testing joint phenotype calculation...")
    print(f"Parent 1: {parent1_genotypes}")
    print(f"Parent 2: {parent2_genotypes}")
    print()

    # Run joint phenotype simulation
    joint_results = simulator.simulate_joint_phenotypes(
        parent1_genotypes, parent2_genotypes, as_percentages=True
    )

    print("Joint Phenotype Results:")
    for phenotype, probability in sorted(
        joint_results.items(), key=lambda x: x[1], reverse=True
    ):
        print(f"  {phenotype}: {probability:.2f}%")

    print()

    # Expected results for verification
    expected_results = {
        "Brown + Curly": 56.25,
        "Brown + Straight": 18.75,
        "Blue + Curly": 18.75,
        "Blue + Straight": 6.25,
    }

    print("Expected Results:")
    for phenotype, probability in expected_results.items():
        print(f"  {phenotype}: {probability:.2f}%")

    print()

    # Verify results match expectations
    print("Verification:")
    all_correct = True
    for phenotype, expected_prob in expected_results.items():
        actual_prob = joint_results.get(phenotype, 0.0)
        is_correct = (
            abs(actual_prob - expected_prob) < 0.01
        )  # Allow small floating point errors
        print(
            f"  {phenotype}: {'✓' if is_correct else '✗'} (expected {expected_prob:.2f}%, got {actual_prob:.2f}%)"
        )
        if not is_correct:
            all_correct = False

    print()
    print(
        f"Overall: {'✓ All tests passed!' if all_correct else '✗ Some tests failed!'}"
    )

    # Also test individual trait calculations for comparison
    print("\n" + "=" * 50)
    print("Individual Trait Results (for comparison):")

    individual_results = simulator.simulate_mendelian_traits(
        parent1_genotypes, parent2_genotypes, as_percentages=True
    )

    for trait_key, trait_results in individual_results.items():
        print(f"\n{trait_key}:")
        for phenotype, probability in trait_results.items():
            print(f"  {phenotype}: {probability:.2f}%")

    return all_correct


if __name__ == "__main__":
    success = test_joint_phenotype_calculation()
    sys.exit(0 if success else 1)
