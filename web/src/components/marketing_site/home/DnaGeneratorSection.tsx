import React, { useState } from "react";
import { GiDna2 } from "react-icons/gi";
import { HiDownload, HiClipboardCopy, HiRefresh } from "react-icons/hi";
import { generateDnaAndRna, type ProteinGenerateResponse } from "../../../services/proteinGenerator.api";

const DnaGeneratorSection: React.FC = () => {
  const [length, setLength] = useState<number>(999);
  const [gcContent, setGcContent] = useState<number>(0.5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProteinGenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"dna" | "rna" | null>(null);

  const isLargeSequence = length > 10000000;
  const displayResult = result && result.length <= 10000000;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await generateDnaAndRna({
        length,
        gc_content: gcContent,
      });
      setResult(response);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: unknown } }; message?: string };
      const detail = axiosError.response?.data?.detail;
      if (typeof detail === "string") {
        setError(detail);
      } else if (Array.isArray(detail) && detail.length > 0) {
        const firstError = detail[0] as { msg?: string };
        setError(firstError?.msg || "Failed to generate sequence");
      } else {
        setError(axiosError.message || "Failed to generate sequence");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (sequence: string, type: "dna" | "rna") => {
    const blob = new Blob([sequence], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${type}_sequence_${result?.length || length}bp.txt`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopy = (sequence: string, type: "dna" | "rna") => {
    navigator.clipboard.writeText(sequence);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <section className="relative bg-gradient-to-br from-purple-50 via-indigo-50/30 to-blue-50/20 dark:from-slate-900 dark:via-purple-950/30 dark:to-slate-950 py-24 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-purple-500/10 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-500 dark:to-blue-500 px-5 py-2 mb-6">
            <GiDna2 className="w-5 h-5 text-white animate-spin" style={{ animationDuration: "3s" }} />
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-white">
              DNA Generator
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 dark:from-purple-400 dark:via-indigo-400 dark:to-blue-400 mb-6">
            Generate DNA Sequences
          </h2>

          <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
            Create random DNA sequences with customizable GC content. Our high-performance C++ engine
            can generate sequences up to 10 million base pairs in seconds.
          </p>
        </div>

        {/* Generator Card */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-2xl shadow-purple-200/40 dark:shadow-purple-950/40">

            {!result ? (
              <>
                {/* Input Controls */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {/* Length Input */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Sequence Length (bp)
                    </label>
                    <input
                      type="number"
                      min={3}
                      max={10000000}
                      step={3}
                      value={length}
                      onChange={(e) => setLength(Math.max(3, parseInt(e.target.value) || 3))}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-lg"
                      disabled={loading}
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Range: 3 - 10,000,000 bp
                    </p>
                    {isLargeSequence && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        ⚠️ Sequences over 10M bp will be download-only
                      </p>
                    )}
                  </div>

                  {/* GC Content Slider */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      GC Content: {(gcContent * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={gcContent}
                      onChange={(e) => setGcContent(parseFloat(e.target.value))}
                      className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                      disabled={loading}
                    />
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span>0% (AT-rich)</span>
                      <span>50%</span>
                      <span>100% (GC-rich)</span>
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Generating {(length / 1000000).toFixed(length >= 1000000 ? 1 : 3)}M bp...</span>
                    </>
                  ) : (
                    <>
                      <GiDna2 className="w-6 h-6" />
                      <span>Generate DNA Sequence</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                {/* Results */}
                <div className="space-y-6">
                  {/* Stats Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-100 dark:bg-slate-900/50 rounded-xl">
                    <div className="flex items-center gap-6">
                      <div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Length</span>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{result.length.toLocaleString()} bp</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Actual GC</span>
                        <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{(result.actual_gc * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                    <button
                      onClick={handleReset}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                    >
                      <HiRefresh className="w-4 h-4" />
                      <span>Reset</span>
                    </button>
                  </div>

                  {/* DNA Sequence */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                        DNA Sequence
                      </h3>
                      <div className="flex gap-2">
                        {displayResult && (
                          <button
                            onClick={() => handleCopy(result.dna_sequence, "dna")}
                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm transition-colors"
                          >
                            <HiClipboardCopy className="w-4 h-4" />
                            {copied === "dna" ? "Copied!" : "Copy"}
                          </button>
                        )}
                        <button
                          onClick={() => handleDownload(result.dna_sequence, "dna")}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                        >
                          <HiDownload className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    </div>
                    {displayResult ? (
                      <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-4 max-h-40 overflow-auto">
                        <code className="text-sm text-blue-600 dark:text-blue-400 font-mono break-all leading-relaxed">
                          {result.dna_sequence}
                        </code>
                      </div>
                    ) : (
                      <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-8 text-center">
                        <div className="text-4xl mb-2">🧬</div>
                        <p className="text-slate-600 dark:text-slate-400">Sequence too large to display</p>
                        <p className="text-sm text-slate-500 dark:text-slate-500">Click Download to save as .txt file</p>
                      </div>
                    )}
                  </div>

                  {/* RNA Sequence */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                        RNA Sequence (Transcribed)
                      </h3>
                      <div className="flex gap-2">
                        {displayResult && (
                          <button
                            onClick={() => handleCopy(result.rna_sequence, "rna")}
                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm transition-colors"
                          >
                            <HiClipboardCopy className="w-4 h-4" />
                            {copied === "rna" ? "Copied!" : "Copy"}
                          </button>
                        )}
                        <button
                          onClick={() => handleDownload(result.rna_sequence, "rna")}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                        >
                          <HiDownload className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    </div>
                    {displayResult ? (
                      <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-4 max-h-40 overflow-auto">
                        <code className="text-sm text-green-600 dark:text-green-400 font-mono break-all leading-relaxed">
                          {result.rna_sequence}
                        </code>
                      </div>
                    ) : (
                      <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-8 text-center">
                        <div className="text-4xl mb-2">🧬</div>
                        <p className="text-slate-600 dark:text-slate-400">Sequence too large to display</p>
                        <p className="text-sm text-slate-500 dark:text-slate-500">Click Download to save as .txt file</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Info Text */}
          <div className="text-center mt-6 space-y-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Powered by our high-performance C++ engine • No account required • 100% free
            </p>
            <a
              href="/dna-generator"
              className="inline-flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
            >
              Open full page tool →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DnaGeneratorSection;
