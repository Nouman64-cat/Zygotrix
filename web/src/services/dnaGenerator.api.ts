import API from "./api";

export interface DnaGenerateRequest {
  length: number;
  gc_content: number;
  seed?: number;
}

export interface DnaGenerateResponse {
  sequence: string;
  length: number;
  gc_content: number;
  actual_gc: number;
}

export async function generateDna(
  payload: DnaGenerateRequest
): Promise<DnaGenerateResponse> {
  const response = await API.post<DnaGenerateResponse>(
    "/api/dna/generate",
    payload
  );
  return response.data;
}
