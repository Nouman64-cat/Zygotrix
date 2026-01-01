---
sidebar_position: 1
---

# AI Chatbot (Zygotrix AI)

Zygotrix AI is your intelligent genetics assistant, powered by Claude AI with specialized genetics tools.

## What Can Zygotrix AI Do?

### 1. Solve Genetics Problems

Ask Zygotrix AI to calculate Punnett squares:
> "What is the result of crossing Aa × Aa?"

> **Zygotrix AI:** When crossing Aa × Aa, the offspring genotypes are:
> - **AA (25%)** - Homozygous dominant
> - **Aa (50%)** - Heterozygous  
> - **aa (25%)** - Homozygous recessive
>
> This gives a **3:1 phenotype ratio** (dominant:recessive).

### 🔍 Trait Search

Search the genetics database:

> **You:** Tell me about eye color inheritance
>
> **Zygotrix AI:** Eye color is determined by multiple genes, but simplified to single-gene inheritance...

### 2. Generate DNA Sequences

Need a sample sequence?

> "Generate a random 500bp DNA sequence"

> **Zygotrix AI:** Here's a random 500bp DNA sequence: ATGC... 
> Transcribed to mRNA: AUGC...

### 📊 GWAS Analysis

Upload and analyze genetic data:

> **You:** [Uploads file.vcf] Analyze this VCF file
>
> **Zygotrix AI:** I've processed your VCF file with 10,000 SNPs and 200 samples. Running linear regression analysis... Here are the top significant associations...

## How to Interact

Navigate to the Zygotrix AI interface at your frontend URL.

### 2. Ask a Question

Type your genetics question naturally. Zygotrix AI understands:
- Genetics terminology
- Casual questions
- Complex multi-part requests

### 3. View Tool Usage

When Zygotrix AI uses tools, you'll see:
- Which tools were called
- The results returned
- How they informed the response

## Tips for Best Results

### Be Specific

❌ "Calculate something"
✅ "Calculate the offspring of Bb × Bb for coat color"

### Use Standard Notation

❌ "brown and blue eyes"
✅ "Bb × bb for eye color"

### Ask Follow-up Questions

Zygotrix AI remembers your conversation context:
> "What if both parents were Bb?"
> "Show me a more complex example"

## User Preferences

Zygotrix AI adapts to your preferences:

### Communication Style
- **Technical** - Scientific terminology
- **Simple** - Easy-to-understand explanations
- **Conversational** - Friendly, casual tone

### Response Length
- **Brief** - Quick answers
- **Detailed** - Thorough explanations
- **Comprehensive** - Maximum detail

### Auto-Learning

Zygotrix AI learns your preferences from your messages:
- "Explain simply" → Sets simple style
- "Tell me more" → Sets detailed length

## Available Tools

| Tool | What It Does |
|------|--------------|
| **Search Traits** | Find traits by keyword |
| **Punnett Square** | Calculate genetic crosses |
| **DNA Generator** | Create random sequences |
| **Transcription** | DNA → mRNA conversion |
| **Translation** | mRNA → Protein conversion |
| **GWAS Analysis** | Statistical genetics analysis |

## Rate Limits

| User Type | Token Limit | Reset |
|-----------|-------------|-------|
| Free User | 50,000/session | Daily |
| Admin | Unlimited | - |

## Troubleshooting

### "I don't understand that trait"

Try using standard genetics notation:
- Use single letters (A, B, a, b)
- Separate alleles clearly (Aa, not AA)

### "Tool execution failed"

The tool encountered an error. Try:
- Rephrasing your question
- Being more specific
- Checking your input format

### Slow responses

Complex calculations take time:
- GWAS analysis: 30s-5min
- Simple Punnett: under 1s
- DNA generation: 1-5s

