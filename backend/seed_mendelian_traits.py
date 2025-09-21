#!/usr/bin/env python3
"""
MongoDB seed script for Mendelian traits.

This script populates the traits collection with all 19 Mendelian traits
from the MENDELIAN_TRAITS.md documentation.

Usage:
    python seed_mendelian_traits.py
"""

import os
import sys
from typing import Dict, List

# Add the app directory to the path to import our modules
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.services import get_traits_collection
from pymongo.errors import PyMongoError


# Define all 19 Mendelian traits with proper inheritance patterns
MENDELIAN_TRAITS: List[Dict] = [
    {
        "key": "eye_color_mendelian",
        "name": "Eye Color (Brown Dominant)",
        "alleles": ["B", "b"],
        "phenotype_map": {
            "BB": "Brown",
            "Bb": "Brown", 
            "bb": "Blue"
        },
        "description": "Simplified monogenic eye color model with brown dominant over blue",
        "inheritance_pattern": "autosomal_dominant",
        "verification_status": "simplified",
        "gene_info": None,
        "category": "physical_traits",
        "metadata": {
            "source": "Classical genetics textbook model",
            "complexity": "simplified"
        }
    },
    {
        "key": "hair_color_mendelian", 
        "name": "Hair Color (Dark Dominant)",
        "alleles": ["H", "h"],
        "phenotype_map": {
            "HH": "Dark",
            "Hh": "Dark",
            "hh": "Light"
        },
        "description": "Simplified monogenic hair color with dark dominant over light",
        "inheritance_pattern": "autosomal_dominant",
        "verification_status": "simplified", 
        "gene_info": None,
        "category": "physical_traits",
        "metadata": {
            "source": "Classical genetics model",
            "complexity": "simplified"
        }
    },
    {
        "key": "hair_texture",
        "name": "Hair Texture",
        "alleles": ["C", "c"],
        "phenotype_map": {
            "CC": "Curly",
            "Cc": "Curly",
            "cc": "Straight"
        },
        "description": "Hair texture inheritance with curly dominant over straight",
        "inheritance_pattern": "autosomal_dominant",
        "verification_status": "simplified",
        "gene_info": None,
        "category": "physical_traits",
        "metadata": {
            "source": "Mendelian inheritance studies"
        }
    },
    {
        "key": "red_hair",
        "name": "Red Hair",
        "alleles": ["R", "r"],
        "phenotype_map": {
            "RR": "Non-red",
            "Rr": "Non-red",
            "rr": "Red"
        },
        "description": "Red hair inheritance controlled strictly by MC1R gene",
        "inheritance_pattern": "autosomal_recessive",
        "verification_status": "verified",
        "gene_info": "MC1R",
        "category": "physical_traits",
        "metadata": {
            "source": "Verified single-gene trait",
            "gene_location": "16q24.3"
        }
    },
    {
        "key": "albinism",
        "name": "Albinism",
        "alleles": ["A", "a"],
        "phenotype_map": {
            "AA": "Normal pigmentation",
            "Aa": "Normal pigmentation",
            "aa": "Albinism"
        },
        "description": "Albinism inheritance pattern - absence of melanin production",
        "inheritance_pattern": "autosomal_recessive",
        "verification_status": "verified",
        "gene_info": "Multiple genes (TYR, OCA2, etc.)",
        "category": "physical_traits",
        "metadata": {
            "source": "Verified genetic condition",
            "prevalence": "1 in 20,000"
        }
    },
    {
        "key": "freckles",
        "name": "Freckles",
        "alleles": ["F", "f"],
        "phenotype_map": {
            "FF": "Freckles",
            "Ff": "Freckles",
            "ff": "No freckles"
        },
        "description": "Freckles inheritance with freckles dominant",
        "inheritance_pattern": "autosomal_dominant",
        "verification_status": "simplified",
        "gene_info": None,
        "category": "physical_traits",
        "metadata": {
            "source": "Classical Mendelian model"
        }
    },
    {
        "key": "dimples",
        "name": "Dimples",
        "alleles": ["D", "d"],
        "phenotype_map": {
            "DD": "Dimples",
            "Dd": "Dimples",
            "dd": "No dimples"
        },
        "description": "Facial dimples inheritance with dimples dominant",
        "inheritance_pattern": "autosomal_dominant",
        "verification_status": "simplified",
        "gene_info": None,
        "category": "physical_traits",
        "metadata": {
            "source": "Classical genetics studies"
        }
    },
    {
        "key": "cleft_chin",
        "name": "Cleft Chin",
        "alleles": ["C", "c"],
        "phenotype_map": {
            "CC": "Cleft chin",
            "Cc": "Cleft chin", 
            "cc": "Smooth chin"
        },
        "description": "Cleft chin inheritance with cleft dominant over smooth",
        "inheritance_pattern": "autosomal_dominant",
        "verification_status": "simplified",
        "gene_info": None,
        "category": "physical_traits",
        "metadata": {
            "source": "Classical Mendelian studies"
        }
    },
    {
        "key": "forehead_shape",
        "name": "Forehead Shape",
        "alleles": ["W", "w"],
        "phenotype_map": {
            "WW": "Widow's peak",
            "Ww": "Widow's peak",
            "ww": "Straight hairline"
        },
        "description": "Forehead hairline shape with widow's peak dominant",
        "inheritance_pattern": "autosomal_dominant",
        "verification_status": "simplified",
        "gene_info": None,
        "category": "physical_traits",
        "metadata": {
            "source": "Traditional genetics textbook"
        }
    },
    {
        "key": "unibrow",
        "name": "Unibrow",
        "alleles": ["U", "u"],
        "phenotype_map": {
            "UU": "Unibrow",
            "Uu": "Unibrow",
            "uu": "Separate eyebrows"
        },
        "description": "Eyebrow connection pattern with unibrow dominant",
        "inheritance_pattern": "autosomal_dominant",
        "verification_status": "simplified",
        "gene_info": None,
        "category": "physical_traits",
        "metadata": {
            "source": "Mendelian inheritance model"
        }
    },
    {
        "key": "earlobes",
        "name": "Earlobe Attachment",
        "alleles": ["E", "e"],
        "phenotype_map": {
            "EE": "Free earlobes",
            "Ee": "Free earlobes",
            "ee": "Attached earlobes"
        },
        "description": "Earlobe attachment pattern with free dominant over attached",
        "inheritance_pattern": "autosomal_dominant",
        "verification_status": "simplified",
        "gene_info": None,
        "category": "physical_traits",
        "metadata": {
            "source": "Classical genetics textbook"
        }
    },
    {
        "key": "darwins_tubercle",
        "name": "Darwin's Tubercle",
        "alleles": ["T", "t"],
        "phenotype_map": {
            "TT": "Tubercle present",
            "Tt": "Tubercle present",
            "tt": "Tubercle absent"
        },
        "description": "Small cartilaginous projection on the ear with tubercle dominant",
        "inheritance_pattern": "autosomal_dominant",
        "verification_status": "simplified",
        "gene_info": None,
        "category": "physical_traits",
        "metadata": {
            "source": "Anatomical genetics studies"
        }
    },
    {
        "key": "tongue_rolling",
        "name": "Tongue Rolling",
        "alleles": ["R", "r"],
        "phenotype_map": {
            "RR": "Can roll tongue",
            "Rr": "Can roll tongue",
            "rr": "Cannot roll tongue"
        },
        "description": "Ability to roll tongue into U-shape with rolling dominant",
        "inheritance_pattern": "autosomal_dominant",
        "verification_status": "simplified",
        "gene_info": None,
        "category": "behavioral_traits",
        "metadata": {
            "source": "Classical genetics, though more complex than simple dominance"
        }
    },
    {
        "key": "hitchhikers_thumb",
        "name": "Hitchhiker's Thumb",
        "alleles": ["H", "h"],
        "phenotype_map": {
            "HH": "Straight thumb",
            "Hh": "Straight thumb",
            "hh": "Hitchhiker's thumb"
        },
        "description": "Thumb hyperextension ability with straight thumb dominant",
        "inheritance_pattern": "autosomal_recessive",
        "verification_status": "simplified",
        "gene_info": None,
        "category": "physical_traits",
        "metadata": {
            "source": "Classical genetics studies"
        }
    },
    {
        "key": "mid_digital_hair",
        "name": "Mid-Digital Hair",
        "alleles": ["M", "m"],
        "phenotype_map": {
            "MM": "Hair present",
            "Mm": "Hair present",
            "mm": "Hair absent"
        },
        "description": "Hair on middle segments of fingers with hair presence dominant",
        "inheritance_pattern": "autosomal_dominant",
        "verification_status": "simplified",
        "gene_info": None,
        "category": "physical_traits",
        "metadata": {
            "source": "Classical Mendelian studies"
        }
    },
    {
        "key": "bent_little_finger",
        "name": "Bent Little Finger",
        "alleles": ["B", "b"],
        "phenotype_map": {
            "BB": "Bent finger",
            "Bb": "Bent finger",
            "bb": "Straight finger"
        },
        "description": "Curvature of the little finger with bent dominant",
        "inheritance_pattern": "autosomal_dominant",
        "verification_status": "simplified",
        "gene_info": None,
        "category": "physical_traits",
        "metadata": {
            "source": "Traditional genetics textbook"
        }
    },
    {
        "key": "ptc_tasting",
        "name": "PTC Tasting Ability",
        "alleles": ["T", "t"],
        "phenotype_map": {
            "TT": "Can taste PTC",
            "Tt": "Can taste PTC",
            "tt": "Cannot taste PTC"
        },
        "description": "Ability to taste phenylthiocarbamide (PTC) with tasting dominant",
        "inheritance_pattern": "autosomal_dominant",
        "verification_status": "simplified",
        "gene_info": "TAS2R38",
        "category": "sensory_traits",
        "metadata": {
            "source": "Well-studied taste genetics",
            "gene_location": "7q36.1"
        }
    },
    {
        "key": "interlocking_fingers",
        "name": "Interlocking Fingers Habit",
        "alleles": ["L", "R"],
        "phenotype_map": {
            "LL": "Left thumb on top",
            "LR": "Variable",
            "RR": "Right thumb on top"
        },
        "description": "Preferred thumb position when interlocking fingers",
        "inheritance_pattern": "autosomal",
        "verification_status": "simplified",
        "gene_info": None,
        "category": "behavioral_traits",
        "metadata": {
            "source": "Behavioral genetics studies",
            "note": "Complex inheritance pattern"
        }
    },
    {
        "key": "hand_clasping",
        "name": "Hand Clasping",
        "alleles": ["L", "R"],
        "phenotype_map": {
            "LL": "Left hand on top",
            "LR": "Variable",
            "RR": "Right hand on top"
        },
        "description": "Preferred hand position when clasping hands behind back",
        "inheritance_pattern": "autosomal",
        "verification_status": "simplified",
        "gene_info": None,
        "category": "behavioral_traits",
        "metadata": {
            "source": "Behavioral genetics studies",
            "note": "Complex inheritance pattern"
        }
    }
]


def seed_mendelian_traits():
    """Seed the MongoDB traits collection with all 19 Mendelian traits."""
    
    collection = get_traits_collection(required=True)
    if collection is None:
        print("Error: Could not connect to MongoDB traits collection")
        return False
    
    print(f"Seeding {len(MENDELIAN_TRAITS)} Mendelian traits...")
    
    success_count = 0
    error_count = 0
    
    for trait_data in MENDELIAN_TRAITS:
        try:
            # Use upsert to avoid duplicates
            result = collection.update_one(
                {"key": trait_data["key"]},
                {"$set": trait_data},
                upsert=True
            )
            
            if result.upserted_id:
                print(f"✅ Inserted new trait: {trait_data['key']}")
            else:
                print(f"🔄 Updated existing trait: {trait_data['key']}")
            
            success_count += 1
            
        except PyMongoError as e:
            print(f"❌ Error inserting trait {trait_data['key']}: {e}")
            error_count += 1
    
    print(f"\nSeeding completed:")
    print(f"  ✅ Successful: {success_count}")
    print(f"  ❌ Errors: {error_count}")
    
    return error_count == 0


def create_indexes():
    """Create MongoDB indexes for efficient trait filtering."""
    
    collection = get_traits_collection(required=True)
    if collection is None:
        print("Error: Could not connect to MongoDB traits collection")
        return False
    
    print("Creating MongoDB indexes...")
    
    try:
        # Create indexes for filtering
        collection.create_index("inheritance_pattern")
        collection.create_index("verification_status") 
        collection.create_index("category")
        collection.create_index("gene_info")
        
        print("✅ Created indexes for efficient trait filtering")
        return True
        
    except PyMongoError as e:
        print(f"❌ Error creating indexes: {e}")
        return False


if __name__ == "__main__":
    print("🧬 Mendelian Traits MongoDB Seeder")
    print("=" * 40)
    
    # Seed the traits
    traits_success = seed_mendelian_traits()
    
    # Create indexes
    indexes_success = create_indexes()
    
    if traits_success and indexes_success:
        print("\n🎉 All operations completed successfully!")
        print("\nYou can now use the Mendelian traits in your Zygotrix application.")
    else:
        print("\n⚠️  Some operations failed. Please check the errors above.")
        sys.exit(1)