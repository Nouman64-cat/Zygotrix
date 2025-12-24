"""
Traits Enrichment Service for genetics context.

Extracted from chatbot.py as part of Phase 2.4 refactoring.
Handles pattern matching for genetics queries, trait database lookups,
and Punnett square calculations.
"""

import re
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class TraitsEnrichmentService:
    """
    Service for enriching chat context with genetics/traits information.
    
    Features:
    - Pattern matching for genetics queries
    - Trait database lookups
    - Punnett square calculations
    - Context formatting
    """
    
    def get_traits_context(self, message: str) -> str:
        """
        Detect trait-related queries and fetch relevant data from the traits database.
        
        Returns formatted context string with trait information.
        """
        # Import here to avoid circular imports
        from ...chatbot_tools import (
            get_traits_count,
            search_traits,
            get_trait_details,
            calculate_punnett_square,
            parse_cross_from_message
        )
        
        message_lower = message.lower()
        context_parts = []
        
        # ==== CHECK FOR PUNNETT SQUARE / CROSS QUERIES ====
        cross_keywords = ["cross", "punnett", "×", "offspring", "genotype", "phenotype"]
        if any(keyword in message_lower for keyword in cross_keywords):
            cross_data = parse_cross_from_message(message)
            if cross_data.get("found"):
                p1 = cross_data["parent1"]
                p2 = cross_data["parent2"]
                result = calculate_punnett_square(p1, p2)
                
                if result.get("success"):
                    genotype_info = []
                    for g in result["offspring_genotypes"]:
                        genotype_info.append(f"  - {g['genotype']}: {g['percentage']} ({g['phenotype']})")
                    
                    phenotype_info = []
                    for p in result["offspring_phenotypes"]:
                        phenotype_info.append(f"  - {p['phenotype']}: {p['percentage']}")
                    
                    grid = result.get("punnett_square", {})
                    grid_text = ""
                    if grid:
                        header = grid.get("header", [])
                        rows = grid.get("rows", [])
                        grid_text = f"\nPunnett Square:\n"
                        grid_text += "    " + "  ".join(header[1:]) + "\n"
                        for row in rows:
                            grid_text += f" {row[0]}  " + "  ".join(row[1:]) + "\n"
                    
                    context_parts.append(f"""
PUNNETT SQUARE CALCULATION RESULTS:
Cross: {p1} × {p2}
Cross Type: {result['cross_type']}
{grid_text}
Offspring Genotypes:
{chr(10).join(genotype_info)}

Genotype Ratio: {result['genotype_ratio']}
Phenotype Ratio: {result['phenotype_ratio']}

Summary: {result['summary']}
""")
        
        # ==== CHECK FOR COUNT QUERIES ====
        count_patterns = [
            r"how many traits",
            r"number of traits",
            r"total traits",
            r"traits.*count",
            r"count.*traits",
            r"traits.*available",
            r"traits.*have",
            r"traits.*database"
        ]
        
        if any(re.search(pattern, message_lower) for pattern in count_patterns):
            count_data = get_traits_count()
            if not count_data.get("error"):
                context_parts.append(f"""
TRAITS DATABASE INFO:
{count_data['message']}
- Total traits: {count_data['total_traits']}
- Monogenic traits (single gene): {count_data['monogenic_traits']}
- Polygenic traits (multiple genes): {count_data['polygenic_traits']}
""")
        
        # ==== CHECK FOR TRAIT EXPLANATION QUERIES ====
        explain_patterns = [
            r"explain\s+(.+?)(?:\s+trait)?$",
            r"tell me about\s+(.+?)(?:\s+trait)?$",
            r"what is\s+(.+?)(?:\s+trait)?$",
            r"describe\s+(.+?)(?:\s+trait)?$",
            r"how does\s+(.+?)\s+work",
            r"information about\s+(.+)",
            r"details on\s+(.+)",
        ]
        
        for pattern in explain_patterns:
            match = re.search(pattern, message_lower)
            if match:
                trait_query = match.group(1).strip()
                if trait_query not in ["the", "a", "this", "it", "that", "trait", "genetics"]:
                    trait_details = get_trait_details(trait_query)
                    if trait_details.get("found"):
                        context_parts.append(f"""
TRAIT DETAILS FROM DATABASE:
Trait Name: {trait_details['name']}
Type: {trait_details['type']}
Inheritance: {trait_details['inheritance']}
Gene(s): {trait_details['genes']}
Chromosome(s): {trait_details['chromosomes']}
Alleles: {', '.join(trait_details['alleles'])}
Phenotypes: {'; '.join(trait_details['phenotype_summary'])}

Description: {trait_details['description']}
""")
                    break
        
        # ==== SEARCH FOR RELATED TRAITS ====
        if not context_parts:
            search_result = search_traits(message_lower, limit=3)
            if search_result.get("found") and search_result.get("count", 0) > 0:
                results = search_result.get("results", [])
                if results:
                    traits_info = []
                    for r in results[:3]:
                        traits_info.append(f"- {r['name']} ({r['type']}, {r['inheritance']})")
                    
                    context_parts.append(f"""
RELATED TRAITS FROM DATABASE:
Found {len(results)} matching trait(s):
{chr(10).join(traits_info)}

(User can ask for more details about any of these traits)
""")
        
        return "\n".join(context_parts)
    
    def detect_genetics_query(self, message: str) -> bool:
        """Check if the message is related to genetics/traits."""
        genetics_keywords = [
            "trait", "gene", "allele", "genotype", "phenotype",
            "punnett", "cross", "inheritance", "dominant", "recessive",
            "chromosome", "dna", "mutation", "heredity"
        ]
        message_lower = message.lower()
        return any(keyword in message_lower for keyword in genetics_keywords)


# Global singleton instance
_traits_service: Optional[TraitsEnrichmentService] = None


def get_traits_service() -> TraitsEnrichmentService:
    """Get or create the global TraitsEnrichmentService instance."""
    global _traits_service
    if _traits_service is None:
        _traits_service = TraitsEnrichmentService()
    return _traits_service