import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import {
  generateDnaAndRna,
  generateProteinSequence,
  type ProteinGenerateResponse,
  type ProteinSequenceResponse,
} from "../services/proteinGenerator.api";
import useDocumentTitle from "../hooks/useDocumentTitle";

// Amino acid classification types
type AminoAcidClassification = "hydrophobic" | "polar" | "positive" | "negative" | "special";

// Amino acid classification lookup
const AMINO_ACID_CLASSIFICATION: Record<string, AminoAcidClassification> = {
  // Hydrophobic (Nonpolar)
  "A": "hydrophobic", // Alanine
  "V": "hydrophobic", // Valine
  "I": "hydrophobic", // Isoleucine
  "L": "hydrophobic", // Leucine
  "M": "hydrophobic", // Methionine
  "F": "hydrophobic", // Phenylalanine
  "W": "hydrophobic", // Tryptophan
  "P": "hydrophobic", // Proline

  // Polar (Uncharged)
  "S": "polar", // Serine
  "T": "polar", // Threonine
  "C": "polar", // Cysteine
  "Y": "polar", // Tyrosine
  "N": "polar", // Asparagine
  "Q": "polar", // Glutamine
  "G": "polar", // Glycine

  // Positive (Basic)
  "K": "positive", // Lysine
  "R": "positive", // Arginine
  "H": "positive", // Histidine

  // Negative (Acidic)
  "D": "negative", // Aspartic Acid
  "E": "negative", // Glutamic Acid

  // Special
  "*": "special", // Stop codon
};

// Color scheme for amino acid classifications
const CLASSIFICATION_COLORS: Record<AminoAcidClassification, { bg: string; hover: string; text: string }> = {
  hydrophobic: {
    bg: "bg-yellow-500",
    hover: "hover:bg-yellow-400",
    text: "text-white"
  },
  polar: {
    bg: "bg-blue-500",
    hover: "hover:bg-blue-400",
    text: "text-white"
  },
  positive: {
    bg: "bg-green-600",
    hover: "hover:bg-green-500",
    text: "text-white"
  },
  negative: {
    bg: "bg-red-600",
    hover: "hover:bg-red-500",
    text: "text-white"
  },
  special: {
    bg: "bg-gray-700",
    hover: "hover:bg-gray-600",
    text: "text-white"
  }
};

// Amino Acid Composition Bar Chart Component
const AminoAcidBarChart: React.FC<{
  rnaSequence: string;
}> = ({ rnaSequence }) => {
  // Count amino acids from RNA sequence
  const aminoAcidCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    for (let i = 0; i < rnaSequence.length - 2; i += 3) {
      const codon = rnaSequence.substring(i, i + 3).toUpperCase();
      const aa = CODON_TABLE[codon];
      if (aa && aa.name !== "STOP") {
        counts[aa.symbol] = (counts[aa.symbol] || 0) + 1;
      }
    }
    return counts;
  }, [rnaSequence]);

  // Amino acid info with full names
  const aminoAcids = [
    { symbol: "A", name: "Ala", fullName: "Alanine" },
    { symbol: "R", name: "Arg", fullName: "Arginine" },
    { symbol: "N", name: "Asn", fullName: "Asparagine" },
    { symbol: "D", name: "Asp", fullName: "Aspartic acid" },
    { symbol: "C", name: "Cys", fullName: "Cysteine" },
    { symbol: "E", name: "Glu", fullName: "Glutamic acid" },
    { symbol: "Q", name: "Gln", fullName: "Glutamine" },
    { symbol: "G", name: "Gly", fullName: "Glycine" },
    { symbol: "H", name: "His", fullName: "Histidine" },
    { symbol: "I", name: "Ile", fullName: "Isoleucine" },
    { symbol: "L", name: "Leu", fullName: "Leucine" },
    { symbol: "K", name: "Lys", fullName: "Lysine" },
    { symbol: "M", name: "Met", fullName: "Methionine" },
    { symbol: "F", name: "Phe", fullName: "Phenylalanine" },
    { symbol: "P", name: "Pro", fullName: "Proline" },
    { symbol: "S", name: "Ser", fullName: "Serine" },
    { symbol: "T", name: "Thr", fullName: "Threonine" },
    { symbol: "W", name: "Trp", fullName: "Tryptophan" },
    { symbol: "Y", name: "Tyr", fullName: "Tyrosine" },
    { symbol: "V", name: "Val", fullName: "Valine" },
  ];

  // Get classification color
  const getBarColor = (symbol: string) => {
    const classification = AMINO_ACID_CLASSIFICATION[symbol];
    switch (classification) {
      case "hydrophobic": return "bg-gradient-to-r from-yellow-400 to-yellow-500";
      case "polar": return "bg-gradient-to-r from-blue-400 to-blue-500";
      case "positive": return "bg-gradient-to-r from-green-400 to-green-500";
      case "negative": return "bg-gradient-to-r from-red-400 to-red-500";
      case "special": return "bg-gradient-to-r from-purple-400 to-purple-500";
      default: return "bg-gradient-to-r from-gray-400 to-gray-500";
    }
  };

  const totalAA = Object.values(aminoAcidCounts).reduce((a, b) => a + b, 0);
  const maxCount = Math.max(...Object.values(aminoAcidCounts), 1);

  // Sort by count descending
  const sortedAAs = [...aminoAcids].sort((a, b) =>
    (aminoAcidCounts[b.symbol] || 0) - (aminoAcidCounts[a.symbol] || 0)
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Amino Acid Composition</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">{totalAA.toLocaleString()} total amino acids</span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-yellow-500"></span>
          <span className="text-gray-600 dark:text-gray-400">Hydrophobic</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-blue-500"></span>
          <span className="text-gray-600 dark:text-gray-400">Polar</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-500"></span>
          <span className="text-gray-600 dark:text-gray-400">Positive</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-500"></span>
          <span className="text-gray-600 dark:text-gray-400">Negative</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-purple-500"></span>
          <span className="text-gray-600 dark:text-gray-400">Special</span>
        </div>
      </div>

      {/* Bars */}
      <div className="space-y-1.5">
        {sortedAAs.map(aa => {
          const count = aminoAcidCounts[aa.symbol] || 0;
          const percentage = totalAA > 0 ? (count / totalAA) * 100 : 0;
          const barWidth = (count / maxCount) * 100;

          return (
            <div key={aa.symbol} className="flex items-center gap-2 group">
              {/* Label */}
              <div className="w-8 text-right">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{aa.symbol}</span>
              </div>
              <div className="w-10 text-left">
                <span className="text-[10px] text-gray-500 dark:text-gray-400">{aa.name}</span>
              </div>

              {/* Bar container */}
              <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${getBarColor(aa.symbol)}`}
                  style={{ width: `${barWidth}%` }}
                />
                {/* Hover tooltip */}
                <div className="absolute inset-0 flex items-center px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-medium text-white drop-shadow-md">
                    {aa.fullName}
                  </span>
                </div>
              </div>

              {/* Count and percentage */}
              <div className="w-20 text-right">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {count.toLocaleString()}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-1">
                  ({percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


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
  classification: AminoAcidClassification;
  classificationLabel: string;
}

// Constants for virtualization
const CODONS_PER_ROW = 10; // Number of codons per row (reduced to prevent wrapping)
const ROW_HEIGHT = 32; // Height of each row in pixels

// Virtualized Component to render RNA sequence with highlighted codons
const VirtualizedCodonSequence: React.FC<{
  sequence: string;
  showHighlights: boolean;
  onHover?: (info: HoveredCodonInfo | null) => void;
  height?: number;
}> = ({ sequence, showHighlights, onHover, height = 160 }) => {
  // Memoize codon extraction to avoid recalculating on every render
  const codons = useMemo(() => {
    const result: string[] = [];
    for (let i = 0; i < sequence.length; i += 3) {
      result.push(sequence.substring(i, i + 3));
    }
    return result;
  }, [sequence]);

  // Calculate number of rows
  const rowCount = Math.ceil(codons.length / CODONS_PER_ROW);


  // For very small sequences, render without virtualization
  if (codons.length <= CODONS_PER_ROW * 5) {
    return (
      <div className="flex flex-wrap gap-1 p-2">
        {codons.map((codon, index) => {
          const aminoAcid = CODON_TABLE[codon.toUpperCase()];

          if (showHighlights && aminoAcid) {
            const classification = AMINO_ACID_CLASSIFICATION[aminoAcid.symbol] || "special";
            const colors = CLASSIFICATION_COLORS[classification];
            const classificationLabel = classification.charAt(0).toUpperCase() + classification.slice(1);

            return (
              <span
                key={index}
                className={`cursor-pointer px-1 py-0.5 rounded inline-block font-medium text-xs ${colors.bg} ${colors.text} ${colors.hover} transition-colors shadow-sm`}
                onMouseEnter={() => onHover?.({
                  codon,
                  symbol: aminoAcid.symbol,
                  name: aminoAcid.name,
                  fullName: aminoAcid.fullName,
                  classification,
                  classificationLabel
                })}
                onMouseLeave={() => onHover?.(null)}
              >
                {codon}
              </span>
            );
          } else {
            return (
              <span
                key={index}
                className="inline-block text-green-700 dark:text-green-400 font-medium text-xs font-mono"
              >
                {codon}
              </span>
            );
          }
        })}
      </div>
    );
  }

  // Custom scroll-based virtualization
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Calculate visible range
  const visibleStartRow = Math.floor(scrollTop / ROW_HEIGHT);
  const visibleRows = Math.ceil(height / ROW_HEIGHT) + 2; // Buffer rows
  const startRow = Math.max(0, visibleStartRow - 1);
  const endRow = Math.min(rowCount, startRow + visibleRows + 2);

  const totalHeight = rowCount * ROW_HEIGHT;

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-bl z-10">
        {codons.length.toLocaleString()} codons ({rowCount.toLocaleString()} rows)
      </div>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600"
        style={{ height }}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          {Array.from({ length: endRow - startRow }, (_, i) => {
            const rowIndex = startRow + i;
            const startIdx = rowIndex * CODONS_PER_ROW;
            const endIdx = Math.min(startIdx + CODONS_PER_ROW, codons.length);
            const rowCodons = codons.slice(startIdx, endIdx);

            return (
              <div
                key={rowIndex}
                className="flex gap-1 items-center px-2 absolute w-full"
                style={{ top: rowIndex * ROW_HEIGHT, height: ROW_HEIGHT }}
              >
                <span className="text-xs text-gray-400 dark:text-gray-500 w-16 flex-shrink-0 font-mono">
                  {(startIdx + 1).toLocaleString()}
                </span>
                <div className="flex gap-1 flex-wrap">
                  {rowCodons.map((codon, i) => {
                    const globalIndex = startIdx + i;
                    const aminoAcid = CODON_TABLE[codon.toUpperCase()];

                    if (showHighlights && aminoAcid) {
                      const classification = AMINO_ACID_CLASSIFICATION[aminoAcid.symbol] || "special";
                      const colors = CLASSIFICATION_COLORS[classification];
                      const classificationLabel = classification.charAt(0).toUpperCase() + classification.slice(1);

                      return (
                        <span
                          key={globalIndex}
                          className={`cursor-pointer px-1 py-0.5 rounded inline-block font-medium text-xs ${colors.bg} ${colors.text} ${colors.hover} transition-colors shadow-sm`}
                          onMouseEnter={() => onHover?.({
                            codon,
                            symbol: aminoAcid.symbol,
                            name: aminoAcid.name,
                            fullName: aminoAcid.fullName,
                            classification,
                            classificationLabel
                          })}
                          onMouseLeave={() => onHover?.(null)}
                        >
                          {codon}
                        </span>
                      );
                    } else {
                      return (
                        <span
                          key={globalIndex}
                          className="inline-block text-green-700 dark:text-green-400 font-medium text-xs font-mono"
                        >
                          {codon}
                        </span>
                      );
                    }
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Virtualized plain sequence display (for DNA)
const VirtualizedPlainSequence: React.FC<{
  sequence: string;
  height?: number;
  colorClass?: string;
  charsPerLine?: number;
}> = ({ sequence, height = 160, colorClass = "text-blue-600 dark:text-blue-400", charsPerLine = 60 }) => {
  // Memoize line breaking
  const lines = useMemo(() => {
    const result: string[] = [];
    for (let i = 0; i < sequence.length; i += charsPerLine) {
      result.push(sequence.substring(i, i + charsPerLine));
    }
    return result;
  }, [sequence, charsPerLine]);

  const ROW_HEIGHT = 24;

  // For small sequences, render normally
  if (lines.length <= 10) {
    return (
      <div className="p-4">
        <pre className={`text-sm ${colorClass} font-mono leading-relaxed whitespace-pre-wrap break-all`}>
          {lines.join("\n")}
        </pre>
      </div>
    );
  }

  // Custom scroll-based virtualization
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Calculate visible range
  const visibleStartRow = Math.floor(scrollTop / ROW_HEIGHT);
  const visibleRows = Math.ceil(height / ROW_HEIGHT) + 2;
  const startRow = Math.max(0, visibleStartRow - 1);
  const endRow = Math.min(lines.length, startRow + visibleRows + 2);

  const totalHeight = lines.length * ROW_HEIGHT;

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-bl z-10">
        {sequence.length.toLocaleString()} bp ({lines.length.toLocaleString()} rows)
      </div>
      <div
        onScroll={handleScroll}
        className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600"
        style={{ height }}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          {Array.from({ length: endRow - startRow }, (_, i) => {
            const rowIndex = startRow + i;
            const lineNum = (rowIndex * charsPerLine) + 1;

            return (
              <div
                key={rowIndex}
                className="flex items-center px-2 font-mono absolute w-full"
                style={{ top: rowIndex * ROW_HEIGHT, height: ROW_HEIGHT }}
              >
                <span className="text-xs text-gray-400 dark:text-gray-500 w-16 flex-shrink-0">
                  {lineNum.toLocaleString()}
                </span>
                <span className={`text-sm ${colorClass}`}>
                  {lines[rowIndex]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const ProteinFoldGenerationPage: React.FC = () => {
  useDocumentTitle("Protein Fold Generation");

  // Tab state
  const [activeTab, setActiveTab] = useState<"generate" | "input-dna" | "input-rna">("generate");

  // Generate Random DNA tab states
  const [length, setLength] = useState<number>(99);
  const [gcContent, setGcContent] = useState<number>(0.5);
  const [seed, setSeed] = useState<string>("");
  const [useRandomSeed, setUseRandomSeed] = useState<boolean>(true);

  // Input DNA/RNA tab states
  const [inputDnaSequence, setInputDnaSequence] = useState<string>("");
  const [inputRnaSequence, setInputRnaSequence] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [dnaRnaResult, setDnaRnaResult] = useState<ProteinGenerateResponse | null>(null);
  const [proteinResult, setProteinResult] = useState<ProteinSequenceResponse | null>(null);

  const [transcribing, setTranscribing] = useState<boolean>(false);
  const [generatingProtein, setGeneratingProtein] = useState<boolean>(false);
  const [hoveredCodon, setHoveredCodon] = useState<HoveredCodonInfo | null>(null);

  // Pagination state for ORFs
  const [currentPage, setCurrentPage] = useState<number>(1);
  const orfsPerPage = 10;

  // Progress tracking state
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [tipIndex, setTipIndex] = useState<number>(0);
  const startTimeRef = useRef<number | null>(null);

  // End-to-end rate: ~303,030 bp/second based on benchmarks (100M bp in ~330 seconds)
  // Note: C++ generation is fast (~19s for 100M), but total time includes JSON serialization & transfer
  const GENERATION_RATE = 303030;

  // Estimate generation time in seconds based on sequence length
  const estimateGenerationTime = (bp: number): number => {
    const baseOverhead = 2;
    return baseOverhead + (bp / GENERATION_RATE);
  };

  // Format seconds to human-readable time
  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.round(seconds % 60);
      return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.round((seconds % 3600) / 60);
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
  };

  // Tips to show during generation
  const generationTips = [
    "DNA sequences are generated using a high-performance C++ engine for speed.",
    "GC content affects DNA stability - higher GC means stronger hydrogen bonding.",
    "The generated RNA is transcribed from the template strand (3' to 5').",
    "100 million base pairs is roughly the size of a small chromosome!",
    "Our C++ engine can process millions of base pairs per second.",
    "Each codon (3 nucleotides) in the RNA will code for one amino acid.",
    "Did you know? Human DNA has about 3 billion base pairs.",
    "The GC content of most organisms ranges from 25% to 75%.",
    "ORFs (Open Reading Frames) are regions that could potentially code for proteins.",
    "Start codons (AUG) mark where protein translation begins.",
    "Large sequences take time to transfer — the server is packaging the data!",
    "The C++ engine generates quickly, but transferring the data takes most of the time.",
  ];

  // Timer effect for elapsed time and tip rotation
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    let tipIntervalId: ReturnType<typeof setInterval>;

    if (loading) {
      startTimeRef.current = Date.now();
      setElapsedTime(0);
      setTipIndex(Math.floor(Math.random() * generationTips.length));

      intervalId = setInterval(() => {
        if (startTimeRef.current) {
          setElapsedTime((Date.now() - startTimeRef.current) / 1000);
        }
      }, 100);

      // Rotate tips every 8 seconds
      tipIntervalId = setInterval(() => {
        setTipIndex((prev) => (prev + 1) % generationTips.length);
      }, 8000);
    } else {
      startTimeRef.current = null;
      setElapsedTime(0);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (tipIntervalId) clearInterval(tipIntervalId);
    };
  }, [loading]);

  const estimatedTime = estimateGenerationTime(length);
  const progress = loading ? Math.min((elapsedTime / estimatedTime) * 100, 95) : 0;
  const remainingTime = Math.max(0, estimatedTime - elapsedTime);

  // Validation functions
  const validateDnaSequence = (sequence: string): { valid: boolean; error?: string } => {
    const cleanSeq = sequence.replace(/\s/g, "").toUpperCase();
    if (cleanSeq.length === 0) {
      return { valid: false, error: "DNA sequence cannot be empty" };
    }
    if (cleanSeq.length % 3 !== 0) {
      return { valid: false, error: "DNA sequence length must be divisible by 3 for complete codons" };
    }
    if (!/^[ATGC]+$/.test(cleanSeq)) {
      return { valid: false, error: "DNA sequence can only contain A, T, G, C characters" };
    }
    return { valid: true };
  };

  const validateRnaSequence = (sequence: string): { valid: boolean; error?: string } => {
    const cleanSeq = sequence.replace(/\s/g, "").toUpperCase();
    if (cleanSeq.length === 0) {
      return { valid: false, error: "RNA sequence cannot be empty" };
    }
    if (cleanSeq.length % 3 !== 0) {
      return { valid: false, error: "RNA sequence length must be divisible by 3 for complete codons" };
    }
    if (!/^[AUGC]+$/.test(cleanSeq)) {
      return { valid: false, error: "RNA sequence can only contain A, U, G, C characters" };
    }
    return { valid: true };
  };

  // DNA to RNA transcription
  const transcribeDnaToRna = (dna: string): string => {
    return dna.replace(/T/g, "U");
  };

  // Calculate GC content
  const calculateGcContent = (sequence: string): number => {
    const cleanSeq = sequence.replace(/\s/g, "").toUpperCase();
    const gcCount = (cleanSeq.match(/[GC]/g) || []).length;
    return cleanSeq.length > 0 ? gcCount / cleanSeq.length : 0;
  };

  // Handle input DNA sequence
  const handleInputDna = () => {
    setError(null);
    setValidationError(null);
    setProteinResult(null);

    const cleanDna = inputDnaSequence.replace(/\s/g, "").toUpperCase();
    const validation = validateDnaSequence(cleanDna);

    if (!validation.valid) {
      setValidationError(validation.error || "Invalid DNA sequence");
      return;
    }

    setTranscribing(true);
    const rnaSeq = transcribeDnaToRna(cleanDna);
    const gcContent = calculateGcContent(cleanDna);

    setDnaRnaResult({
      gc_content: gcContent,
      dna_sequence: cleanDna,
      rna_sequence: rnaSeq,
      length: cleanDna.length,
      actual_gc: gcContent,
    });

    setTimeout(() => setTranscribing(false), 1000);
  };

  // Handle input RNA sequence
  const handleInputRna = () => {
    setError(null);
    setValidationError(null);
    setProteinResult(null);

    const cleanRna = inputRnaSequence.replace(/\s/g, "").toUpperCase();
    const validation = validateRnaSequence(cleanRna);

    if (!validation.valid) {
      setValidationError(validation.error || "Invalid RNA sequence");
      return;
    }

    // Convert RNA back to DNA for display (U -> T)
    const dnaSeq = cleanRna.replace(/U/g, "T");
    const gcContent = calculateGcContent(dnaSeq);

    setDnaRnaResult({
      gc_content: gcContent,
      dna_sequence: dnaSeq,
      rna_sequence: cleanRna,
      length: cleanRna.length,
      actual_gc: gcContent,
    });
  };

  const handleGenerate = async () => {
    setError(null);
    setLoading(true);
    setDnaRnaResult(null);
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
      // FastAPI validation errors return detail as an array of objects
      const detail = err.response?.data?.detail;
      let errorMessage = "Failed to generate DNA/RNA sequences";

      if (typeof detail === "string") {
        errorMessage = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        // Extract message from first validation error
        errorMessage = detail[0]?.msg || detail[0]?.message || JSON.stringify(detail[0]);
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setTranscribing(false);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateProtein = async () => {
    if (!dnaRnaResult) return;

    setError(null);
    setGeneratingProtein(true);

    try {
      const response = await generateProteinSequence({ rna_sequence: dnaRnaResult.rna_sequence });
      setProteinResult(response);
      setCurrentPage(1); // Reset to first page when new results come in
    } catch (err: any) {
      // FastAPI validation errors return detail as an array of objects
      const detail = err.response?.data?.detail;
      let errorMessage = "Failed to generate protein sequence";

      if (typeof detail === "string") {
        errorMessage = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        errorMessage = detail[0]?.msg || detail[0]?.message || JSON.stringify(detail[0]);
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setGeneratingProtein(false);
    }
  };


  const handleCopySequence = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleReset = () => {
    setDnaRnaResult(null);
    setProteinResult(null);
    setError(null);
    setValidationError(null);
    setInputDnaSequence("");
    setInputRnaSequence("");
  };

  // Check if sequence is large (> 10M bp) - only show download, no display
  const isLargeSequence = dnaRnaResult && dnaRnaResult.length > 10000000;

  // Download sequence as .txt file
  const handleDownloadSequence = (sequence: string, filename: string) => {
    const blob = new Blob([sequence], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (!proteinResult?.orfs || proteinResult.orfs.length === 0) return;

    // Create CSV content
    const headers = ["ORF #", "Start Position", "End Position", "Length (amino acids)", "Protein (3-letter)", "Protein (1-letter)"];
    const rows = proteinResult.orfs.map((orf, index) => [
      index + 1,
      orf.start_position,
      orf.end_position,
      orf.length,
      `"${orf.protein_3letter}"`, // Wrap in quotes to handle commas
      `"${orf.protein_1letter}"`
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `orfs_export_${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-8xl">

        {/* Two Column Layout: Generate DNA (Left) & DNA/RNA Sequences (Right) */}
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* Left Column: DNA Generation + Amino Acids */}
          <div className="flex flex-col gap-6">
            {/* Step 1 - DNA Generation with Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 border border-transparent dark:border-gray-700 2xl:h-full flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
                <div className="flex items-center">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold mr-2 sm:mr-3 text-sm sm:text-base">
                    1
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                    DNA/RNA Sequence Input
                  </h2>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                <nav className="flex px-4 sm:px-6 -mb-px space-x-2 sm:space-x-4 min-w-max">
                  <button
                    onClick={() => setActiveTab("generate")}
                    disabled={!!dnaRnaResult}
                    className={`py-2 px-3 sm:px-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === "generate"
                      ? "border-blue-600 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer"
                      } ${dnaRnaResult ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    Generate Random
                  </button>
                  <button
                    onClick={() => setActiveTab("input-dna")}
                    disabled={!!dnaRnaResult}
                    className={`py-2 px-3 sm:px-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === "input-dna"
                      ? "border-blue-600 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer"
                      } ${dnaRnaResult ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    Input DNA
                  </button>
                  <button
                    onClick={() => setActiveTab("input-rna")}
                    disabled={!!dnaRnaResult}
                    className={`py-2 px-3 sm:px-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === "input-rna"
                      ? "border-blue-600 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer"
                      } ${dnaRnaResult ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    Input RNA
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-4 sm:p-6 flex-1 flex flex-col">
                {/* Generate Random DNA Tab */}
                {activeTab === "generate" && (
                  <div className="space-y-6 flex-1 flex flex-col">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Sequence Length (bp) - must be divisible by 3
                      </label>
                      <input
                        type="number"
                        min="3"
                        max="10000000"
                        step="3"
                        value={length}
                        onChange={(e) => setLength(parseInt(e.target.value) || 3)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        disabled={loading || !!dnaRnaResult}
                      />
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Range: 3 - 10,000,000 base pairs (for complete codons)
                      </p>
                      {length > 10000000 && (
                        <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                          ⚠️ Sequences over 10M bp will be available for download only (not displayed in browser)
                        </p>
                      )}
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

                    {/* Time estimate warning for long generations */}
                    {estimatedTime > 30 && !dnaRnaResult && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
                        <p className="text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
                          <span>⏱️</span>
                          <span>
                            Estimated generation time: <strong>{formatTime(estimatedTime)}</strong>
                            {estimatedTime > 120 && " — You can leave this tab open while processing"}
                          </span>
                        </p>
                      </div>
                    )}

                    {!dnaRnaResult ? (
                      !loading ? (
                        <button
                          onClick={handleGenerate}
                          disabled={length < 3 || gcContent < 0 || gcContent > 1}
                          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                        >
                          Generate DNA & Transcribe to RNA
                        </button>
                      ) : (
                        /* Enhanced Loading Progress UI */
                        <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                          {/* Header with spinner and sequence info */}
                          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <div>
                                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                                    {length >= 10000000 ? "Generating & Transferring" : "Generating"} {length >= 1000000 ? `${(length / 1000000).toFixed(1)}M` : length.toLocaleString()} bp
                                  </h4>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {length >= 10000000
                                      ? `DNA & RNA sequences (~${(length / 1000000).toFixed(0)}MB payload)`
                                      : "DNA & RNA sequences"}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Elapsed</p>
                                <p className="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400">
                                  {formatTime(elapsedTime)}
                                </p>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                              </div>
                            </div>

                            {/* Time Estimates */}
                            <div className="flex items-center justify-between mt-2 text-xs">
                              <span className="text-gray-500 dark:text-gray-400">
                                {progress < 95 ? (
                                  <>Est. remaining: <span className="font-semibold text-gray-700 dark:text-gray-300">{formatTime(remainingTime)}</span></>
                                ) : (
                                  <span className="text-blue-600 dark:text-blue-400">Almost done...</span>
                                )}
                              </span>
                              <span className="text-gray-500 dark:text-gray-400">
                                Est. total: <span className="font-semibold text-gray-700 dark:text-gray-300">{formatTime(estimatedTime)}</span>
                              </span>
                            </div>
                          </div>

                          {/* Tips Section - only show for longer generations */}
                          {estimatedTime > 5 && (
                            <div className="px-5 py-3 bg-blue-50/50 dark:bg-blue-950/20">
                              <div className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5 flex-shrink-0">💡</span>
                                <div>
                                  <p className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-0.5">
                                    Did you know?
                                  </p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {generationTips[tipIndex]}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    ) : (
                      <button
                        onClick={handleReset}
                        className="w-full mt-auto bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 group shadow-lg hover:shadow-xl"
                      >
                        <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Clear Results & Try New Sequence
                      </button>
                    )}
                  </div>
                )}

                {/* Input DNA Tab */}
                {activeTab === "input-dna" && (
                  <div className="space-y-6 flex-1 flex flex-col">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        DNA Sequence
                      </label>
                      <textarea
                        value={inputDnaSequence}
                        onChange={(e) => setInputDnaSequence(e.target.value)}
                        disabled={!!dnaRnaResult}
                        placeholder="Enter DNA sequence (A, T, G, C). Length must be divisible by 3.&#10;Example: ATGGCTAGCTAGCTAGCTAGCTAG"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm resize-none"
                        rows={8}
                      />
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Only A, T, G, C characters allowed. Whitespace will be removed automatically.
                      </p>
                    </div>

                    {validationError && (
                      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <p className="text-sm text-red-700 dark:text-red-300">{validationError}</p>
                      </div>
                    )}

                    {!dnaRnaResult ? (
                      <button
                        onClick={handleInputDna}
                        disabled={!inputDnaSequence.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                      >
                        Transcribe DNA to RNA
                      </button>
                    ) : (
                      <button
                        onClick={handleReset}
                        className="w-full mt-auto bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 group shadow-lg hover:shadow-xl"
                      >
                        <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Clear Results & Try New Sequence
                      </button>
                    )}
                  </div>
                )}

                {/* Input RNA Tab */}
                {activeTab === "input-rna" && (
                  <div className="space-y-6 flex-1 flex flex-col">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        RNA Sequence
                      </label>
                      <textarea
                        value={inputRnaSequence}
                        onChange={(e) => setInputRnaSequence(e.target.value)}
                        disabled={!!dnaRnaResult}
                        placeholder="Enter RNA sequence (A, U, G, C). Length must be divisible by 3.&#10;Example: AUGGCUAGCUAGCUAGCUAGCUAG"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm resize-none"
                        rows={8}
                      />
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Only A, U, G, C characters allowed. Whitespace will be removed automatically.
                      </p>
                    </div>

                    {validationError && (
                      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <p className="text-sm text-red-700 dark:text-red-300">{validationError}</p>
                      </div>
                    )}

                    {!dnaRnaResult ? (
                      <button
                        onClick={handleInputRna}
                        disabled={!inputRnaSequence.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                      >
                        Use RNA Sequence
                      </button>
                    ) : (
                      <button
                        onClick={handleReset}
                        className="w-full mt-auto bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 group shadow-lg hover:shadow-xl"
                      >
                        <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Clear Results & Try New Sequence
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Step 2 - DNA & RNA Sequences */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-4 sm:p-6 border border-transparent dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div className="flex items-center">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${dnaRnaResult && !transcribing ? 'bg-green-600' : 'bg-gray-400 dark:bg-gray-600'} text-white flex items-center justify-center font-bold mr-2 sm:mr-3 text-sm sm:text-base`}>
                  {dnaRnaResult && !transcribing ? '✓' : '2'}
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  DNA & RNA Sequences
                </h2>
              </div>
              {dnaRnaResult && !transcribing && (
                <div className="flex flex-wrap gap-1 ml-9 sm:ml-0">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
                    {dnaRnaResult.length.toLocaleString()} bp
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300">
                    {Math.floor(dnaRnaResult.length / 3).toLocaleString()} codons
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300">
                    GC {(dnaRnaResult.actual_gc * 100).toFixed(1)}%
                  </span>
                </div>
              )}
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

                <div className="space-y-4">
                  {/* Large Sequence Warning */}
                  {isLargeSequence && (
                    <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                          <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                            Large Sequence Mode ({(dnaRnaResult.length / 1000000).toFixed(1)}M bp)
                          </h3>
                          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                            Sequences over 10 million base pairs cannot be displayed in the browser.
                            Use the download buttons below to save them as .txt files.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DNA Sequence */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
                      <h3 className="text-sm sm:text-md font-semibold text-gray-900 dark:text-white">
                        DNA Sequence ({dnaRnaResult.length.toLocaleString()} bp)
                      </h3>
                      <div className="flex gap-2">
                        {!isLargeSequence && (
                          <button
                            onClick={() => handleCopySequence(dnaRnaResult.dna_sequence)}
                            className="px-2 sm:px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs sm:text-sm"
                          >
                            Copy
                          </button>
                        )}
                        <button
                          onClick={() => handleDownloadSequence(dnaRnaResult.dna_sequence, `dna_sequence_${dnaRnaResult.length}bp.txt`)}
                          className="px-2 sm:px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs sm:text-sm flex items-center gap-1"
                        >
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          <span className="hidden sm:inline">Download</span>
                          <span className="sm:hidden">DL</span>
                        </button>
                      </div>
                    </div>
                    {isLargeSequence ? (
                      <div className="bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-800 p-8 text-center">
                        <div className="text-6xl mb-4">🧬</div>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                          DNA sequence too large to display
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          Click "Download" to save the {(dnaRnaResult.length / 1000000).toFixed(1)} MB file
                        </p>
                      </div>
                    ) : (
                      <div className="bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-800 overflow-hidden">
                        <VirtualizedPlainSequence
                          sequence={dnaRnaResult.dna_sequence}
                          height={160}
                          colorClass="text-blue-600 dark:text-blue-400"
                        />
                      </div>
                    )}
                  </div>

                  {/* RNA Sequence */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
                      <h3 className="text-sm sm:text-md font-semibold text-gray-900 dark:text-white">
                        RNA Sequence ({dnaRnaResult.length.toLocaleString()} bp) {proteinResult && !isLargeSequence && <span className="text-xs text-purple-400 ml-1 sm:ml-2 block sm:inline">(Hover for amino acids)</span>}
                      </h3>
                      <div className="flex gap-2">
                        {!isLargeSequence && (
                          <button
                            onClick={() => handleCopySequence(dnaRnaResult.rna_sequence)}
                            className="px-2 sm:px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs sm:text-sm"
                          >
                            Copy
                          </button>
                        )}
                        <button
                          onClick={() => handleDownloadSequence(dnaRnaResult.rna_sequence, `rna_sequence_${dnaRnaResult.length}bp.txt`)}
                          className="px-2 sm:px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs sm:text-sm flex items-center gap-1"
                        >
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          <span className="hidden sm:inline">Download</span>
                          <span className="sm:hidden">DL</span>
                        </button>
                      </div>
                    </div>

                    {isLargeSequence ? (
                      <div className="bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-800 p-8 text-center">
                        <div className="text-6xl mb-4">🧬</div>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                          RNA sequence too large to display
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          Click "Download" to save the {(dnaRnaResult.length / 1000000).toFixed(1)} MB file
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Fixed Tooltip Bar - Outside scrollable area */}
                        {proteinResult && (
                          <>
                            <div className={`mb-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg border transition-all duration-300 ease-in-out ${hoveredCodon
                              ? 'bg-purple-50 dark:bg-gray-900 border-purple-500 dark:border-purple-500 shadow-md'
                              : 'bg-gray-100 dark:bg-gray-900/50 border-gray-300 dark:border-gray-700'
                              }`}>
                              <div className="relative h-7 overflow-hidden">
                                {/* Hovered state content */}
                                <div className={`absolute inset-0 flex items-center gap-1 sm:gap-3 text-xs sm:text-sm transition-all duration-300 ease-in-out flex-wrap ${hoveredCodon
                                  ? 'opacity-100 translate-y-0'
                                  : 'opacity-0 -translate-y-4'
                                  }`}>
                                  {hoveredCodon && (
                                    <>
                                      <span className="font-mono text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">{hoveredCodon.codon}</span>
                                      <span className="text-gray-500 dark:text-gray-400">→</span>
                                      <span className="font-bold text-yellow-600 dark:text-yellow-400 text-sm sm:text-lg">{hoveredCodon.symbol}</span>
                                      <span className="text-green-600 dark:text-green-400 font-medium">{hoveredCodon.name}</span>
                                      <span className="text-gray-500 dark:text-gray-400 hidden sm:inline">•</span>
                                      <span className="text-gray-700 dark:text-gray-300 hidden sm:inline">{hoveredCodon.fullName}</span>
                                      <span className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-semibold ${CLASSIFICATION_COLORS[hoveredCodon.classification].bg
                                        } ${CLASSIFICATION_COLORS[hoveredCodon.classification].text}`}>
                                        {hoveredCodon.classificationLabel}
                                      </span>
                                    </>
                                  )}
                                </div>
                                {/* Default state content */}
                                <div className={`absolute inset-0 flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 italic transition-all duration-300 ease-in-out ${hoveredCodon
                                  ? 'opacity-0 translate-y-4'
                                  : 'opacity-100 translate-y-0'
                                  }`}>
                                  Hover over a codon to see the amino acid
                                </div>
                              </div>
                            </div>

                            {/* Color Legend */}
                            <div className="mb-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700">
                              <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs">
                                <span className="text-gray-500 dark:text-gray-400">Legend:</span>
                                <div className="flex items-center gap-1">
                                  <span className={`w-3 h-3 rounded ${CLASSIFICATION_COLORS.hydrophobic.bg}`}></span>
                                  <span className="text-gray-700 dark:text-gray-300">Hydrophobic</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className={`w-3 h-3 rounded ${CLASSIFICATION_COLORS.polar.bg}`}></span>
                                  <span className="text-gray-700 dark:text-gray-300">Polar</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className={`w-3 h-3 rounded ${CLASSIFICATION_COLORS.positive.bg}`}></span>
                                  <span className="text-gray-700 dark:text-gray-300">Positive</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className={`w-3 h-3 rounded ${CLASSIFICATION_COLORS.negative.bg}`}></span>
                                  <span className="text-gray-700 dark:text-gray-300">Negative</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className={`w-3 h-3 rounded ${CLASSIFICATION_COLORS.special.bg}`}></span>
                                  <span className="text-gray-700 dark:text-gray-300">Special</span>
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        <div className={`bg-gray-100 dark:bg-gray-900 rounded-lg border overflow-hidden ${proteinResult ? 'border-purple-400 dark:border-purple-500/50' : 'border-gray-300 dark:border-gray-800'}`}>
                          <VirtualizedCodonSequence
                            sequence={dnaRnaResult.rna_sequence}
                            showHighlights={!!proteinResult}
                            onHover={setHoveredCodon}
                            height={160}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Generate Protein Sequence Button */}
                {!proteinResult && !isLargeSequence && (
                  !generatingProtein ? (
                    <button
                      onClick={handleGenerateProtein}
                      className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                      Generate Protein Sequence & Find ORFs
                    </button>
                  ) : (
                    /* Enhanced Loading UI for Protein Generation */
                    <div className="w-full mt-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-gray-800 rounded-xl border border-purple-200 dark:border-purple-800 overflow-hidden">
                      <div className="px-5 py-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                              Finding Open Reading Frames
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Scanning {dnaRnaResult ? Math.floor(dnaRnaResult.length / 3).toLocaleString() : 0} codons for ORFs...
                            </p>
                          </div>
                        </div>

                        {/* Animated Progress Bar (indeterminate) */}
                        <div className="relative h-2 bg-purple-200 dark:bg-purple-900/50 rounded-full overflow-hidden">
                          <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 rounded-full animate-pulse" style={{ animation: 'slideRight 1.5s ease-in-out infinite' }}></div>
                        </div>

                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 text-center">
                          This may take a moment for longer sequences...
                        </p>
                      </div>
                    </div>
                  )
                )}

                {/* Message for large sequences */}
                {!proteinResult && isLargeSequence && (
                  <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                    <p className="text-gray-600 dark:text-gray-400">
                      ⚠️ Protein sequence generation is not available for sequences over 10 million base pairs.
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      Download the sequences above for offline analysis.
                    </p>
                  </div>
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


        {/* Protein Sequence Analysis - Data Table */}
        {proteinResult && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-4 sm:p-6 mb-4 sm:mb-6 border border-transparent dark:border-gray-700">
            <div className="mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <div className="flex items-center">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold mr-2 sm:mr-3 text-sm sm:text-base">
                    ✓
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                    Protein Sequence Analysis
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2 ml-9 sm:ml-0">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300">
                    {proteinResult.total_orfs.toLocaleString()} ORFs found
                  </span>
                  <button
                    onClick={handleExportCSV}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="hidden sm:inline">Export CSV</span>
                    <span className="sm:hidden">CSV</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Display ORFs as Data Table */}
            {proteinResult.orfs && proteinResult.orfs.length > 0 ? (
              <>
                {/* Pagination Info */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  <div>
                    Showing {((currentPage - 1) * orfsPerPage) + 1}-{Math.min(currentPage * orfsPerPage, proteinResult.orfs.length)} of {proteinResult.orfs.length.toLocaleString()} ORFs
                  </div>
                  <div className="text-gray-500 dark:text-gray-500">
                    Page {currentPage} of {Math.ceil(proteinResult.orfs.length / orfsPerPage)}
                  </div>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          ORF #
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Position
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Length
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          1-Letter Format
                        </th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          3-Letter Format
                        </th>

                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {proteinResult.orfs
                        .slice((currentPage - 1) * orfsPerPage, currentPage * orfsPerPage)
                        .map((orf, index) => {
                          const globalIndex = (currentPage - 1) * orfsPerPage + index;
                          return (
                            <tr key={globalIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                              <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {globalIndex + 1}
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 font-mono">
                                {orf.start_position.toLocaleString()}-{orf.end_position.toLocaleString()}
                              </td>
                              <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300">
                                  {orf.length.toLocaleString()} aa
                                </span>
                              </td>
                              <td className="px-3 py-3 text-sm text-pink-600 dark:text-pink-400 font-mono">
                                <div className="overflow-x-auto  whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent pb-1">
                                  {orf.protein_1letter}
                                </div>
                              </td>
                              <td className="px-3 py-3 text-sm text-cyan-600 dark:text-cyan-400 font-mono">
                                <div className="overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent pb-1">
                                  {orf.protein_3letter}
                                </div>
                              </td>


                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {proteinResult.orfs.length > orfsPerPage && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    {/* Previous Button */}
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {(() => {
                        const totalPages = Math.ceil(proteinResult.orfs.length / orfsPerPage);
                        const pages = [];
                        const maxVisiblePages = 7;

                        if (totalPages <= maxVisiblePages) {
                          for (let i = 1; i <= totalPages; i++) {
                            pages.push(i);
                          }
                        } else {
                          if (currentPage <= 4) {
                            for (let i = 1; i <= 5; i++) pages.push(i);
                            pages.push(-1);
                            pages.push(totalPages);
                          } else if (currentPage >= totalPages - 3) {
                            pages.push(1);
                            pages.push(-1);
                            for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
                          } else {
                            pages.push(1);
                            pages.push(-1);
                            for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                            pages.push(-2);
                            pages.push(totalPages);
                          }
                        }

                        return pages.map((page, idx) => {
                          if (page === -1 || page === -2) {
                            return <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 dark:text-gray-600">...</span>;
                          }
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                                }`}
                            >
                              {page}
                            </button>
                          );
                        });
                      })()}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(Math.ceil(proteinResult.orfs.length / orfsPerPage), p + 1))}
                      disabled={currentPage === Math.ceil(proteinResult.orfs.length / orfsPerPage)}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No ORFs found in the sequence. An ORF requires a start codon (AUG) followed by a stop codon (UAA, UAG, or UGA).
              </div>
            )}
          </div>
        )}

        {/* Codon Visualization Section */}
        {dnaRnaResult && proteinResult && (

          <AminoAcidBarChart rnaSequence={dnaRnaResult.rna_sequence} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProteinFoldGenerationPage;
