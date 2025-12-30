# GWAS Integration Guide for Zygotrix AI

**Project**: Zygotrix AI Chatbot
**Feature**: GWAS Analysis Widget Integration
**Date**: 2025-12-30

---

## Table of Contents

1. [Overview](#overview)
2. [Widget Architecture](#widget-architecture)
3. [Backend Integration](#backend-integration)
4. [Frontend Widget Implementation](#frontend-widget-implementation)
5. [MCP Tool Integration](#mcp-tool-integration)
6. [User Interaction Flow](#user-interaction-flow)
7. [Code Examples](#code-examples)
8. [Testing](#testing)

---

## Overview

This guide details how to integrate GWAS (Genome-Wide Association Study) analysis visualization into the Zygotrix AI chatbot. Users will be able to ask the AI to run GWAS analyses and receive interactive visualizations directly in the chat interface.

### Key Features

- **Manhattan Plot**: Genome-wide p-value visualization
- **Q-Q Plot**: P-value distribution quality control
- **Association Table**: Top significant SNPs
- **Interactive**: Click SNPs for details, zoom, pan
- **Download**: Export results as CSV/JSON

### Integration Points

1. **Backend MCP Tool**: `run_gwas_analysis()` - Claude calls this tool
2. **Widget Metadata**: Backend returns structured data for visualization
3. **Frontend Widget**: `GwasWidget.tsx` renders the visualization
4. **Chat Message**: Widget embedded in AI response

---

## Widget Architecture

### Existing Widget Pattern

Zygotrix AI currently supports two widget types:

1. **Breeding Lab Widget** (`widget_type: "breeding_lab"`)
   - Displays Mendelian cross simulations
   - Interactive genotype/phenotype tables

2. **DNA/RNA Widget** (`widget_type: "dna_rna_visualizer"`)
   - Visualizes DNA sequences and mRNA transcription
   - Color-coded nucleotide display

### New GWAS Widget

We'll add a third widget type following the same pattern:

```typescript
widget_type: "gwas_analyzer"
```

**Files to modify**:
- `zygotrix_ai/src/types/chat.types.ts` - Add GWAS types
- `zygotrix_ai/src/components/gwas/GwasWidget.tsx` - New widget component
- `zygotrix_ai/src/components/chat/ChatMessage.tsx` - Render widget
- `backend/app/schema/zygotrix_ai.py` - Add GWAS metadata schema
- `backend/app/chatbot_tools/tools.py` - Add `run_gwas_analysis()` tool

---

## Backend Integration

### Step 1: Add GWAS Metadata Schema

**File**: `backend/app/schema/zygotrix_ai.py`

```python
from typing import List, Optional, Literal
from pydantic import BaseModel, Field

# Add to existing MessageMetadata class
class MessageMetadata(BaseModel):
    # ... existing fields ...

    # Widget types
    widget_type: Optional[Literal[
        "breeding_lab",
        "dna_rna_visualizer",
        "gwas_analyzer"  # NEW
    ]] = None

    # Existing widget data
    breeding_data: Optional[dict] = None
    dna_rna_data: Optional[dict] = None

    # NEW: GWAS widget data
    gwas_data: Optional["GwasWidgetData"] = None


class SnpAssociation(BaseModel):
    """Single SNP association result."""
    rsid: str = Field(..., description="SNP identifier (e.g., rs1234567)")
    chromosome: int = Field(..., ge=1, le=23, description="Chromosome number (1-22, X=23)")
    position: int = Field(..., gt=0, description="Base pair position")
    ref_allele: str = Field(..., description="Reference allele")
    alt_allele: str = Field(..., description="Alternate allele")
    beta: float = Field(..., description="Effect size")
    se: float = Field(..., description="Standard error")
    p_value: float = Field(..., ge=0, le=1, description="Association p-value")
    maf: float = Field(..., ge=0, le=0.5, description="Minor allele frequency")

    # Optional annotations
    nearest_gene: Optional[str] = None
    consequence: Optional[str] = None  # "intronic", "missense", etc.


class ManhattanPlotData(BaseModel):
    """Data for Manhattan plot visualization."""
    chromosomes: List["ChromosomeData"]


class ChromosomeData(BaseModel):
    """Data for a single chromosome in Manhattan plot."""
    chr: int
    positions: List[int]
    p_values: List[float]
    labels: List[str]  # rsids for significant SNPs


class QQPlotData(BaseModel):
    """Data for Q-Q plot visualization."""
    expected: List[float]
    observed: List[float]
    genomic_inflation_lambda: float = Field(..., description="Genomic inflation factor")


class GwasWidgetData(BaseModel):
    """Complete GWAS visualization data."""
    job_id: str
    dataset_name: str
    trait_name: str
    analysis_type: Literal["linear", "logistic", "chi_square"]

    # Summary statistics
    total_snps_tested: int
    significant_snps: int
    significance_threshold: float = 5e-8

    # Top associations (for table)
    top_associations: List[SnpAssociation] = Field(
        ...,
        max_items=100,
        description="Top 100 significant associations"
    )

    # Plot data
    manhattan_plot: ManhattanPlotData
    qq_plot: QQPlotData

    # Metadata
    execution_time_seconds: float
    created_at: str
```

### Step 2: Create MCP Tool for GWAS

**File**: `backend/app/chatbot_tools/tools.py`

Add a new tool function:

```python
def run_gwas_analysis(
    dataset_id: str,
    trait_name: str,
    analysis_type: Literal["linear", "logistic", "chi_square"] = "linear",
    covariates: Optional[List[str]] = None,
    maf_threshold: float = 0.01,
) -> dict:
    """
    Run a genome-wide association study (GWAS) analysis.

    This tool analyzes the association between genetic variants (SNPs) and a
    phenotypic trait across a population. It tests millions of SNPs for
    statistical significance and returns visualization-ready results.

    Args:
        dataset_id: ID of the GWAS dataset to analyze
        trait_name: Name of the trait being analyzed (e.g., "Height", "Type 2 Diabetes")
        analysis_type: Statistical method to use:
            - "linear": For quantitative traits (height, BMI, cholesterol)
            - "logistic": For binary traits (disease yes/no)
            - "chi_square": Fast association test (no covariates)
        covariates: List of covariates to adjust for (e.g., ["age", "sex", "pc1", "pc2"])
        maf_threshold: Minimum minor allele frequency (default 0.01 = 1%)

    Returns:
        Dictionary with analysis results and widget data for visualization

    Example:
        User: "Run a GWAS for height on my European cohort"
        Tool call: run_gwas_analysis(
            dataset_id="dataset_abc123",
            trait_name="Height (cm)",
            analysis_type="linear",
            covariates=["age", "sex", "pc1", "pc2"]
        )
    """
    from ..services.gwas_service import get_gwas_service
    from ..schema.gwas import GwasAnalysisRequest

    # Get user context (from tool execution context)
    user_id = get_current_user_id()  # Implementation depends on MCP context

    # Create analysis request
    request = GwasAnalysisRequest(
        dataset_id=dataset_id,
        analysis_type=analysis_type,
        covariates=covariates or [],
        maf_threshold=maf_threshold,
    )

    # Start GWAS analysis
    gwas_service = get_gwas_service()
    job = gwas_service.start_analysis_sync(user_id, request)  # Synchronous for tool

    # Wait for completion (with timeout)
    result = gwas_service.wait_for_completion(job.job_id, timeout_seconds=300)

    if not result:
        return {
            "success": False,
            "message": f"GWAS analysis timed out. Check job status: {job.job_id}",
        }

    # Prepare widget data
    widget_data = {
        "job_id": job.job_id,
        "dataset_name": result.dataset_name,
        "trait_name": trait_name,
        "analysis_type": analysis_type,
        "total_snps_tested": result.summary["total_snps_tested"],
        "significant_snps": result.summary["significant_snps_bonferroni"],
        "significance_threshold": 5e-8,
        "top_associations": result.top_hits[:100],  # Top 100
        "manhattan_plot": result.manhattan_plot_data,
        "qq_plot": result.qq_plot_data,
        "execution_time_seconds": result.execution_time_seconds,
        "created_at": result.created_at.isoformat(),
    }

    return {
        "success": True,
        "message": f"Analyzed {result.summary['total_snps_tested']:,} SNPs. "
                   f"Found {result.summary['significant_snps_bonferroni']} genome-wide significant associations.",
        # Widget metadata for frontend
        "widget_type": "gwas_analyzer",
        "gwas_data": widget_data,
    }
```

### Step 3: Register Tool with MCP

**File**: `backend/app/mcp/claude_tools.py`

```python
def get_claude_tools_schema() -> List[dict]:
    """Get all tools in Claude's native format."""
    return [
        # ... existing tools ...

        # NEW: GWAS tool
        {
            "name": "run_gwas_analysis",
            "description": (
                "Run a genome-wide association study (GWAS) to identify genetic variants "
                "associated with a phenotypic trait. Returns interactive visualization with "
                "Manhattan plot, Q-Q plot, and top associations. Use this when users ask "
                "about genetic associations, GWAS, or want to analyze genotype-phenotype relationships."
            ),
            "input_schema": {
                "type": "object",
                "properties": {
                    "dataset_id": {
                        "type": "string",
                        "description": "ID of the GWAS dataset to analyze",
                    },
                    "trait_name": {
                        "type": "string",
                        "description": "Name of the trait (e.g., 'Height (cm)', 'Type 2 Diabetes')",
                    },
                    "analysis_type": {
                        "type": "string",
                        "enum": ["linear", "logistic", "chi_square"],
                        "description": (
                            "Statistical method: 'linear' for quantitative traits, "
                            "'logistic' for binary traits, 'chi_square' for fast association"
                        ),
                        "default": "linear",
                    },
                    "covariates": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Covariates to adjust for (e.g., ['age', 'sex', 'pc1'])",
                    },
                    "maf_threshold": {
                        "type": "number",
                        "description": "Minimum minor allele frequency (default 0.01)",
                        "default": 0.01,
                    },
                },
                "required": ["dataset_id", "trait_name"],
            },
        },
    ]
```

### Step 4: Update Chat Service to Handle Widget Data

**File**: `backend/app/services/zygotrix_ai/chat_service.py`

Ensure the chat service properly handles tool results with widget data:

```python
async def _handle_tool_result(self, tool_name: str, tool_result: dict) -> dict:
    """Process tool results and extract widget metadata."""

    # Extract widget data if present
    widget_type = tool_result.get("widget_type")
    widget_data = None

    if widget_type == "gwas_analyzer":
        widget_data = {
            "widget_type": "gwas_analyzer",
            "gwas_data": tool_result.get("gwas_data"),
        }
    elif widget_type == "breeding_lab":
        widget_data = {
            "widget_type": "breeding_lab",
            "breeding_data": tool_result.get("breeding_data"),
        }
    elif widget_type == "dna_rna_visualizer":
        widget_data = {
            "widget_type": "dna_rna_visualizer",
            "dna_rna_data": tool_result.get("dna_rna_data"),
        }

    return widget_data
```

---

## Frontend Widget Implementation

### Step 1: Update TypeScript Types

**File**: `zygotrix_ai/src/types/chat.types.ts`

```typescript
// Add to MessageMetadata interface
export interface MessageMetadata {
  // ... existing fields ...

  // Widget types
  widget_type?: 'breeding_lab' | 'dna_rna_visualizer' | 'gwas_analyzer';  // ADD gwas_analyzer

  // Existing widget data
  breeding_data?: {
    parent1?: any;
    parent2?: any;
    traits?: string[];
    results?: any;
  };
  dna_rna_data?: {
    dna_sequence?: string;
    mrna_sequence?: string;
    operation?: 'generate_dna' | 'transcribe_to_mrna' | 'both';
    metadata?: {
      length?: number;
      gc_content?: number;
      base_counts?: Record<string, number>;
    };
  };

  // NEW: GWAS widget data
  gwas_data?: {
    job_id: string;
    dataset_name: string;
    trait_name: string;
    analysis_type: 'linear' | 'logistic' | 'chi_square';
    total_snps_tested: number;
    significant_snps: number;
    significance_threshold: number;
    top_associations: SnpAssociation[];
    manhattan_plot: ManhattanPlotData;
    qq_plot: QQPlotData;
    execution_time_seconds: number;
    created_at: string;
  };
}

// NEW: GWAS-specific types
export interface SnpAssociation {
  rsid: string;
  chromosome: number;
  position: number;
  ref_allele: string;
  alt_allele: string;
  beta: number;
  se: number;
  p_value: number;
  maf: number;
  nearest_gene?: string;
  consequence?: string;
}

export interface ManhattanPlotData {
  chromosomes: ChromosomeData[];
}

export interface ChromosomeData {
  chr: number;
  positions: number[];
  p_values: number[];
  labels: string[];
}

export interface QQPlotData {
  expected: number[];
  observed: number[];
  genomic_inflation_lambda: number;
}
```

### Step 2: Create GWAS Widget Component

**File**: `zygotrix_ai/src/components/gwas/GwasWidget.tsx`

```typescript
import React, { useState } from 'react';
import { ManhattanPlot } from './ManhattanPlot';
import { QQPlot } from './QQPlot';
import { AssociationTable } from './AssociationTable';
import type { SnpAssociation, ManhattanPlotData, QQPlotData } from '../../types/chat.types';

interface GwasWidgetProps {
  jobId: string;
  datasetName: string;
  traitName: string;
  analysisType: 'linear' | 'logistic' | 'chi_square';
  totalSnpsTested: number;
  significantSnps: number;
  significanceThreshold: number;
  topAssociations: SnpAssociation[];
  manhattanPlot: ManhattanPlotData;
  qqPlot: QQPlotData;
  executionTime: number;
  createdAt: string;
}

export const GwasWidget: React.FC<GwasWidgetProps> = ({
  jobId,
  datasetName,
  traitName,
  analysisType,
  totalSnpsTested,
  significantSnps,
  significanceThreshold,
  topAssociations,
  manhattanPlot,
  qqPlot,
  executionTime,
}) => {
  const [activeTab, setActiveTab] = useState<'manhattan' | 'qq' | 'table'>('manhattan');

  const downloadResults = (format: 'csv' | 'json') => {
    // Implement download logic
    const url = `/api/gwas/results/${jobId}/download?format=${format}`;
    window.open(url, '_blank');
  };

  return (
    <div className="gwas-widget bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-lg p-6 border border-indigo-200 dark:border-gray-700 shadow-lg my-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="text-2xl">🧬</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              GWAS Analysis Results
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Trait:</strong> {traitName} | <strong>Dataset:</strong> {datasetName}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Analysis:</strong> {analysisType} regression | <strong>SNPs tested:</strong> {totalSnpsTested.toLocaleString()}
          </p>
        </div>

        {/* Download Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => downloadResults('csv')}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-md transition-colors"
          >
            Download CSV
          </button>
          <button
            onClick={() => downloadResults('json')}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-md transition-colors"
          >
            Download JSON
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {significantSnps.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Significant SNPs
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">
            p &lt; {significanceThreshold.toExponential(0)}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            λ = {qqPlot.genomic_inflation_lambda.toFixed(3)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Genomic Inflation
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">
            {qqPlot.genomic_inflation_lambda < 1.1 ? 'Good' : 'Check population structure'}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {executionTime.toFixed(1)}s
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Execution Time
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">
            {totalSnpsTested > 100000 ? 'Large-scale analysis' : 'Fast analysis'}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('manhattan')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'manhattan'
              ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          Manhattan Plot
        </button>
        <button
          onClick={() => setActiveTab('qq')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'qq'
              ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          Q-Q Plot
        </button>
        <button
          onClick={() => setActiveTab('table')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'table'
              ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          Top Associations
        </button>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        {activeTab === 'manhattan' && (
          <ManhattanPlot
            data={manhattanPlot}
            significanceThreshold={significanceThreshold}
          />
        )}

        {activeTab === 'qq' && (
          <QQPlot data={qqPlot} />
        )}

        {activeTab === 'table' && (
          <AssociationTable
            associations={topAssociations}
            significanceThreshold={significanceThreshold}
          />
        )}
      </div>
    </div>
  );
};
```

### Step 3: Create Sub-Components

**File**: `zygotrix_ai/src/components/gwas/ManhattanPlot.tsx`

```typescript
import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { ManhattanPlotData } from '../../types/chat.types';

interface ManhattanPlotProps {
  data: ManhattanPlotData;
  significanceThreshold: number;
}

export const ManhattanPlot: React.FC<ManhattanPlotProps> = ({
  data,
  significanceThreshold,
}) => {
  // Transform data for Recharts
  const plotData = data.chromosomes.flatMap((chr) =>
    chr.positions.map((pos, idx) => ({
      chromosome: chr.chr,
      position: pos,
      negLogP: -Math.log10(chr.p_values[idx]),
      rsid: chr.labels[idx],
      p_value: chr.p_values[idx],
    }))
  );

  const thresholdLine = -Math.log10(significanceThreshold);

  // Color by chromosome (alternating)
  const getColor = (chr: number) => {
    return chr % 2 === 0 ? '#4F46E5' : '#7C3AED';  // Indigo / Purple
  };

  return (
    <div>
      <h4 className="text-md font-semibold mb-3 text-gray-700 dark:text-gray-300">
        Manhattan Plot - Genome-Wide Association
      </h4>
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="chromosome"
            name="Chromosome"
            label={{ value: 'Chromosome', position: 'insideBottom', offset: -10 }}
            domain={[1, 22]}
          />
          <YAxis
            dataKey="negLogP"
            name="-log₁₀(p)"
            label={{ value: '-log₁₀(p-value)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            content={({ payload }) => {
              if (!payload || payload.length === 0) return null;
              const data = payload[0].payload;
              return (
                <div className="bg-white dark:bg-gray-800 p-3 border rounded shadow-lg">
                  <p className="font-semibold">{data.rsid || `Chr${data.chromosome}:${data.position}`}</p>
                  <p className="text-sm">p-value: {data.p_value.toExponential(2)}</p>
                  <p className="text-sm">Position: {data.position.toLocaleString()}</p>
                </div>
              );
            }}
          />
          <ReferenceLine
            y={thresholdLine}
            stroke="red"
            strokeDasharray="5 5"
            label={{ value: 'Genome-wide significance', position: 'right' }}
          />
          {data.chromosomes.map((chr) => (
            <Scatter
              key={chr.chr}
              name={`Chr ${chr.chr}`}
              data={plotData.filter((d) => d.chromosome === chr.chr)}
              fill={getColor(chr.chr)}
              opacity={0.6}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
        Each point represents a SNP. Red line indicates genome-wide significance (p &lt; {significanceThreshold.toExponential(0)}).
      </p>
    </div>
  );
};
```

**File**: `zygotrix_ai/src/components/gwas/QQPlot.tsx`

```typescript
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { QQPlotData } from '../../types/chat.types';

interface QQPlotProps {
  data: QQPlotData;
}

export const QQPlot: React.FC<QQPlotProps> = ({ data }) => {
  // Transform data for Recharts
  const plotData = data.expected.map((exp, idx) => ({
    expected: exp,
    observed: data.observed[idx],
  }));

  return (
    <div>
      <h4 className="text-md font-semibold mb-3 text-gray-700 dark:text-gray-300">
        Q-Q Plot - P-Value Distribution
      </h4>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={plotData} margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="expected"
            name="Expected -log₁₀(p)"
            label={{ value: 'Expected -log₁₀(p-value)', position: 'insideBottom', offset: -10 }}
          />
          <YAxis
            dataKey="observed"
            name="Observed -log₁₀(p)"
            label={{ value: 'Observed -log₁₀(p-value)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip />
          <ReferenceLine
            stroke="red"
            strokeDasharray="5 5"
            segment={[
              { x: 0, y: 0 },
              { x: Math.max(...data.expected), y: Math.max(...data.expected) },
            ]}
          />
          <Line type="monotone" dataKey="observed" stroke="#7C3AED" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
        Genomic inflation λ = {data.genomic_inflation_lambda.toFixed(3)}.
        {data.genomic_inflation_lambda < 1.1
          ? ' Good - no evidence of population stratification.'
          : ' Warning - consider adjusting for population structure.'}
      </p>
    </div>
  );
};
```

**File**: `zygotrix_ai/src/components/gwas/AssociationTable.tsx`

```typescript
import React, { useState } from 'react';
import type { SnpAssociation } from '../../types/chat.types';

interface AssociationTableProps {
  associations: SnpAssociation[];
  significanceThreshold: number;
}

export const AssociationTable: React.FC<AssociationTableProps> = ({
  associations,
  significanceThreshold,
}) => {
  const [sortBy, setSortBy] = useState<'p_value' | 'beta'>('p_value');

  const sorted = [...associations].sort((a, b) => {
    if (sortBy === 'p_value') return a.p_value - b.p_value;
    return Math.abs(b.beta) - Math.abs(a.beta);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300">
          Top {associations.length} Associations
        </h4>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'p_value' | 'beta')}
          className="px-3 py-1 border rounded text-sm bg-white dark:bg-gray-700 dark:border-gray-600"
        >
          <option value="p_value">Sort by p-value</option>
          <option value="beta">Sort by effect size</option>
        </select>
      </div>

      <div className="overflow-x-auto max-h-96">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">SNP</th>
              <th className="px-3 py-2 text-left font-semibold">Chr:Pos</th>
              <th className="px-3 py-2 text-left font-semibold">Alleles</th>
              <th className="px-3 py-2 text-right font-semibold">Beta</th>
              <th className="px-3 py-2 text-right font-semibold">P-value</th>
              <th className="px-3 py-2 text-right font-semibold">MAF</th>
              <th className="px-3 py-2 text-left font-semibold">Gene</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((snp, idx) => (
              <tr
                key={snp.rsid + idx}
                className={`border-b dark:border-gray-700 ${
                  snp.p_value < significanceThreshold
                    ? 'bg-yellow-50 dark:bg-yellow-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <td className="px-3 py-2 font-mono text-xs">{snp.rsid}</td>
                <td className="px-3 py-2 text-xs">
                  {snp.chromosome}:{snp.position.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-xs font-mono">
                  {snp.ref_allele}/{snp.alt_allele}
                </td>
                <td className="px-3 py-2 text-right">
                  <span className={snp.beta > 0 ? 'text-green-600' : 'text-red-600'}>
                    {snp.beta.toFixed(3)}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs">
                  {snp.p_value.toExponential(2)}
                </td>
                <td className="px-3 py-2 text-right text-xs">
                  {(snp.maf * 100).toFixed(1)}%
                </td>
                <td className="px-3 py-2 text-xs italic text-gray-600 dark:text-gray-400">
                  {snp.nearest_gene || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

### Step 4: Create Index File

**File**: `zygotrix_ai/src/components/gwas/index.ts`

```typescript
export { GwasWidget } from './GwasWidget';
export { ManhattanPlot } from './ManhattanPlot';
export { QQPlot } from './QQPlot';
export { AssociationTable } from './AssociationTable';
```

### Step 5: Update ChatMessage Component

**File**: `zygotrix_ai/src/components/chat/ChatMessage.tsx`

Add import:
```typescript
import { GwasWidget } from '../gwas';
```

Update the component to check for GWAS widget (around line 156):
```typescript
// Check if message has GWAS widget data
const hasGwasWidget = message.metadata?.widget_type === 'gwas_analyzer' && message.metadata?.gwas_data;
```

Add rendering logic (around line 280, after DNA/RNA widget):
```typescript
{/* Render GWAS widget if present */}
{hasGwasWidget && message.metadata?.gwas_data && (
  <GwasWidget
    jobId={message.metadata.gwas_data.job_id}
    datasetName={message.metadata.gwas_data.dataset_name}
    traitName={message.metadata.gwas_data.trait_name}
    analysisType={message.metadata.gwas_data.analysis_type}
    totalSnpsTested={message.metadata.gwas_data.total_snps_tested}
    significantSnps={message.metadata.gwas_data.significant_snps}
    significanceThreshold={message.metadata.gwas_data.significance_threshold}
    topAssociations={message.metadata.gwas_data.top_associations}
    manhattanPlot={message.metadata.gwas_data.manhattan_plot}
    qqPlot={message.metadata.gwas_data.qq_plot}
    executionTime={message.metadata.gwas_data.execution_time_seconds}
    createdAt={message.metadata.gwas_data.created_at}
  />
)}
```

---

## MCP Tool Integration

### Tool Execution Flow

```
1. User sends message: "Run GWAS for height in my European dataset"

2. Claude AI receives message + available tools

3. Claude decides to call: run_gwas_analysis(
      dataset_id="eur_cohort_001",
      trait_name="Height (cm)",
      analysis_type="linear",
      covariates=["age", "sex", "pc1", "pc2"]
   )

4. MCP executes tool (backend Python function)

5. Backend:
   - Validates dataset access
   - Starts GWAS job
   - Calls C++ engine (zyg_gwas_cli)
   - Waits for completion
   - Parses results
   - Returns widget data

6. Claude receives tool result with widget_type="gwas_analyzer"

7. Claude crafts response:
   "I've analyzed 547,219 SNPs for height in your European cohort.
    Found 23 genome-wide significant associations..."

8. Backend attaches widget data to message metadata

9. Frontend receives message with metadata.gwas_data

10. ChatMessage component detects hasGwasWidget = true

11. GwasWidget renders with interactive visualizations
```

---

## User Interaction Flow

### Example Conversation

```
User: "I have genotype data for 1000 individuals and height measurements.
       Can you help me find genetic variants associated with height?"

Zigi: "I can run a GWAS (Genome-Wide Association Study) for you! First,
       let me check if you have a dataset uploaded..."

       [Calls search_datasets tool]

       "I found your dataset 'European_Height_Study' with 1000 samples and
       543,219 SNPs. I'll run a linear regression GWAS adjusting for age,
       sex, and population structure (PC1-PC4). This will take about 2 minutes."

       [Calls run_gwas_analysis tool]
       [GwasWidget appears showing Manhattan plot, Q-Q plot, and top results]

       "Great! I found 23 genome-wide significant associations (p < 5×10⁻⁸).
        The strongest signal is at rs1234567 on chromosome 6 (p = 3.2×10⁻¹²),
        near the HMGA2 gene, which is a well-known height-associated locus.

        The Q-Q plot looks good (λ = 1.03), suggesting no major population
        stratification issues.

        Would you like me to:
        1. Explore the top hits in more detail?
        2. Run conditional analysis on chromosome 6?
        3. Check for gene set enrichment?"

User: "What's the HMGA2 gene?"

Zigi: [Calls knowledge base / web search]
      "HMGA2 (High Mobility Group AT-Hook 2) is a gene that encodes a protein
       involved in chromatin remodeling and gene expression regulation. It's
       one of the most robustly replicated height-associated loci across
       multiple populations..."
```

---

## Testing

### Unit Tests

**Backend Tool Test** (`backend/tests/test_gwas_tool.py`):
```python
def test_run_gwas_analysis_tool():
    """Test GWAS tool execution."""
    result = run_gwas_analysis(
        dataset_id="test_dataset",
        trait_name="Height",
        analysis_type="linear",
        covariates=["age", "sex"]
    )

    assert result["success"] is True
    assert result["widget_type"] == "gwas_analyzer"
    assert "gwas_data" in result
    assert result["gwas_data"]["total_snps_tested"] > 0
```

**Frontend Widget Test** (`zygotrix_ai/src/components/gwas/__tests__/GwasWidget.test.tsx`):
```typescript
import { render, screen } from '@testing-library/react';
import { GwasWidget } from '../GwasWidget';

test('renders GWAS widget with Manhattan plot', () => {
  const mockData = {
    jobId: 'job123',
    datasetName: 'Test Dataset',
    traitName: 'Height',
    // ... other props
  };

  render(<GwasWidget {...mockData} />);

  expect(screen.getByText('GWAS Analysis Results')).toBeInTheDocument();
  expect(screen.getByText('Manhattan Plot')).toBeInTheDocument();
});
```

### Integration Test

**End-to-End Test**:
1. Upload dataset via API
2. Send chat message: "Run GWAS for height"
3. Verify Claude calls tool correctly
4. Check widget data in response
5. Render widget and verify plots appear

---

## Summary

### Files to Create

**Backend**:
- `backend/app/schema/gwas.py` - Pydantic models (if not in zygotrix_ai.py)
- `backend/app/services/gwas_service.py` - GWAS orchestration
- `backend/app/repositories/gwas_repository.py` - Data access
- `backend/app/routes/gwas.py` - API endpoints

**Frontend**:
- `zygotrix_ai/src/components/gwas/GwasWidget.tsx`
- `zygotrix_ai/src/components/gwas/ManhattanPlot.tsx`
- `zygotrix_ai/src/components/gwas/QQPlot.tsx`
- `zygotrix_ai/src/components/gwas/AssociationTable.tsx`
- `zygotrix_ai/src/components/gwas/index.ts`

### Files to Modify

**Backend**:
- `backend/app/schema/zygotrix_ai.py` - Add GWAS metadata
- `backend/app/chatbot_tools/tools.py` - Add `run_gwas_analysis()` tool
- `backend/app/mcp/claude_tools.py` - Register tool schema
- `backend/app/services/zygotrix_ai/chat_service.py` - Handle widget data

**Frontend**:
- `zygotrix_ai/src/types/chat.types.ts` - Add GWAS types
- `zygotrix_ai/src/components/chat/ChatMessage.tsx` - Render widget

---

**End of Integration Guide**
