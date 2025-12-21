import React, { useState, useEffect, useMemo } from 'react';
import { Download, RotateCw, Search, Scissors, Copy, FileText, Dna, Calculator } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import SequenceDnaStrand from '../components/dna-editor/SequenceDnaStrand';
import SequenceMrnaStrand from '../components/dna-editor/SequenceMrnaStrand';
import useDocumentTitle from '../hooks/useDocumentTitle';

interface RestrictionSite {
  enzyme: string;
  sequence: string;
  positions: number[];
}

const CODON_TABLE: Record<string, string> = {
  'TTT': 'F', 'TTC': 'F', 'TTA': 'L', 'TTG': 'L',
  'TCT': 'S', 'TCC': 'S', 'TCA': 'S', 'TCG': 'S',
  'TAT': 'Y', 'TAC': 'Y', 'TAA': '*', 'TAG': '*',
  'TGT': 'C', 'TGC': 'C', 'TGA': '*', 'TGG': 'W',
  'CTT': 'L', 'CTC': 'L', 'CTA': 'L', 'CTG': 'L',
  'CCT': 'P', 'CCC': 'P', 'CCA': 'P', 'CCG': 'P',
  'CAT': 'H', 'CAC': 'H', 'CAA': 'Q', 'CAG': 'Q',
  'CGT': 'R', 'CGC': 'R', 'CGA': 'R', 'CGG': 'R',
  'ATT': 'I', 'ATC': 'I', 'ATA': 'I', 'ATG': 'M',
  'ACT': 'T', 'ACC': 'T', 'ACA': 'T', 'ACG': 'T',
  'AAT': 'N', 'AAC': 'N', 'AAA': 'K', 'AAG': 'K',
  'AGT': 'S', 'AGC': 'S', 'AGA': 'R', 'AGG': 'R',
  'GTT': 'V', 'GTC': 'V', 'GTA': 'V', 'GTG': 'V',
  'GCT': 'A', 'GCC': 'A', 'GCA': 'A', 'GCG': 'A',
  'GAT': 'D', 'GAC': 'D', 'GAA': 'E', 'GAG': 'E',
  'GGT': 'G', 'GGC': 'G', 'GGA': 'G', 'GGG': 'G',
};

const COMMON_RESTRICTION_ENZYMES = [
  { enzyme: 'EcoRI', sequence: 'GAATTC' },
  { enzyme: 'BamHI', sequence: 'GGATCC' },
  { enzyme: 'HindIII', sequence: 'AAGCTT' },
  { enzyme: 'PstI', sequence: 'CTGCAG' },
  { enzyme: 'SmaI', sequence: 'CCCGGG' },
  { enzyme: 'KpnI', sequence: 'GGTACC' },
  { enzyme: 'SacI', sequence: 'GAGCTC' },
  { enzyme: 'XbaI', sequence: 'TCTAGA' },
  { enzyme: 'NotI', sequence: 'GCGGCCGC' },
  { enzyme: 'XhoI', sequence: 'CTCGAG' },
];

// Removed static DNA helix visualization - now using dynamic SequenceDnaStrand component

const DnaEditorPage: React.FC = () => {
  useDocumentTitle('DNA Editor');

  const [sequence, setSequence] = useState<string>('');
  const [sequenceName, setSequenceName] = useState<string>('Untitled Sequence');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [replaceTerm, setReplaceTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'editor' | 'analysis' | 'translation' | 'restrictions'>('editor');
  const [showLineNumbers, setShowLineNumbers] = useState<boolean>(true);
  const [basesPerLine, setBasesPerLine] = useState<number>(60);
  const [translationFrame, setTranslationFrame] = useState<number>(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [visualizationType, setVisualizationType] = useState<'dna' | 'mrna'>('dna');

  // Validate DNA sequence
  useEffect(() => {
    const errors: string[] = [];
    const invalidChars = sequence.match(/[^ATGCatgcNnRrYyMmKkSsWwBbDdHhVv\s]/g);
    if (invalidChars) {
      errors.push(`Invalid nucleotides found: ${[...new Set(invalidChars)].join(', ')}`);
    }
    setValidationErrors(errors);
  }, [sequence]);

  // Calculate sequence statistics
  const stats = useMemo(() => {
    const cleanSeq = sequence.replace(/\s/g, '').toUpperCase();
    const length = cleanSeq.length;
    const aCount = (cleanSeq.match(/A/g) || []).length;
    const tCount = (cleanSeq.match(/T/g) || []).length;
    const gCount = (cleanSeq.match(/G/g) || []).length;
    const cCount = (cleanSeq.match(/C/g) || []).length;
    const gcContent = length > 0 ? ((gCount + cCount) / length) * 100 : 0;
    const atContent = length > 0 ? ((aCount + tCount) / length) * 100 : 0;

    return { length, aCount, tCount, gCount, cCount, gcContent, atContent };
  }, [sequence]);

  // Get reverse complement
  const getReverseComplement = (seq: string): string => {
    const complement: Record<string, string> = {
      'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G',
      'a': 't', 't': 'a', 'g': 'c', 'c': 'g',
      'N': 'N', 'n': 'n'
    };
    return seq.split('').reverse().map(base => complement[base] || base).join('');
  };

  // Translate DNA to protein
  const translateSequence = (seq: string, frame: number): string => {
    const cleanSeq = seq.replace(/\s/g, '').toUpperCase().substring(frame);
    let protein = '';

    for (let i = 0; i < cleanSeq.length - 2; i += 3) {
      const codon = cleanSeq.substring(i, i + 3);
      if (codon.length === 3) {
        protein += CODON_TABLE[codon] || 'X';
      }
    }

    return protein;
  };

  // Find restriction sites
  const findRestrictionSites = (): RestrictionSite[] => {
    const cleanSeq = sequence.replace(/\s/g, '').toUpperCase();
    const sites: RestrictionSite[] = [];

    COMMON_RESTRICTION_ENZYMES.forEach(({ enzyme, sequence: enzSeq }) => {
      const positions: number[] = [];
      let index = cleanSeq.indexOf(enzSeq);

      while (index !== -1) {
        positions.push(index);
        index = cleanSeq.indexOf(enzSeq, index + 1);
      }

      if (positions.length > 0) {
        sites.push({ enzyme, sequence: enzSeq, positions });
      }
    });

    return sites.sort((a, b) => a.positions[0] - b.positions[0]);
  };

  // Find ORFs (Open Reading Frames)
  const findORFs = (): Array<{ start: number; end: number; frame: number; length: number }> => {
    const cleanSeq = sequence.replace(/\s/g, '').toUpperCase();
    const orfs: Array<{ start: number; end: number; frame: number; length: number }> = [];
    const startCodon = 'ATG';
    const stopCodons = ['TAA', 'TAG', 'TGA'];

    // Check all three reading frames
    for (let frame = 0; frame < 3; frame++) {
      let i = frame;
      while (i < cleanSeq.length - 2) {
        if (cleanSeq.substring(i, i + 3) === startCodon) {
          const start = i;
          let j = i + 3;

          while (j < cleanSeq.length - 2) {
            const codon = cleanSeq.substring(j, j + 3);
            if (stopCodons.includes(codon)) {
              const length = j - start + 3;
              if (length >= 300) { // Only report ORFs >= 100 amino acids (300 nucleotides)
                orfs.push({ start, end: j + 3, frame, length });
              }
              break;
            }
            j += 3;
          }
          i = j;
        }
        i += 3;
      }
    }

    return orfs.sort((a, b) => b.length - a.length);
  };

  // Format sequence with line numbers
  const formatSequenceForDisplay = (): React.ReactNode[] => {
    const cleanSeq = sequence.replace(/\s/g, '').toUpperCase();
    const lines: React.ReactNode[] = [];

    for (let i = 0; i < cleanSeq.length; i += basesPerLine) {
      const lineSeq = cleanSeq.substring(i, i + basesPerLine);
      const lineNumber = i + 1;

      lines.push(
        <div key={i} className="flex font-mono text-sm">
          {showLineNumbers && (
            <span className="text-gray-500 dark:text-gray-400 mr-4 select-none w-16 text-right">
              {lineNumber}
            </span>
          )}
          <span className="tracking-wider">{lineSeq}</span>
        </div>
      );
    }

    return lines;
  };

  // Handle sequence operations
  const handleReverseComplement = () => {
    setSequence(getReverseComplement(sequence));
  };

  const handleToUpperCase = () => {
    setSequence(sequence.toUpperCase());
  };

  const handleToLowerCase = () => {
    setSequence(sequence.toLowerCase());
  };

  const handleFindReplace = () => {
    if (searchTerm) {
      const cleanSeq = sequence.replace(/\s/g, '');
      const regex = new RegExp(searchTerm, 'gi');
      const newSeq = cleanSeq.replace(regex, replaceTerm);
      setSequence(newSeq);
    }
  };

  const handleCopySequence = () => {
    const cleanSeq = sequence.replace(/\s/g, '');
    navigator.clipboard.writeText(cleanSeq);
  };

  const handleExportFasta = () => {
    const cleanSeq = sequence.replace(/\s/g, '');
    const fastaContent = `>${sequenceName}\n${cleanSeq.match(/.{1,60}/g)?.join('\n') || ''}`;

    const blob = new Blob([fastaContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sequenceName.replace(/\s/g, '_')}.fasta`;
    a.click();
    URL.revokeObjectURL(url);
  };



  const restrictionSites = useMemo(() => findRestrictionSites(), [sequence]);
  const orfs = useMemo(() => findORFs(), [sequence]);

  return (
    <DashboardLayout>
      <div className="absolute inset-0 flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        {/* Top Header Bar */}
        <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-4 py-3">
          <div className="flex items-center justify-between gap-4 max-w-full">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex-shrink-0">
                <Dna className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent truncate">
                  DNA Sequence Editor
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400 hidden sm:block">
                  Advanced molecular biology sequence analysis tool
                </p>
              </div>
            </div>

            {/* Quick Stats in Header */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm px-3 py-1.5 text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">Length</div>
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{stats.length.toLocaleString()} bp</div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm px-3 py-1.5 text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">GC</div>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{stats.gcContent.toFixed(1)}%</div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm px-3 py-1.5 text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">AT</div>
                <div className="text-sm font-bold text-blue-600 dark:text-blue-400">{stats.atContent.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area - Split Layout */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* LEFT SIDE - Controls & Editor */}
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden border-r border-slate-200 dark:border-slate-700">
            {/* Sequence Name Input */}
            <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-3">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Sequence:
                </label>
                <input
                  type="text"
                  value={sequenceName}
                  onChange={(e) => setSequenceName(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent"
                  placeholder="Enter sequence name..."
                />
              </div>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="flex-shrink-0 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-4 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-red-600 dark:text-red-400 font-medium">⚠</span>
                  <span className="text-red-700 dark:text-red-300">{validationErrors[0]}</span>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <div className="flex gap-1 p-2 overflow-x-auto">
                {[
                  { id: 'editor' as const, label: 'Editor', icon: FileText },
                  { id: 'analysis' as const, label: 'Analysis', icon: Calculator },
                  { id: 'translation' as const, label: 'Translation', icon: Dna },
                  { id: 'restrictions' as const, label: 'Restrictions', icon: Scissors },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${activeTab === tab.id
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'editor' && (
                <div className="space-y-4">
                  {/* Toolbar */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleReverseComplement}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      Rev. Comp.
                    </button>
                    <button
                      onClick={handleToUpperCase}
                      className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                    >
                      UPPER
                    </button>
                    <button
                      onClick={handleToLowerCase}
                      className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                    >
                      lower
                    </button>
                    <button
                      onClick={handleCopySequence}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </button>
                    <button
                      onClick={handleExportFasta}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      FASTA
                    </button>
                  </div>

                  {/* Find/Replace */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Find sequence..."
                      className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={replaceTerm}
                      onChange={(e) => setReplaceTerm(e.target.value)}
                      placeholder="Replace with..."
                      className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleFindReplace}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-colors text-sm"
                    >
                      <Search className="w-3.5 h-3.5" />
                      Replace
                    </button>
                  </div>

                  {/* Display Options */}
                  <div className="flex items-center gap-4 text-xs">
                    <label className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={showLineNumbers}
                        onChange={(e) => setShowLineNumbers(e.target.checked)}
                        className="rounded border-gray-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500"
                      />
                      Line #
                    </label>
                    <label className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                      Per line:
                      <select
                        value={basesPerLine}
                        onChange={(e) => setBasesPerLine(Number(e.target.value))}
                        className="px-2 py-1 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-xs"
                      >
                        <option value={30}>30</option>
                        <option value={60}>60</option>
                        <option value={90}>90</option>
                      </select>
                    </label>
                  </div>

                  {/* Sequence Editor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      DNA Sequence
                    </label>
                    <textarea
                      value={sequence}
                      onChange={(e) => setSequence(e.target.value)}
                      className="w-full h-40 px-3 py-2 font-mono text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                      placeholder="Paste or type DNA sequence here (A, T, G, C)..."
                    />
                  </div>

                  {/* Formatted Display */}
                  {sequence && (
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 max-h-48 overflow-auto">
                      <div className="text-gray-900 dark:text-gray-100 text-xs">
                        {formatSequenceForDisplay()}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'analysis' && (
                <div className="space-y-6">
                  {/* Nucleotide Composition */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      Nucleotide Composition
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Adenine (A)', count: stats.aCount, color: 'bg-yellow-500' },
                        { label: 'Thymine (T)', count: stats.tCount, color: 'bg-red-500' },
                        { label: 'Guanine (G)', count: stats.gCount, color: 'bg-purple-500' },
                        { label: 'Cytosine (C)', count: stats.cCount, color: 'bg-cyan-500' },
                      ].map((base) => (
                        <div key={base.label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-700 dark:text-gray-300">{base.label}</span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {stats.length > 0 ? ((base.count / stats.length) * 100).toFixed(1) : 0}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${base.color}`}
                              style={{ width: `${stats.length > 0 ? (base.count / stats.length) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ORF Analysis */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      Open Reading Frames (ORFs ≥ 100 aa)
                    </h3>
                    {orfs.length > 0 ? (
                      <div className="space-y-2">
                        {orfs.map((orf, idx) => (
                          <div
                            key={idx}
                            className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2"
                          >
                            <div className="font-semibold text-emerald-900 dark:text-emerald-100 text-sm">
                              ORF {idx + 1} (Frame +{orf.frame + 1})
                            </div>
                            <div className="text-xs text-emerald-700 dark:text-emerald-300">
                              {orf.start + 1} - {orf.end} ({orf.length} bp, {Math.floor(orf.length / 3)} aa)
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        No ORFs found ≥ 100 amino acids
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'translation' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Reading Frame:
                    </label>
                    <div className="flex gap-1">
                      {[0, 1, 2].map((frame) => (
                        <button
                          key={frame}
                          onClick={() => setTranslationFrame(frame)}
                          className={`px-3 py-1 text-xs rounded-lg transition-colors ${translationFrame === frame
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                            }`}
                        >
                          +{frame + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  {sequence && (
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          DNA Sequence (5' → 3')
                        </h4>
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-2 font-mono text-xs text-gray-900 dark:text-gray-100 max-h-24 overflow-auto break-all">
                          {sequence.replace(/\s/g, '').toUpperCase()}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Protein Translation (Frame +{translationFrame + 1})
                        </h4>
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2 font-mono text-xs text-emerald-900 dark:text-emerald-100 max-h-24 overflow-auto break-all">
                          {translateSequence(sequence, translationFrame) || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Length: {translateSequence(sequence, translationFrame).length} amino acids
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'restrictions' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Restriction Enzyme Sites
                  </h3>
                  {restrictionSites.length > 0 ? (
                    <div className="space-y-2">
                      {restrictionSites.map((site, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{site.enzyme}</span>
                              <span className="ml-2 font-mono text-xs text-emerald-600 dark:text-emerald-400">{site.sequence}</span>
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {site.positions.length} site{site.positions.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Positions: {site.positions.map(p => p + 1).slice(0, 10).join(', ')}{site.positions.length > 10 ? '...' : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      No common restriction enzyme sites found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE - DNA/mRNA Visualization */}
          <div className="hidden lg:flex w-80 xl:w-96 flex-col min-h-0 bg-gradient-to-br from-white to-emerald-50/50 dark:from-slate-800 dark:to-emerald-900/10">
            {/* Header with Toggle */}
            <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 px-3 py-2">
              {/* DNA/mRNA Toggle Tabs */}
              <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg mb-2">
                <button
                  onClick={() => setVisualizationType('dna')}
                  className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${visualizationType === 'dna'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                >
                  🧬 DNA
                </button>
                <button
                  onClick={() => setVisualizationType('mrna')}
                  className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${visualizationType === 'mrna'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                >
                  📜 mRNA
                </button>
              </div>

              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 text-center">
                {sequence
                  ? (visualizationType === 'dna' ? 'Your DNA Sequence' : 'Transcribed mRNA')
                  : (visualizationType === 'dna' ? 'DNA Double Helix' : 'mRNA Single Strand')
                }
              </h3>
              {sequence && (
                <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-0.5">
                  {sequence.replace(/\s/g, '').length.toLocaleString()} {visualizationType === 'dna' ? 'base pairs' : 'nucleotides'}
                </p>
              )}
            </div>

            {/* Strand Visualization - Scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 scrollbar-thin scrollbar-thumb-emerald-300 dark:scrollbar-thumb-emerald-700 scrollbar-track-transparent hover:scrollbar-thumb-emerald-400 dark:hover:scrollbar-thumb-emerald-600">
              <div className="min-h-full">
                {visualizationType === 'dna' ? (
                  <SequenceDnaStrand sequence={sequence} />
                ) : (
                  <SequenceMrnaStrand sequence={sequence} />
                )}
              </div>
            </div>

            {/* Stats Summary */}
            <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 p-3">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{stats.aCount}</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">A</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {visualizationType === 'dna' ? stats.tCount : stats.tCount}
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">
                    {visualizationType === 'dna' ? 'T' : 'U'}
                  </div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{stats.gCount}</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">G</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-cyan-600 dark:text-cyan-400">{stats.cCount}</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">C</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DnaEditorPage;
