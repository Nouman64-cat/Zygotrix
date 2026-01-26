import API from "./api";
import { API_ROUTES } from "./apiConstants";

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

export interface ORFData {
    start_position: number;
    end_position: number;
    protein_3letter: string;
    protein_1letter: string;
    length: number;
}

export interface ProteinSequenceResponse {
    protein_3letter: string;
    protein_1letter: string;
    protein_length: number;
    protein_type: string;
    stability_score: number;
    orfs: ORFData[];
    total_orfs: number;
}

// Queue-related types
export type JobStatus = "queued" | "processing" | "completed" | "failed";

export interface QueuedJobInfo {
    job_id: string;
    sequence_length: number;
    created_at?: string;
}

export interface QueueStatusResponse {
    queue_enabled: boolean;
    active_jobs: number;
    queue_length: number;
    estimated_wait_seconds: number;
    queued_jobs: QueuedJobInfo[];
    processing_jobs: QueuedJobInfo[];
}

export interface JobStatusResponse {
    job_id: string;
    status: JobStatus;
    queue_position?: number;
    estimated_wait_seconds?: number;
    result?: ProteinGenerateResponse;
    error?: string;
    created_at?: string;
    started_at?: string;
    completed_at?: string;
}

export interface GenerateResponse {
    queued: boolean;
    job_id?: string;
    queue_position?: number;
    estimated_wait_seconds?: number;
    result?: ProteinGenerateResponse;
}

export interface JobHistoryItem {
    job_id: string;
    status: JobStatus;
    sequence_length: number;
    created_at?: string;
    started_at?: string;
    completed_at?: string;
    duration_seconds?: number;
    error?: string;
}

export interface JobHistoryResponse {
    jobs: JobHistoryItem[];
    total_jobs: number;
    completed_jobs: number;
    failed_jobs: number;
    queued_jobs: number;
    processing_jobs: number;
    avg_duration_seconds?: number;
    total_bp_processed: number;
}

// Large sequence threshold (must match backend)
export const LARGE_SEQUENCE_THRESHOLD = 10_000_000;

/**
 * Get current queue status
 */
export async function getQueueStatus(): Promise<QueueStatusResponse> {
    const response = await API.get<QueueStatusResponse>(
        API_ROUTES.protein.queueStatus
    );
    return response.data;
}

/**
 * Get job status by ID
 */
export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
    const response = await API.get<JobStatusResponse>(
        API_ROUTES.protein.job(jobId)
    );
    return response.data;
}

/**
 * Poll for job completion with configurable interval
 */
export async function pollJobUntilComplete(
    jobId: string,
    onStatusUpdate?: (status: JobStatusResponse) => void,
    pollIntervalMs: number = 3000,
    maxAttempts: number = 200 // ~10 minutes max
): Promise<JobStatusResponse> {
    let attempts = 0;

    while (attempts < maxAttempts) {
        const status = await getJobStatus(jobId);

        if (onStatusUpdate) {
            onStatusUpdate(status);
        }

        if (status.status === "completed" || status.status === "failed") {
            return status;
        }

        attempts++;
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error("Job polling timed out");
}

/**
 * Generate DNA and RNA sequences
 *
 * For large sequences (>= 10M bp), this may return a queued response.
 * Use pollJobUntilComplete() to wait for the result.
 */
export async function generateDnaAndRna(
    payload: ProteinGenerateRequest
): Promise<ProteinGenerateResponse> {
    const response = await API.post<GenerateResponse>(
        API_ROUTES.protein.generate,
        payload
    );

    const data = response.data;

    // If not queued, return result directly
    if (!data.queued && data.result) {
        return data.result;
    }

    // If queued, poll for completion
    if (data.queued && data.job_id) {
        const finalStatus = await pollJobUntilComplete(data.job_id);

        if (finalStatus.status === "failed") {
            throw new Error(finalStatus.error || "Job failed");
        }

        if (finalStatus.result) {
            return finalStatus.result;
        }

        throw new Error("Job completed but no result returned");
    }

    throw new Error("Unexpected response format");
}

/**
 * Generate DNA and RNA with queue status callbacks
 *
 * This version provides callbacks for queue status updates,
 * useful for showing queue position in the UI.
 */
export async function generateDnaAndRnaWithQueueStatus(
    payload: ProteinGenerateRequest,
    callbacks: {
        onQueued?: (
            jobId: string,
            position: number,
            estimatedWaitSeconds: number
        ) => void;
        onProcessing?: () => void;
        onStatusUpdate?: (status: JobStatusResponse) => void;
    }
): Promise<ProteinGenerateResponse> {
    const response = await API.post<GenerateResponse>(
        API_ROUTES.protein.generate,
        payload
    );

    const data = response.data;

    // If not queued, return result directly
    if (!data.queued && data.result) {
        return data.result;
    }

    // If queued, notify and poll
    if (data.queued && data.job_id) {
        if (callbacks.onQueued) {
            callbacks.onQueued(
                data.job_id,
                data.queue_position || 1,
                data.estimated_wait_seconds || 360
            );
        }

        const finalStatus = await pollJobUntilComplete(data.job_id, (status) => {
            if (status.status === "processing" && callbacks.onProcessing) {
                callbacks.onProcessing();
            }
            if (callbacks.onStatusUpdate) {
                callbacks.onStatusUpdate(status);
            }
        });

        if (finalStatus.status === "failed") {
            throw new Error(finalStatus.error || "Job failed");
        }

        if (finalStatus.result) {
            return finalStatus.result;
        }

        throw new Error("Job completed but no result returned");
    }

    throw new Error("Unexpected response format");
}

export async function extractAminoAcids(
    payload: AminoAcidExtractRequest
): Promise<AminoAcidExtractResponse> {
    const response = await API.post<AminoAcidExtractResponse>(
        API_ROUTES.protein.extractAminoAcids,
        payload
    );
    return response.data;
}

export async function generateProteinSequence(
    payload: ProteinSequenceRequest
): Promise<ProteinSequenceResponse> {
    const response = await API.post<ProteinSequenceResponse>(
        API_ROUTES.protein.generateProtein,
        payload
    );
    return response.data;
}

/**
 * Get job history for admin monitoring
 */
export async function getJobHistory(
    limit: number = 50
): Promise<JobHistoryResponse> {
    const response = await API.get<JobHistoryResponse>(
        `${API_ROUTES.protein.jobHistory}?limit=${limit}`
    );
    return response.data;
}
