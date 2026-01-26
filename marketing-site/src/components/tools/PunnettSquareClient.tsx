"use client";

import React, { useState, useMemo } from "react";
import { TbGrid4X4 } from "react-icons/tb";
import { HiInformationCircle } from "react-icons/hi";

const PunnettSquareClient: React.FC = () => {
    // Parent gametes (editable headers)
    const [topLeft, setTopLeft] = useState("A");
    const [topRight, setTopRight] = useState("a");
    const [leftTop, setLeftTop] = useState("A");
    const [leftBottom, setLeftBottom] = useState("a");

    // Compute the 2x2 grid from parent gametes
    const gridData = useMemo(() => {
        const formatGenotype = (a1: string, a2: string) => {
            return [a1, a2].sort((a, b) => {
                if (a.toUpperCase() === b.toUpperCase()) return a < b ? -1 : 1;
                return a.toUpperCase() < b.toUpperCase() ? -1 : 1;
            }).join("");
        };

        const grid = [
            [formatGenotype(leftTop, topLeft), formatGenotype(leftTop, topRight)],
            [formatGenotype(leftBottom, topLeft), formatGenotype(leftBottom, topRight)],
        ];

        // Count genotypes
        const counts: Record<string, number> = {};
        grid.flat().forEach((g) => {
            counts[g] = (counts[g] || 0) + 1;
        });

        // Determine phenotype (uppercase = dominant)
        const isDominant = (genotype: string) =>
            genotype.split("").some((c) => c === c.toUpperCase() && c !== c.toLowerCase());

        const phenotypeCounts = { dominant: 0, recessive: 0 };
        grid.flat().forEach((g) => {
            if (isDominant(g)) phenotypeCounts.dominant++;
            else phenotypeCounts.recessive++;
        });

        return { grid, counts, phenotypeCounts, isDominant };
    }, [topLeft, topRight, leftTop, leftBottom]);

    const handleInputChange = (
        setter: React.Dispatch<React.SetStateAction<string>>,
        value: string
    ) => {
        const char = value.slice(-1) || "A";
        setter(char);
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-1.5 mb-2">
                        <TbGrid4X4 className="w-4 h-4 text-white" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-white">Free Genetics Tool</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Punnett Square <span className="text-emerald-500 dark:text-emerald-400">Calculator</span>
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Click the headers to edit parent alleles</p>
                </div>

                {/* Main Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-6">

                    {/* Interactive Punnett Square */}
                    <div className="flex justify-center mb-6">
                        <div className="inline-block">
                            {/* Top Row - Parent 2 gametes (Emerald) */}
                            <div className="flex">
                                <div className="w-16 h-16 flex items-center justify-center">
                                    <span className="text-xs text-slate-400 dark:text-slate-500">×</span>
                                </div>
                                <div className="w-16 h-16 flex items-center justify-center">
                                    <input
                                        type="text"
                                        value={topLeft}
                                        onChange={(e) => handleInputChange(setTopLeft, e.target.value)}
                                        className="w-10 h-10 text-center text-xl font-bold rounded-lg bg-emerald-100 dark:bg-emerald-900/50 border-2 border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                                        title="Parent 2 - Allele 1"
                                    />
                                </div>
                                <div className="w-16 h-16 flex items-center justify-center">
                                    <input
                                        type="text"
                                        value={topRight}
                                        onChange={(e) => handleInputChange(setTopRight, e.target.value)}
                                        className="w-10 h-10 text-center text-xl font-bold rounded-lg bg-emerald-100 dark:bg-emerald-900/50 border-2 border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                                        title="Parent 2 - Allele 2"
                                    />
                                </div>
                            </div>

                            {/* Row 1 */}
                            <div className="flex">
                                {/* Parent 1 gametes (Cyan) */}
                                <div className="w-16 h-16 flex items-center justify-center">
                                    <input
                                        type="text"
                                        value={leftTop}
                                        onChange={(e) => handleInputChange(setLeftTop, e.target.value)}
                                        className="w-10 h-10 text-center text-xl font-bold rounded-lg bg-cyan-100 dark:bg-cyan-900/50 border-2 border-cyan-300 dark:border-cyan-600 text-cyan-700 dark:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                                        title="Parent 1 - Allele 1"
                                    />
                                </div>
                                {gridData.grid[0].map((genotype, j) => {
                                    const isDom = gridData.isDominant(genotype);
                                    return (
                                        <div
                                            key={`0-${j}`}
                                            className={`w-16 h-16 flex items-center justify-center text-xl font-bold border-2 transition-all hover:scale-105 ${isDom
                                                ? "bg-teal-100 dark:bg-teal-900/50 border-teal-300 dark:border-teal-600 text-teal-700 dark:text-teal-300"
                                                : "bg-amber-100 dark:bg-amber-900/50 border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300"
                                                }`}
                                        >
                                            {genotype}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Row 2 */}
                            <div className="flex">
                                <div className="w-16 h-16 flex items-center justify-center">
                                    <input
                                        type="text"
                                        value={leftBottom}
                                        onChange={(e) => handleInputChange(setLeftBottom, e.target.value)}
                                        className="w-10 h-10 text-center text-xl font-bold rounded-lg bg-cyan-100 dark:bg-cyan-900/50 border-2 border-cyan-300 dark:border-cyan-600 text-cyan-700 dark:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                                        title="Parent 1 - Allele 2"
                                    />
                                </div>
                                {gridData.grid[1].map((genotype, j) => {
                                    const isDom = gridData.isDominant(genotype);
                                    return (
                                        <div
                                            key={`1-${j}`}
                                            className={`w-16 h-16 flex items-center justify-center text-xl font-bold border-2 transition-all hover:scale-105 ${isDom
                                                ? "bg-teal-100 dark:bg-teal-900/50 border-teal-300 dark:border-teal-600 text-teal-700 dark:text-teal-300"
                                                : "bg-amber-100 dark:bg-amber-900/50 border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300"
                                                }`}
                                        >
                                            {genotype}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Results - Compact horizontal layout */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Genotype Ratios */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Genotype Ratio</h3>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(gridData.counts).map(([genotype, count]) => (
                                    <div
                                        key={genotype}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                                    >
                                        <span className="font-mono font-bold text-slate-900 dark:text-white">{genotype}</span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">: {count}/4</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Phenotype Ratios */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Phenotype Ratio</h3>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                                    <span className="text-sm text-slate-700 dark:text-slate-300">Dominant:</span>
                                    <span className="font-bold text-slate-900 dark:text-white">{gridData.phenotypeCounts.dominant}/4</span>
                                    <span className="text-xs text-slate-500">({(gridData.phenotypeCounts.dominant / 4 * 100)}%)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                    <span className="text-sm text-slate-700 dark:text-slate-300">Recessive:</span>
                                    <span className="font-bold text-slate-900 dark:text-white">{gridData.phenotypeCounts.recessive}/4</span>
                                    <span className="text-xs text-slate-500">({(gridData.phenotypeCounts.recessive / 4 * 100)}%)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="mt-4 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-3">
                        <HiInformationCircle className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                        <p>
                            <strong>Tip:</strong> Click any header cell to change the allele. Uppercase letters = dominant alleles, lowercase = recessive.
                            The grid auto-computes offspring genotypes.
                        </p>
                    </div>
                </div>

                {/* Legend */}
                <div className="mt-4 flex justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded bg-cyan-100 dark:bg-cyan-900/50 border border-cyan-300 dark:border-cyan-600"></div>
                        <span>Parent 1</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-600"></div>
                        <span>Parent 2</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded bg-teal-100 dark:bg-teal-900/50 border border-teal-300 dark:border-teal-600"></div>
                        <span>Dominant</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded bg-amber-100 dark:bg-amber-900/50 border border-amber-300 dark:border-amber-600"></div>
                        <span>Recessive</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PunnettSquareClient;
