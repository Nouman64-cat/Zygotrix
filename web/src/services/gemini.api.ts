/**
 * Gemini AI API Service
 * Provides integration with Google's Gemini AI for generating trait information
 */

import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export interface TraitInformation {
  name: string;
  content: string;
}

/**
 * Generate trait information using Gemini AI
 */
export const generateTraitInformation = async (
  traitName: string,
  gene?: string,
  chromosome?: string
): Promise<TraitInformation> => {
  try {
    const prompt = createTraitPrompt(traitName, gene, chromosome);

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
    });

    if (!response.text) {
      throw new Error("No response generated from Gemini API");
    }

    return {
      name: traitName,
      content: response.text,
    };
  } catch (error) {
    console.error("Error generating trait information:", error);
    throw new Error(
      error instanceof Error
        ? `Failed to generate trait information: ${error.message}`
        : "Failed to generate trait information"
    );
  }
};

/**
 * Create a simple prompt for trait information generation
 */
function createTraitPrompt(
  traitName: string,
  gene?: string,
  chromosome?: string
): string {
  const geneInfo = gene ? ` associated with the ${gene} gene` : "";
  const chromosomeInfo = chromosome
    ? ` located on chromosome ${chromosome}`
    : "";

  return `Please provide information about the genetic trait "${traitName}"${geneInfo}${chromosomeInfo}. 

Keep your response under 500 words. Include key information about:
- What the trait is
- Basic genetics and inheritance
- Prevalence if known
- Clinical significance

Be accurate, scientific, and educational. Focus on factual information.`;
}

/**
 * Validate API key format
 */
export const validateGeminiApiKey = (apiKey: string): boolean => {
  return /^AIza[0-9A-Za-z_-]{35}$/.test(apiKey);
};

/**
 * Check if Gemini API is available
 */
export const checkGeminiApiHealth = async (): Promise<boolean> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: "Test",
    });

    return !!response.text;
  } catch {
    return false;
  }
};
