import React, { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import {
  generateDnaAndRna,
  extractAminoAcids,
  generateProteinSequence,
  type ProteinGenerateResponse,
  type AminoAcidExtractResponse,
  type ProteinSequenceResponse,
} from "../services/proteinGenerator.api";
import useDocumentTitle from "../hooks/useDocumentTitle";

// Codon to amino acid lookup table
const CODON_TABLE: Record<string, { name: string; symbol: string; fullName: string }> = {
  "UUU": { name: "Phe", symbol: "F", fullName: "Phenylalanine" },
  "UUC": { name: "Phe", symbol: "F", fullName: "Phenylalanine" },
  "UUA": { name: "Leu", symbol: "L", fullName: "Leucine" },
  "UUG": { name: "Leu", symbol: "L", fullName: "Leucine" },
  "CUU": { name: "Leu", symbol: "L", fullName: "Leucine" },
  "CUC": { name: "Leu", symbol: "L", fullName: "Leucine" },
  "CUA": { name: "Leu", symbol: "L", fullName: "Leucine" },
  "CUG": { name: "Leu", symbol: "L", fullName: "Leucine" },
  "AUU": { name: "Ile", symbol: "I", fullName: "Isoleucine" },
  "AUC": { name: "Ile", symbol: "I", fullName: "Isoleucine" },
  "AUA": { name: "Ile", symbol: "I", fullName: "Isoleucine" },
  "AUG": { name: "Met", symbol: "M", fullName: "Methionine (Start)" },
  "GUU": { name: "Val", symbol: "V", fullName: "Valine" },
  "GUC": { name: "Val", symbol: "V", fullName: "Valine" },
  "GUA": { name: "Val", symbol: "V", fullName: "Valine" },
  "GUG": { name: "Val", symbol: "V", fullName: "Valine" },
  "UCU": { name: "Ser", symbol: "S", fullName: "Serine" },
  "UCC": { name: "Ser", symbol: "S", fullName: "Serine" },
  "UCA": { name: "Ser", symbol: "S", fullName: "Serine" },
  "UCG": { name: "Ser", symbol: "S", fullName: "Serine" },
  "CCU": { name: "Pro", symbol: "P", fullName: "Proline" },
  "CCC": { name: "Pro", symbol: "P", fullName: "Proline" },
  "CCA": { name: "Pro", symbol: "P", fullName: "Proline" },
  "CCG": { name: "Pro", symbol: "P", fullName: "Proline" },
  "ACU": { name: "Thr", symbol: "T", fullName: "Threonine" },
  "ACC": { name: "Thr", symbol: "T", fullName: "Threonine" },
  "ACA": { name: "Thr", symbol: "T", fullName: "Threonine" },
  "ACG": { name: "Thr", symbol: "T", fullName: "Threonine" },
  "GCU": { name: "Ala", symbol: "A", fullName: "Alanine" },
  "GCC": { name: "Ala", symbol: "A", fullName: "Alanine" },
  "GCA": { name: "Ala", symbol: "A", fullName: "Alanine" },
  "GCG": { name: "Ala", symbol: "A", fullName: "Alanine" },
  "UAU": { name: "Tyr", symbol: "Y", fullName: "Tyrosine" },
  "UAC": { name: "Tyr", symbol: "Y", fullName: "Tyrosine" },
  "UAA": { name: "STOP", symbol: "*", fullName: "Stop Codon (Ochre)" },
  "UAG": { name: "STOP", symbol: "*", fullName: "Stop Codon (Amber)" },
  "CAU": { name: "His", symbol: "H", fullName: "Histidine" },
  "CAC": { name: "His", symbol: "H", fullName: "Histidine" },
  "CAA": { name: "Gln", symbol: "Q", fullName: "Glutamine" },
  "CAG": { name: "Gln", symbol: "Q", fullName: "Glutamine" },
  "AAU": { name: "Asn", symbol: "N", fullName: "Asparagine" },
  "AAC": { name: "Asn", symbol: "N", fullName: "Asparagine" },
  "AAA": { name: "Lys", symbol: "K", fullName: "Lysine" },
  "AAG": { name: "Lys", symbol: "K", fullName: "Lysine" },
  "GAU": { name: "Asp", symbol: "D", fullName: "Aspartic Acid" },
  "GAC": { name: "Asp", symbol: "D", fullName: "Aspartic Acid" },
  "GAA": { name: "Glu", symbol: "E", fullName: "Glutamic Acid" },
  "GAG": { name: "Glu", symbol: "E", fullName: "Glutamic Acid" },
  "UGU": { name: "Cys", symbol: "C", fullName: "Cysteine" },
  "UGC": { name: "Cys", symbol: "C", fullName: "Cysteine" },
  "UGA": { name: "STOP", symbol: "*", fullName: "Stop Codon (Opal)" },
  "UGG": { name: "Trp", symbol: "W", fullName: "Tryptophan" },
  "CGU": { name: "Arg", symbol: "R", fullName: "Arginine" },
  "CGC": { name: "Arg", symbol: "R", fullName: "Arginine" },
  "CGA": { name: "Arg", symbol: "R", fullName: "Arginine" },
  "CGG": { name: "Arg", symbol: "R", fullName: "Arginine" },
  "AGU": { name: "Ser", symbol: "S", fullName: "Serine" },
  "AGC": { name: "Ser", symbol: "S", fullName: "Serine" },
  "AGA": { name: "Arg", symbol: "R", fullName: "Arginine" },
  "AGG": { name: "Arg", symbol: "R", fullName: "Arginine" },
  "GGU": { name: "Gly", symbol: "G", fullName: "Glycine" },
  "GGC": { name: "Gly", symbol: "G", fullName: "Glycine" },
  "GGA": { name: "Gly", symbol: "G", fullName: "Glycine" },
  "GGG": { name: "Gly", symbol: "G", fullName: "Glycine" },
};

// Type for hovered codon info
interface HoveredCodonInfo {
  codon: string;
  symbol: string;
  name: string;
  fullName: string;
}

// Component to render RNA sequence with highlighted codons
const CodonHighlightedSequence: React.FC<{
  sequence: string;
  showHighlights: boolean;
  onHover?: (info: HoveredCodonInfo | null) => void;
}> = ({ sequence, showHighlights, onHover }) => {
  const codons: React.ReactNode[] = [];

  for (let i = 0; i < sequence.length; i += 3) {
    const codon = sequence.substring(i, i + 3);
    const aminoAcid = CODON_TABLE[codon.toUpperCase()];
    const codonIndex = Math.floor(i / 3);
    const isEven = codonIndex % 2 === 0;

    if (showHighlights && aminoAcid) {
      codons.push(
        <span
          key={i}
          className={`cursor-pointer px-1 py-0.5 rounded inline-block font-medium ${aminoAcid.name === "STOP"
            ? "bg-red-600 text-white hover:bg-red-500"
            : isEven
              ? "bg-purple-600 text-white hover:bg-purple-500"
              : "bg-cyan-600 text-white hover:bg-cyan-500"
            } transition-colors shadow-sm`}
          onMouseEnter={() => onHover?.({
            codon,
            symbol: aminoAcid.symbol,
            name: aminoAcid.name,
            fullName: aminoAcid.fullName
          })}
          onMouseLeave={() => onHover?.(null)}
        >
          {codon}
        </span>
      );
    } else {
      codons.push(<span key={i} className="inline-block text-green-700 dark:text-green-400 font-medium">{codon}</span>);
    }
  }

  return <div className="flex flex-wrap gap-1">{codons}</div>;
};

const ProteinFoldGenerationPage: React.FC = () => {
  useDocumentTitle("Protein Fold Generation");

  const [length, setLength] = useState<number>(99);
  const [gcContent, setGcContent] = useState<number>(0.5);
  const [seed, setSeed] = useState<string>("");
  const [useRandomSeed, setUseRandomSeed] = useState<boolean>(true);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [dnaRnaResult, setDnaRnaResult] = useState<ProteinGenerateResponse | null>(null);
  const [aminoAcidsResult, setAminoAcidsResult] = useState<AminoAcidExtractResponse | null>(null);
  const [proteinResult, setProteinResult] = useState<ProteinSequenceResponse | null>(null);

  const [transcribing, setTranscribing] = useState<boolean>(false);
  const [extractingAminoAcids, setExtractingAminoAcids] = useState<boolean>(false);
  const [generatingProtein, setGeneratingProtein] = useState<boolean>(false);
  const [hoveredCodon, setHoveredCodon] = useState<HoveredCodonInfo | null>(null);

  const handleGenerate = async () => {
    setError(null);
    setLoading(true);
    setDnaRnaResult(null);
    setAminoAcidsResult(null);
    setProteinResult(null);
    setTranscribing(false);

    try {
      const payload = {
        length,
        gc_content: gcContent,
        ...(useRandomSeed ? {} : { seed: parseInt(seed) || undefined }),
      };

      setTranscribing(true);
      const response = await generateDnaAndRna(payload);
      setDnaRnaResult(response);

      setTimeout(() => setTranscribing(false), 1000);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to generate DNA/RNA sequences");
      setTranscribing(false);
    } finally {
      setLoading(false);
    }
  };

  const handleExtractAminoAcids = async () => {
    if (!dnaRnaResult) return;

    setError(null);
    setExtractingAminoAcids(true);

    try {
      const response = await extractAminoAcids({ rna_sequence: dnaRnaResult.rna_sequence });
      setAminoAcidsResult(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to extract amino acids");
    } finally {
      setExtractingAminoAcids(false);
    }
  };

  const handleGenerateProtein = async () => {
    if (!dnaRnaResult) return;

    setError(null);
    setGeneratingProtein(true);

    try {
      const response = await generateProteinSequence({ rna_sequence: dnaRnaResult.rna_sequence });
      setProteinResult(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to generate protein sequence");
    } finally {
      setGeneratingProtein(false);
    }
  };

  const formatSequence = (sequence: string, lineLength: number = 80) => {
    const lines = [];
    for (let i = 0; i < sequence.length; i += lineLength) {
      lines.push(sequence.substring(i, i + lineLength));
    }
    return lines.join("\n");
  };

  const handleCopySequence = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleReset = () => {
    setDnaRnaResult(null);
    setAminoAcidsResult(null);
    setProteinResult(null);
    setError(null);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-8xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Protein Fold Generation
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Generate random DNA sequences, transcribe to RNA, extract amino acids, and synthesize protein sequences
          </p>
        </div>

        {/* Two Column Layout: Generate DNA (Left) & DNA/RNA Sequences (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left Column: DNA Generation + Amino Acids */}
          <div className="flex flex-col gap-6">
            {/* Step 1 - DNA Generation Parameters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 border border-transparent dark:border-gray-700">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold mr-3">
                  1
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Generate DNA Sequence
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sequence Length (bp) - must be divisible by 3
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="1000000"
                    step="3"
                    value={length}
                    onChange={(e) => setLength(parseInt(e.target.value) || 3)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={loading || !!dnaRnaResult}
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Range: 3 - 1,000,000 base pairs (for complete codons)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    GC Content: {(gcContent * 100).toFixed(1)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={gcContent}
                    onChange={(e) => setGcContent(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    disabled={loading || !!dnaRnaResult}
                  />
                  <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <span>0% (AT-rich)</span>
                    <span>50% (Balanced)</span>
                    <span>100% (GC-rich)</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id="useRandomSeed"
                      checked={useRandomSeed}
                      onChange={(e) => setUseRandomSeed(e.target.checked)}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                      disabled={loading || !!dnaRnaResult}
                    />
                    <label htmlFor="useRandomSeed" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Use random seed
                    </label>
                  </div>
                  {!useRandomSeed && (
                    <input
                      type="number"
                      value={seed}
                      onChange={(e) => setSeed(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter seed for reproducible results"
                      disabled={loading || !!dnaRnaResult}
                    />
                  )}
                </div>

                {!dnaRnaResult ? (
                  <button
                    onClick={handleGenerate}
                    disabled={loading || length < 3 || gcContent < 0 || gcContent > 1}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    {loading ? "Generating..." : "Generate DNA & Transcribe to RNA"}
                  </button>
                ) : (
                  <button
                    onClick={handleReset}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Reset & Start Over
                  </button>
                )}
              </div>
            </div>

            {/* Amino Acids Section - Below Generate DNA */}
            {aminoAcidsResult && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 border border-transparent dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold mr-3">
                      ✓
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Amino Acids Extracted
                    </h2>
                  </div>
                  <button
                    onClick={() => handleCopySequence(aminoAcidsResult.amino_acids)}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm"
                  >
                    Copy
                  </button>
                </div>

                <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 overflow-y-auto border border-gray-300 dark:border-gray-800 mb-4 max-h-48">
                  <pre className="text-xs text-yellow-600 dark:text-yellow-400 font-mono leading-relaxed whitespace-pre-wrap break-all">
                    {aminoAcidsResult.amino_acids}
                  </pre>
                </div>

                {/* Generate Protein Button */}
                {!proteinResult && (
                  <button
                    onClick={handleGenerateProtein}
                    disabled={generatingProtein}
                    className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    {generatingProtein ? "Generating..." : "Generate Protein Sequence"}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Step 2 - DNA & RNA Sequences */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 border border-transparent dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full ${dnaRnaResult && !transcribing ? 'bg-green-600' : 'bg-gray-400 dark:bg-gray-600'} text-white flex items-center justify-center font-bold mr-3`}>
                  {dnaRnaResult && !transcribing ? '✓' : '2'}
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  DNA & RNA Sequences
                </h2>
              </div>
            </div>

            {/* Transcription Indicator */}
            {transcribing && (
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600 mr-3"></div>
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                      Transcription in Progress
                    </h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Converting DNA to RNA (T → U)...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!dnaRnaResult && !transcribing && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  No Sequences Generated Yet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                  Configure your DNA generation parameters on the left and click "Generate DNA & Transcribe to RNA" to start.
                </p>
              </div>
            )}

            {/* DNA & RNA Results */}
            {dnaRnaResult && !transcribing && (
              <>
                <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Length</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {dnaRnaResult.length.toLocaleString()} bp
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Codons</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {Math.floor(dnaRnaResult.length / 3).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Actual GC Content</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {(dnaRnaResult.actual_gc * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* DNA Sequence */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                        DNA Sequence
                      </h3>
                      <button
                        onClick={() => handleCopySequence(dnaRnaResult.dna_sequence)}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 border border-gray-300 dark:border-gray-800 h-40 overflow-y-auto">
                      <pre className="text-sm text-blue-600 dark:text-blue-400 font-mono leading-relaxed whitespace-pre-wrap break-all">
                        {formatSequence(dnaRnaResult.dna_sequence, 60)}
                      </pre>
                    </div>
                  </div>

                  {/* RNA Sequence */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                        RNA Sequence {aminoAcidsResult && <span className="text-xs text-purple-400 ml-2">(Hover codons for amino acids)</span>}
                      </h3>
                      <button
                        onClick={() => handleCopySequence(dnaRnaResult.rna_sequence)}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm"
                      >
                        Copy
                      </button>
                    </div>

                    {/* Fixed Tooltip Bar - Outside scrollable area */}
                    {aminoAcidsResult && (
                      <div className={`mb-2 px-4 py-3 rounded-lg border transition-all duration-300 ease-in-out ${hoveredCodon
                        ? 'bg-purple-50 dark:bg-gray-900 border-purple-500 dark:border-purple-500 shadow-md'
                        : 'bg-gray-100 dark:bg-gray-900/50 border-gray-300 dark:border-gray-700'
                        }`}>
                        <div className="relative h-7 overflow-hidden">
                          {/* Hovered state content */}
                          <div className={`absolute inset-0 flex items-center gap-3 text-sm transition-all duration-300 ease-in-out ${hoveredCodon
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 -translate-y-4'
                            }`}>
                            {hoveredCodon && (
                              <>
                                <span className="font-mono text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 px-2 py-1 rounded">{hoveredCodon.codon}</span>
                                <span className="text-gray-500 dark:text-gray-400">→</span>
                                <span className="font-bold text-yellow-600 dark:text-yellow-400 text-lg">{hoveredCodon.symbol}</span>
                                <span className="text-green-600 dark:text-green-400 font-medium">{hoveredCodon.name}</span>
                                <span className="text-gray-500 dark:text-gray-400">•</span>
                                <span className="text-gray-700 dark:text-gray-300">{hoveredCodon.fullName}</span>
                              </>
                            )}
                          </div>
                          {/* Default state content */}
                          <div className={`absolute inset-0 flex items-center text-sm text-gray-500 dark:text-gray-400 italic transition-all duration-300 ease-in-out ${hoveredCodon
                            ? 'opacity-0 translate-y-4'
                            : 'opacity-100 translate-y-0'
                            }`}>
                            Hover over a codon to see the amino acid
                          </div>
                        </div>
                      </div>
                    )}

                    <div className={`bg-gray-100 dark:bg-gray-900 rounded-lg p-4 border h-40 overflow-y-auto ${aminoAcidsResult ? 'border-purple-400 dark:border-purple-500/50' : 'border-gray-300 dark:border-gray-800'}`}>
                      <div className="text-sm font-mono leading-relaxed">
                        <CodonHighlightedSequence
                          sequence={dnaRnaResult.rna_sequence}
                          showHighlights={!!aminoAcidsResult}
                          onHover={setHoveredCodon}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Extract Amino Acids Button */}
                {!aminoAcidsResult && (
                  <button
                    onClick={handleExtractAminoAcids}
                    disabled={extractingAminoAcids}
                    className="w-full mt-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    {extractingAminoAcids ? "Extracting..." : "Extract Amino Acids"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg
                className="h-5 w-5 text-red-400 dark:text-red-500 mr-2 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-400">Error</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}





        {/* Step 5: Protein Sequence */}
        {proteinResult && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 border border-transparent dark:border-gray-700">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold mr-3">
                ✓
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Protein Sequence Generated
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-transparent dark:border-gray-700">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Length</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {proteinResult.protein_length} amino acids
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Protein Type</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {proteinResult.protein_type}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Stability Score</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {proteinResult.stability_score}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                    3-Letter Format
                  </h3>
                  <button
                    onClick={() => handleCopySequence(proteinResult.protein_3letter)}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm"
                  >
                    Copy
                  </button>
                </div>
                <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto border border-gray-300 dark:border-gray-800">
                  <pre className="text-xs text-cyan-600 dark:text-cyan-400 font-mono leading-relaxed whitespace-pre-wrap break-all">
                    {proteinResult.protein_3letter}
                  </pre>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                    1-Letter Format
                  </h3>
                  <button
                    onClick={() => handleCopySequence(proteinResult.protein_1letter)}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm"
                  >
                    Copy
                  </button>
                </div>
                <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto border border-gray-300 dark:border-gray-800">
                  <pre className="text-xs text-pink-600 dark:text-pink-400 font-mono leading-relaxed whitespace-pre-wrap break-all">
                    {formatSequence(proteinResult.protein_1letter)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProteinFoldGenerationPage;
