import json
import logging
import re
from app.services.ai import get_claude_service
from app.services.cpp_engine import run_pedigree_analysis
from app.schema.pedigree import PedigreeRequest, PedigreeResponse, PedigreeStructure

logger = logging.getLogger(__name__)

# Specialized System Prompt for Extraction
EXTRACTION_PROMPT = """
You are a Genetic Data Extractor for Zygotrix. 
Your ONLY job is to convert the user's narrative into a structured JSON family tree.

CRITICAL RULES:
1. Do NOT try to solve the genetics.
2. Output ONLY raw JSON. No markdown formatting, no chat.
3. **NORMALIZE PHENOTYPES**: Map user descriptions to specific keywords:
   - "blond", "blonde", "light", "fair" -> "blonde"
   - "black", "dark", "brunette", "brown" -> "black"
   - "red", "ginger" -> "red"
   - Anything else -> "unknown"
4. Assign IDs like 'gen1_m' (generation 1 male) or 'gen2_son'.
5. Infer parent relationships based on roles.

Example JSON format:
{
  "members": [
    {"id": "gen1_m", "relation": "Great-Grandfather", "phenotype": "blonde", "parent_ids": []},
    {"id": "gen2_son", "relation": "Son", "phenotype": "black", "parent_ids": ["gen1_m"]}
  ],
  "target_trait": "hair_color"
}
"""

# Specialized System Prompt for Explanation
EXPLANATION_PROMPT = """
You are the Zygotrix Pedigree Analyst.
You have received a validated scientific analysis from the C++ Computational Engine.

INPUT CONTEXT:
1. User Query
2. Extracted Family Tree
3. Engine Status (SOLVABLE or CONFLICT)

CRITICAL BIOLOGICAL FACTS (YOU MUST OBEY):
1. **Dominant Traits:** Black Hair, Brown Hair, Brown Eyes. (Genotypes: AA or Aa).
2. **Recessive Traits:** Blonde Hair, Red Hair, Blue Eyes, Light Hair. (Genotype: aa).
3. **The "Carrier" Definition:** A **Carrier** is ONLY a person with a **Dominant Phenotype** (e.g., Black Hair) who carries a hidden Recessive gene (Genotype Aa).
   - **CRITICAL:** A person with a Recessive Phenotype (Blonde/Red) is **NEVER** called a Carrier. They are **Homozygous Recessive (aa)**.
4. **Test Cross:** If one parent is Black (Aa) and one is Blonde (aa), children have a ~50% chance of being Black and ~50% chance of being Blonde.

FORMATTING REQUIREMENTS:
- Use **Markdown** to structure your response.
- **Bold** all key terms (e.g., **Heterozygous**, **Dominant**, **Recessive**, **Epistasis**, **Carrier**, **Homozygous**).
- Use clear headings with `###` (e.g., `### Genetic Analysis`, `### Conclusion`).
- Use bullet points for probability breakdowns.

INSTRUCTIONS:
- If Status is CONFLICT: The engine detected a violation (e.g., Blonde x Blonde = Black). Explain this is **Epistasis** (gene masking) or a polygenic interaction.
- If Status is SOLVABLE: Explain the inheritance using the facts above.
- Be concise, professional, and scientifically accurate.
"""

async def process_pedigree_query(request: PedigreeRequest) -> PedigreeResponse:
    claude = get_claude_service()
    
    # --- PHASE 1: EXTRACTION (LLM) ---
    logger.info(f"🧬 Phase 1: Extracting pedigree structure for query: {request.query[:50]}...")
    
    extraction_messages = [
        {"role": "user", "content": f"Extract this family tree: {request.query}"}
    ]
    
    # We force a low temperature for rigid JSON extraction
    raw_structure_text, _ = await claude.generate_response(
        messages=extraction_messages,
        system_prompt=EXTRACTION_PROMPT,
        model="claude-3-haiku-20240307", 
        max_tokens=1024,
        temperature=0.0
    )
    
    try:
        # --- ROBUST JSON EXTRACTION LOGIC ---
        match = re.search(r"```json(.*?)```", raw_structure_text, re.DOTALL)
        if match:
            json_text = match.group(1).strip()
        else:
            start_index = raw_structure_text.find('{')
            end_index = raw_structure_text.rfind('}')
            if start_index != -1 and end_index != -1 and start_index < end_index:
                 json_text = raw_structure_text[start_index:end_index+1]
            else:
                 logger.error(f"Raw LLM Output (Failed extraction): {raw_structure_text}")
                 raise ValueError("Could not locate valid JSON object")

        logger.debug(f"Extracted JSON string: {json_text}")
        structure_dict = json.loads(json_text)
        structure = PedigreeStructure(**structure_dict)
        logger.info("✅ Phase 1 Successful: Structure mapped.")

    except Exception as e:
        logger.error(f"❌ Phase 1 Extraction Failed: {e}")
        return PedigreeResponse(
            ai_message="I had trouble mapping that family tree structure. Could you list the family members and their traits more clearly?",
            requires_clarification=True
        )

    # --- PHASE 2: VALIDATION & CALCULATION (C++ Engine) ---
    logger.info("🧬 Phase 2: Sending to C++ Engine for validation...")
    
    try:
        analysis_result = run_pedigree_analysis(structure)
        logger.info(f"✅ Phase 2 Successful. Engine Status: {analysis_result.status}")
    except Exception as e:
        logger.critical(f"❌ Phase 2 C++ Engine Error: {e}")
        # Fallback if engine is down/error
        return PedigreeResponse(
            ai_message="I've mapped the family tree, but our advanced Genetic Engine is momentarily unavailable to verify the probabilities.",
            structured_data=structure
        )

    # --- PHASE 3: RESPONSE GENERATION (LLM) ---
    logger.info(f"🧬 Phase 3: Generating explanation for status {analysis_result.status}...")
    
    context = f"""
    User Query: "{request.query}"
    Extracted Structure: {structure.model_dump_json()}
    Engine Analysis: {analysis_result.model_dump_json()}
    """
    
    response_messages = [
        {"role": "user", "content": f"Explain this analysis result to the user: {context}"}
    ]
    
    final_explanation, _ = await claude.generate_response(
        messages=response_messages,
        system_prompt=EXPLANATION_PROMPT,
        model="claude-3-haiku-20240307", # Updated model to Haiku as requested
        max_tokens=2048,
        temperature=0.3
    )

    return PedigreeResponse(
        ai_message=final_explanation,
        analysis_result=analysis_result,
        structured_data=structure,
        requires_clarification=(analysis_result.status == "MISSING_DATA")
    )