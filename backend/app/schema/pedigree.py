from __future__ import annotations
from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field

class PedigreeMember(BaseModel):
    id: str = Field(..., description="Unique identifier like 'gen1_m'")
    relation: str = Field(..., description="Role in family, e.g., 'Great-Grandfather'")
    phenotype: str = Field(..., description="Observed trait, e.g., 'Blonde'")
    parent_ids: List[str] = Field(default_factory=list, description="IDs of parents if known")

class PedigreeRequest(BaseModel):
    query: str = Field(..., description="The user's natural language query")
    conversation_history: List[Dict[str, str]] = Field(default_factory=list)

class PedigreeStructure(BaseModel):
    """The structured extraction payload sent to C++"""
    members: List[PedigreeMember]
    target_trait: str = Field(default="hair_color", description="The trait being analyzed")

class GeneticAnalysisResult(BaseModel):
    """The scientific result from the C++ Engine"""
    status: Literal["SOLVABLE", "CONFLICT", "MISSING_DATA", "UNKNOWN"]
    mode_used: Literal["MENDELIAN", "EPISTATIC", "POLYGENIC", "UNKNOWN"]
    probability_map: Dict[str, Any] = Field(default_factory=dict) 
    conflict_reason: Optional[str] = None
    visualization_grid: Optional[Dict[str, Any]] = None 

class PedigreeResponse(BaseModel):
    """Final response to the frontend"""
    ai_message: str
    analysis_result: Optional[GeneticAnalysisResult] = None
    structured_data: Optional[PedigreeStructure] = None
    requires_clarification: bool = False