import API from "./api";

export interface ProteinGenerateRequest {
  length: number;
  gc_content: number;
  seed?: number;
}

export interface ProteinGenerateResponse {
  dna_sequence: string;
  rna_sequence: string;
  length: number;
  gc_content: number;
  actual_gc: number;
}

export interface AminoAcidExtractRequest {
  rna_sequence: string;
}

export interface AminoAcidExtractResponse {
  amino_acids: string;
}

export interface ProteinSequenceRequest {
  rna_sequence: string;
}

export interface ProteinSequenceResponse {
  protein_3letter: string;
  protein_1letter: string;
  protein_length: number;
  protein_type: string;
  stability_score: number;
}

export async function generateDnaAndRna(
  payload: ProteinGenerateRequest
): Promise<ProteinGenerateResponse> {
  const response = await API.post<ProteinGenerateResponse>(
    "/api/protein/generate",
    payload
  );
  return response.data;
}

export async function extractAminoAcids(
  payload: AminoAcidExtractRequest
): Promise<AminoAcidExtractResponse> {
  const response = await API.post<AminoAcidExtractResponse>(
    "/api/protein/extract-amino-acids",
    payload
  );
  return response.data;
}

export async function generateProteinSequence(
  payload: ProteinSequenceRequest
): Promise<ProteinSequenceResponse> {
  const response = await API.post<ProteinSequenceResponse>(
    "/api/protein/generate-protein",
    payload
  );
  return response.data;
}
