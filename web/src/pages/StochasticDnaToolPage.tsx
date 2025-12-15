import React, { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { generateDna, type DnaGenerateResponse } from "../services/dnaGenerator.api";
import useDocumentTitle from "../hooks/useDocumentTitle";

const StochasticDnaToolPage: React.FC = () => {
  useDocumentTitle("Stochastic DNA Tool");

  const [length, setLength] = useState<number>(100);
  const [gcContent, setGcContent] = useState<number>(0.5);
  const [seed, setSeed] = useState<string>("");
  const [useRandomSeed, setUseRandomSeed] = useState<boolean>(true);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DnaGenerateResponse | null>(null);

  const handleGenerate = async () => {
    setError(null);
    setLoading(true);

    try {
      const payload = {
        length,
        gc_content: gcContent,
        ...(useRandomSeed ? {} : { seed: parseInt(seed) || undefined }),
      };

      const response = await generateDna(payload);
      setResult(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to generate DNA sequence");
    } finally {
      setLoading(false);
    }
  };

  const formatSequence = (sequence: string, lineLength: number = 80) => {
    const lines = [];
    for (let i = 0; i < sequence.length; i += lineLength) {
      lines.push(sequence.substring(i, i + lineLength));
    }
    return lines.join("\n");
  };

  const handleCopySequence = () => {
    if (result?.sequence) {
      navigator.clipboard.writeText(result.sequence);
    }
  };

  const handleDownloadFasta = () => {
    if (result?.sequence) {
      const fasta = `>Stochastic_DNA_Length_${result.length}_GC_${(result.gc_content * 100).toFixed(1)}\n${formatSequence(result.sequence)}`;
      const blob = new Blob([fasta], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dna_sequence_${result.length}bp_gc${(result.gc_content * 100).toFixed(0)}.fasta`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Stochastic DNA Sequence Generator
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Generate random DNA sequences with customizable length and GC content for testing,
            simulations, and bioinformatics applications.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 mb-6 border border-transparent dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Generation Parameters
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sequence Length (bp)
              </label>
              <input
                type="number"
                min="1"
                max="1000000"
                value={length}
                onChange={(e) => setLength(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Enter sequence length"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Range: 1 - 1,000,000 base pairs
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
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Enter seed for reproducible results"
                />
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Use a specific seed for reproducible sequence generation
              </p>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || length < 1 || gcContent < 0 || gcContent > 1}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? "Generating..." : "Generate DNA Sequence"}
            </button>
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

        {result && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 border border-transparent dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Generated Sequence
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handleCopySequence}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm font-medium"
                >
                  Copy Sequence
                </button>
                <button
                  onClick={handleDownloadFasta}
                  className="px-4 py-2 bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-800/50 text-blue-700 dark:text-blue-400 rounded-lg transition-colors text-sm font-medium"
                >
                  Download FASTA
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-transparent dark:border-gray-700">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Length</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {result.length.toLocaleString()} bp
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Target GC Content</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {(result.gc_content * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Actual GC Content</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {(result.actual_gc * 100).toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">AT Content</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {((1 - result.actual_gc) * 100).toFixed(2)}%
                </p>
              </div>
            </div>

            <div className="bg-gray-900 dark:bg-black rounded-lg p-4 overflow-x-auto border border-gray-800">
              <pre className="text-xs text-green-400 font-mono leading-relaxed whitespace-pre-wrap break-all">
                {formatSequence(result.sequence)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StochasticDnaToolPage;
