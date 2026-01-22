import { MODEL_PRICING } from "./constants";

export const getModelInfo = (modelId: string) => {
    return MODEL_PRICING[modelId] || MODEL_PRICING["claude-3-haiku-20240307"];
};

export const estimateCost = (
    inputTokens: number,
    outputTokens: number,
    model: string = "claude-3-haiku-20240307",
): string => {
    const pricing = getModelInfo(model);
    const inputCost = (inputTokens / 1000000) * pricing.input;
    const outputCost = (outputTokens / 1000000) * pricing.output;
    return (inputCost + outputCost).toFixed(4);
};
