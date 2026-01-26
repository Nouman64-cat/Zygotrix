"use client";

import React, { useState, useMemo } from "react";
import { FaDna } from "react-icons/fa";
import { HiArrowRight, HiClipboardCopy, HiDownload, HiSwitchHorizontal } from "react-icons/hi";
import { generateProteinSequence, type ProteinSequenceResponse } from "../../services/proteinGenerator.api";

const MAX_SEQUENCE_LENGTH = 100000; // 100k base pairs limit

const DnaToProteinClient: React.FC = () => {
    const [inputSequence, setInputSequence] = useState("");
    const [copied, setCopied] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{
        dna: string;
        rna: string;
        detectedType: "dna" | "rna";
        proteinResult: ProteinSequenceResponse;
    } | null>(null);

    // Auto-detect whether input is DNA or RNA
    const detectedType = useMemo((): { type: "dna" | "rna" | "unknown" | "invalid"; message: string } => {
        const cleaned = inputSequence.replace(/\s/g, "").toUpperCase();
        if (!cleaned) return { type: "unknown", message: "" };

        const hasT = cleaned.includes("T");
        const hasU = cleaned.includes("U");

        if (hasT && hasU) {
            return { type: "invalid", message: "Invalid: Sequence contains both T and U" };
        }
        if (hasT) {
            return { type: "dna", message: "Detected: DNA sequence (contains T)" };
        }
        if (hasU) {
            return { type: "rna", message: "Detected: RNA sequence (contains U)" };
        }
        // Only A, G, C - assume DNA
        return { type: "dna", message: "Assumed: DNA sequence (no T or U found)" };
    }, [inputSequence]);

    // Validate sequence
    const validateSequence = (sequence: string): { valid: boolean; error?: string } => {
        const cleanSeq = sequence.replace(/\s/g, "").toUpperCase();
        if (cleanSeq.length === 0) {
            return { valid: false, error: "Please enter a DNA or RNA sequence" };
        }
        if (cleanSeq.length > MAX_SEQUENCE_LENGTH) {
            return { valid: false, error: `Sequence too long. Maximum ${MAX_SEQUENCE_LENGTH.toLocaleString()} base pairs allowed.` };
        }

        // Check for invalid characters
        const invalidChars = cleanSeq.replace(/[ATGCU]/g, "");
        if (invalidChars.length > 0) {
            const uniqueInvalid = [...new Set(invalidChars)].join(", ");
            return { valid: false, error: `Invalid characters found: ${uniqueInvalid}. Only A, T, G, C, U allowed.` };
        }

        // Check for both T and U
        if (cleanSeq.includes("T") && cleanSeq.includes("U")) {
            return { valid: false, error: "Invalid sequence: Contains both T (DNA) and U (RNA). Use one type only." };
        }

        return { valid: true };
    };

    // DNA to RNA transcription
    const transcribeDnaToRna = (dna: string): string => {
        return dna.replace(/T/g, "U");
    };

    const handleTranslate = async () => {
        const cleaned = inputSequence.replace(/\s/g, "").toUpperCase();

        const validation = validateSequence(cleaned);
        if (!validation.valid) {
            setError(validation.error || "Invalid sequence");
            return;
        }

        // Determine sequence type and convert to RNA
        const isDna = detectedType.type === "dna";
        const dnaSequence = isDna ? cleaned : cleaned.replace(/U/g, "T");
        const rnaSequence = isDna ? transcribeDnaToRna(cleaned) : cleaned;

        setLoading(true);
        setError(null);

        try {
            const proteinResult = await generateProteinSequence({ rna_sequence: rnaSequence });

            setResult({
                dna: dnaSequence,
                rna: rnaSequence,
                detectedType: isDna ? "dna" : "rna",
                proteinResult,
            });
        } catch (err: unknown) {
            const axiosError = err as { response?: { data?: { detail?: unknown } }; message?: string };
            const detail = axiosError.response?.data?.detail;
            if (typeof detail === "string") {
                setError(detail);
            } else if (Array.isArray(detail) && detail.length > 0) {
                const firstError = detail[0] as { msg?: string };
                setError(firstError?.msg || "Failed to translate sequence");
            } else {
                setError(axiosError.message || "Failed to translate sequence");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleDownload = (content: string, filename: string) => {
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const loadExample = () => {
        setInputSequence("ATGGCCATTGTAATGGGCCGCTGAAAGGGTGCCCGATAG");
        setResult(null);
        setError(null);
    };

    const handleClear = () => {
        setInputSequence("");
        setResult(null);
        setError(null);
    };

    const cleanedLength = inputSequence.replace(/\s/g, "").length;

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950">

            <div className="mx-auto max-w-4xl px-4 py-8">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-1.5 mb-2">
                        <FaDna className="w-4 h-4 text-white" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-white">Free Tool</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                        DNA / RNA to <span className="text-emerald-500 dark:text-emerald-400">Protein Translator</span>
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Paste any DNA or RNA sequence — we'll auto-detect the type
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                    {/* Input Section */}
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                {cleanedLength > 0 && detectedType.type !== "unknown" && (
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${detectedType.type === "dna"
                                        ? "bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400"
                                        : detectedType.type === "rna"
                                            ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"
                                            : "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400"
                                        }`}>
                                        {detectedType.type === "dna" ? "🧬 DNA" : detectedType.type === "rna" ? "🔬 RNA" : "❌ Invalid"}
                                    </span>
                                )}
                                <button
                                    onClick={loadExample}
                                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                                >
                                    Load Example
                                </button>
                            </div>
                            {inputSequence && (
                                <button
                                    onClick={handleClear}
                                    className="text-xs text-slate-500 hover:text-red-500 cursor-pointer"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        <textarea
                            value={inputSequence}
                            onChange={(e) => setInputSequence(e.target.value)}
                            placeholder="Paste your DNA or RNA sequence here (e.g., ATGGCCATTGTAATG... or AUGGCCAUUGUAAUG...)"
                            className="w-full h-28 px-3 py-2 font-mono text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                        />

                        <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-3">
                                <p className="text-xs text-slate-400">
                                    {cleanedLength.toLocaleString()} / {MAX_SEQUENCE_LENGTH.toLocaleString()} bp
                                </p>
                                {cleanedLength > 0 && detectedType.message && detectedType.type !== "invalid" && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {detectedType.message}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={handleTranslate}
                                disabled={loading || !inputSequence.trim() || detectedType.type === "invalid"}
                                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Translating...</span>
                                    </>
                                ) : (
                                    <>
                                        <FaDna className="w-4 h-4" />
                                        <span>Translate</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {error && (
                            <p className="text-sm text-red-500 mt-2">{error}</p>
                        )}
                    </div>

                    {/* Results Section */}
                    {result && (
                        <div className="divide-y divide-slate-200 dark:divide-slate-700">
                            {/* Stats Bar */}
                            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                                <span>Input: <strong>{result.detectedType.toUpperCase()}</strong></span>
                                <span><strong>{result.rna.length.toLocaleString()}</strong> nucleotides</span>
                                <span><strong>{Math.floor(result.rna.length / 3).toLocaleString()}</strong> codons</span>
                                <span><strong>{result.proteinResult.total_orfs.toLocaleString()}</strong> ORFs found</span>
                            </div>

                            {/* Central Dogma Flow */}
                            <div className="p-4 space-y-4">
                                {/* DNA */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wide">
                                            DNA (5' → 3') {result.detectedType === "rna" && <span className="font-normal text-slate-400">(reverse-transcribed)</span>}
                                        </span>
                                        <button onClick={() => handleCopy(result.dna, "dna")} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer">
                                            <HiClipboardCopy className={`w-4 h-4 ${copied === "dna" ? "text-emerald-500" : "text-slate-400"}`} />
                                        </button>
                                    </div>
                                    <div className="font-mono text-sm text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-900/30 px-3 py-2 rounded-lg break-all max-h-24 overflow-y-auto">
                                        {result.dna}
                                    </div>
                                </div>

                                <div className="flex justify-center">
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <HiArrowRight className="w-4 h-4" />
                                        <span>Transcription (T → U)</span>
                                    </div>
                                </div>

                                {/* RNA */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                                            mRNA Sequence {result.detectedType === "rna" && <span className="font-normal text-slate-400">(original input)</span>}
                                        </span>
                                        <button onClick={() => handleCopy(result.rna, "rna")} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer">
                                            <HiClipboardCopy className={`w-4 h-4 ${copied === "rna" ? "text-emerald-500" : "text-slate-400"}`} />
                                        </button>
                                    </div>
                                    <div className="font-mono text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-2 rounded-lg break-all max-h-24 overflow-y-auto">
                                        {result.rna}
                                    </div>
                                </div>

                                <div className="flex justify-center">
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <HiArrowRight className="w-4 h-4" />
                                        <span>Translation (ORF Detection)</span>
                                    </div>
                                </div>

                                {/* ORFs / Protein Results */}
                                {result.proteinResult.orfs.length > 0 ? (
                                    <div className="space-y-3">
                                        {result.proteinResult.orfs.slice(0, 5).map((orf, index) => (
                                            <div key={index} className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                                        ORF {index + 1} (Position {orf.start_position + 1} - {orf.end_position}, {orf.length} aa)
                                                    </span>
                                                    <div className="flex gap-1">
                                                        <button onClick={() => handleCopy(orf.protein_1letter, `orf-${index}`)} className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-800/50 rounded cursor-pointer">
                                                            <HiClipboardCopy className={`w-4 h-4 ${copied === `orf-${index}` ? "text-emerald-500" : "text-emerald-400"}`} />
                                                        </button>
                                                        <button onClick={() => handleDownload(orf.protein_1letter, `orf_${index + 1}_protein.txt`)} className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-800/50 rounded cursor-pointer">
                                                            <HiDownload className="w-4 h-4 text-emerald-400" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="font-mono text-sm text-emerald-700 dark:text-emerald-300 break-all tracking-wider">
                                                    {orf.protein_1letter}
                                                </div>
                                                <div className="font-mono text-xs text-emerald-500 dark:text-emerald-400 mt-1 break-all">
                                                    {orf.protein_3letter}
                                                </div>
                                            </div>
                                        ))}

                                        {result.proteinResult.orfs.length > 5 && (
                                            <p className="text-xs text-slate-500 text-center">
                                                ... and {result.proteinResult.orfs.length - 5} more ORFs
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-slate-500 dark:text-slate-400">
                                        <p className="text-sm">No Open Reading Frames found.</p>
                                        <p className="text-xs mt-1">An ORF requires a start codon (AUG) followed by a stop codon (UAA, UAG, UGA).</p>
                                    </div>
                                )}
                            </div>

                            {/* Summary */}
                            {result.proteinResult.orfs.length > 0 && (
                                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50">
                                    <div className="flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-400">
                                        <span>Type: <strong>{result.proteinResult.protein_type}</strong></span>
                                        <span>Stability Score: <strong>{result.proteinResult.stability_score}</strong></span>
                                        <span>Longest ORF: <strong>{result.proteinResult.protein_length} aa</strong></span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Empty State */}
                    {!result && !loading && (
                        <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                            <FaDna className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>Paste a DNA or RNA sequence and click Translate</p>
                            <p className="text-xs mt-2">We'll automatically detect whether it's DNA (with T) or RNA (with U)</p>
                        </div>
                    )}
                </div>

                {/* Info Card */}
                <div className="mt-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                    <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-2">
                        <HiSwitchHorizontal className="w-4 h-4" />
                        The Central Dogma
                    </h3>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                        <strong>DNA → RNA → Protein</strong>: During transcription, DNA is converted to mRNA (T becomes U).
                        During translation, each 3-nucleotide codon is read by ribosomes and matched to an amino acid.
                        This tool finds all Open Reading Frames (ORFs) - sequences that start with AUG (Methionine) and end with a stop codon (UAA, UAG, UGA).
                    </p>
                </div>

                {/* Marketing CTA */}
                <div className="mt-6 bg-gray-900 rounded-2xl p-6 text-white relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                    <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Pro Features</span>
                            <span className="px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-bold">FREE</span>
                        </div>

                        <h3 className="text-xl font-bold mb-2">
                            Want Detailed Protein Analysis?
                        </h3>

                        <p className="text-sm text-gray-300 mb-4 max-w-lg">
                            Sign up for free to unlock advanced features including amino acid composition charts,
                            hydrophobicity analysis, molecular weight calculations, and sequence export options.
                        </p>

                        <div className="flex flex-wrap gap-3 mb-4">
                            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Amino Acid Composition</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Hydrophobicity Plots</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Sequence Comparison</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Export to FASTA</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <a
                                href="/signup"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <span>Sign Up Free</span>
                                <HiArrowRight className="w-4 h-4" />
                            </a>
                            <a
                                href="/studio/protein-fold-generation"
                                className="text-sm text-emerald-400 hover:text-white underline"
                            >
                                Learn more →
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DnaToProteinClient;
