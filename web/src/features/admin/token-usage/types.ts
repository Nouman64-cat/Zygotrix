export interface TokenUsageUser {
    user_id: string;
    user_name: string;
    total_tokens: number;
    input_tokens: number;
    output_tokens: number;
    cache_creation_tokens: number;
    cache_read_tokens: number;
    request_count: number;
    cached_count: number;
    cache_hit_rate: string;
    cache_savings: number;
    last_request: string | null;
}

export interface TokenUsageStats {
    total_tokens: number;
    total_input_tokens: number;
    total_output_tokens: number;
    total_cache_creation_tokens: number;
    total_cache_read_tokens: number;
    total_requests: number;
    cached_requests: number;
    cache_hit_rate: string;
    prompt_cache_hit_rate: string;
    total_cache_savings: number;
    user_count: number;
    users: TokenUsageUser[];
    error?: string;
}

// Re-export service types for convenience if needed,
// or components can import directly from services.
// For now validation of local types is enough.
