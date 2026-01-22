// Claude API Pricing (updated 2025) - per million tokens
export const MODEL_PRICING: Record<
    string,
    { input: number; output: number; name: string }
> = {
    "claude-3-haiku-20240307": {
        input: 0.25,
        output: 1.25,
        name: "Claude 3 Haiku",
    },
    "claude-3-sonnet-20240229": {
        input: 3,
        output: 15,
        name: "Claude 3 Sonnet",
    },
    "claude-3-opus-20240229": { input: 15, output: 75, name: "Claude 3 Opus" },
    "claude-3-5-sonnet-20241022": {
        input: 3,
        output: 15,
        name: "Claude 3.5 Sonnet",
    },
    "claude-3-5-haiku-20241022": {
        input: 0.8,
        output: 4,
        name: "Claude 3.5 Haiku",
    },
    "claude-sonnet-4-5-20250514": {
        input: 3,
        output: 15,
        name: "Claude Sonnet 4.5",
    },
    "claude-opus-4-5-20251101": {
        input: 5,
        output: 25,
        name: "Claude Opus 4.5",
    },
    "claude-haiku-4-5-20250514": {
        input: 1,
        output: 5,
        name: "Claude Haiku 4.5",
    },
};
