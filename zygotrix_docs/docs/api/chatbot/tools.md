---
sidebar_position: 3
---

# Available Tools

Tools available to the AI chatbot.

## Trait Tools

| Tool | Description |
|------|-------------|
| `get_traits_count` | Count traits in database |
| `search_traits` | Search traits by keyword |
| `get_trait_details` | Get full trait info |
| `list_traits_by_type` | Filter by type |
| `list_traits_by_inheritance` | Filter by pattern |

## Genetics Tools

| Tool | Description |
|------|-------------|
| `calculate_punnett_square` | Calculate genetic cross |
| `parse_cross_from_message` | Extract cross from text |
| `create_breeding_simulation` | Multi-gen simulation |

## DNA/RNA Tools

| Tool | Description |
|------|-------------|
| `generate_random_dna_sequence` | Generate DNA |
| `transcribe_dna_to_mrna` | DNA → mRNA |
| `extract_codons_from_rna` | Split into codons |
| `translate_rna_to_protein` | RNA → Protein |

## GWAS Tools

| Tool | Description |
|------|-------------|
| `upload_gwas_dataset` | Upload VCF/PLINK |
| `list_gwas_datasets` | List datasets |
| `run_gwas_analysis` | Start analysis |
| `get_gwas_results` | Get results |
| `get_gwas_job_status` | Check status |
| `list_gwas_jobs` | List jobs |

## Tool Execution

When the chatbot uses a tool, you'll see:

```json
{
  "response": "The offspring ratios are...",
  "tools_used": [
    {
      "name": "calculate_punnett_square",
      "input": {"parent1": "Aa", "parent2": "Aa"},
      "result": {"offspring": [...]}
    }
  ]
}
```
