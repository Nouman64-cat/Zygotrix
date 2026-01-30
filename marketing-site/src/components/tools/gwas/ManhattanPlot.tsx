import React, { useState, useMemo } from 'react';

interface ChromosomeData {
    chr: number;
    positions: number[];
    p_values: number[];
    labels: string[];
}

interface ManhattanPlotProps {
    data: {
        chromosomes: ChromosomeData[];
    };
}

// Standard GWAS significance thresholds
const GENOME_WIDE_SIG = 5e-8;
const SUGGESTIVE_SIG = 1e-5;

export const ManhattanPlot: React.FC<ManhattanPlotProps> = ({ data }) => {
    const [hoveredPoint, setHoveredPoint] = useState<{
        rsid: string;
        chr: number;
        pos: number;
        pValue: number;
        beta: number;
        x: number;
        y: number;
    } | null>(null);

    // Plot dimensions
    const width = 1000;
    const height = 400;
    const margin = { top: 20, right: 80, bottom: 60, left: 60 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    // Calculate cumulative positions for chromosome layout
    const { chromosomeRanges, maxNegLogP, totalWidth, processedData } = useMemo(() => {
        let cumulativePosition = 0;
        const ranges: Array<{ chr: number; start: number; end: number; midpoint: number }> = [];
        let maxP = 0;

        // Process data with calculated -log10(p) values
        const processed = data.chromosomes.map(chrData => {
            const neg_log_p = chrData.p_values.map(p => p > 0 ? -Math.log10(p) : 50);
            return { ...chrData, neg_log_p };
        });

        processed.forEach(chrData => {
            const chrStart = cumulativePosition;
            const chrWidth = chrData.positions.length > 0
                ? Math.max(...chrData.positions) - Math.min(...chrData.positions)
                : 100000;
            cumulativePosition += chrWidth;

            ranges.push({
                chr: chrData.chr,
                start: chrStart,
                end: cumulativePosition,
                midpoint: chrStart + chrWidth / 2
            });

            maxP = Math.max(maxP, ...chrData.neg_log_p);
        });

        return {
            chromosomeRanges: ranges,
            maxNegLogP: Math.ceil(maxP) || 10,
            totalWidth: cumulativePosition || 1,
            processedData: processed
        };
    }, [data.chromosomes]);

    // Significance thresholds
    const genomeWideSigNegLog = -Math.log10(GENOME_WIDE_SIG);
    const suggestiveSigNegLog = -Math.log10(SUGGESTIVE_SIG);

    // Colors for alternating chromosomes
    const getChromosomeColor = (chr: number, pValue: number) => {
        const isSignificant = pValue < GENOME_WIDE_SIG;
        if (isSignificant) {
            return '#DC2626'; // red-600
        }
        return chr % 2 === 0 ? '#10B981' : '#94A3B8'; // emerald-500 : slate-400
    };

    return (
        <div className="relative">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 overflow-x-auto">
                <svg width={width} height={height} className="mx-auto block">
                    {/* Background */}
                    <rect
                        x={margin.left}
                        y={margin.top}
                        width={plotWidth}
                        height={plotHeight}
                        fill="transparent"
                    />

                    {/* Chromosome backgrounds */}
                    {chromosomeRanges.map((range, idx) => (
                        <rect
                            key={range.chr}
                            x={margin.left + (range.start / totalWidth) * plotWidth}
                            y={margin.top}
                            width={((range.end - range.start) / totalWidth) * plotWidth}
                            height={plotHeight}
                            fill={idx % 2 === 0 ? 'rgba(156, 163, 175, 0.1)' : 'transparent'}
                        />
                    ))}

                    {/* Grid lines */}
                    {[...Array(6)].map((_, i) => {
                        const y = margin.top + (i / 5) * plotHeight;
                        return (
                            <line
                                key={i}
                                x1={margin.left}
                                y1={y}
                                x2={margin.left + plotWidth}
                                y2={y}
                                stroke="currentColor"
                                strokeWidth="0.5"
                                className="text-gray-300 dark:text-gray-600"
                                strokeDasharray="2,2"
                            />
                        );
                    })}

                    {/* Significance threshold lines */}
                    <line
                        x1={margin.left}
                        y1={margin.top + plotHeight - (genomeWideSigNegLog / maxNegLogP) * plotHeight}
                        x2={margin.left + plotWidth}
                        y2={margin.top + plotHeight - (genomeWideSigNegLog / maxNegLogP) * plotHeight}
                        stroke="#DC2626"
                        strokeWidth="1.5"
                        strokeDasharray="4,4"
                    />
                    <line
                        x1={margin.left}
                        y1={margin.top + plotHeight - (suggestiveSigNegLog / maxNegLogP) * plotHeight}
                        x2={margin.left + plotWidth}
                        y2={margin.top + plotHeight - (suggestiveSigNegLog / maxNegLogP) * plotHeight}
                        stroke="#F59E0B"
                        strokeWidth="1.5"
                        strokeDasharray="4,4"
                    />

                    {/* Data points */}
                    {processedData.map((chrData) => {
                        const chrRange = chromosomeRanges.find(r => r.chr === chrData.chr);
                        if (!chrRange) return null;

                        return chrData.positions.map((pos, idx) => {
                            const minPos = Math.min(...chrData.positions);
                            const relativePos = pos - minPos;
                            const x = margin.left + ((chrRange.start + relativePos) / totalWidth) * plotWidth;
                            const y = margin.top + plotHeight - (chrData.neg_log_p[idx] / maxNegLogP) * plotHeight;
                            const color = getChromosomeColor(chrData.chr, chrData.p_values[idx]);

                            return (
                                <circle
                                    key={`${chrData.chr}-${idx}`}
                                    cx={x}
                                    cy={y}
                                    r="2.5"
                                    fill={color}
                                    opacity="0.7"
                                    className="hover:opacity-100 cursor-pointer transition-opacity"
                                    onMouseEnter={() => setHoveredPoint({
                                        rsid: chrData.labels[idx] || `SNP-${idx}`,
                                        chr: chrData.chr,
                                        pos: pos,
                                        pValue: chrData.p_values[idx],
                                        beta: 0,
                                        x,
                                        y
                                    })}
                                    onMouseLeave={() => setHoveredPoint(null)}
                                />
                            );
                        });
                    })}

                    {/* X-axis */}
                    <line
                        x1={margin.left}
                        y1={margin.top + plotHeight}
                        x2={margin.left + plotWidth}
                        y2={margin.top + plotHeight}
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-gray-600 dark:text-gray-400"
                    />

                    {/* X-axis labels (chromosome numbers) */}
                    {chromosomeRanges.map((range) => (
                        <text
                            key={range.chr}
                            x={margin.left + (range.midpoint / totalWidth) * plotWidth}
                            y={height - margin.bottom + 25}
                            textAnchor="middle"
                            fontSize="12"
                            className="fill-gray-600 dark:fill-gray-400"
                        >
                            {range.chr}
                        </text>
                    ))}

                    <text
                        x={width / 2}
                        y={height - 5}
                        textAnchor="middle"
                        fontSize="14"
                        className="fill-gray-700 dark:fill-gray-300 font-medium"
                    >
                        Chromosome
                    </text>

                    {/* Y-axis */}
                    <line
                        x1={margin.left}
                        y1={margin.top}
                        x2={margin.left}
                        y2={margin.top + plotHeight}
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-gray-600 dark:text-gray-400"
                    />

                    {/* Y-axis labels */}
                    {[...Array(6)].map((_, i) => {
                        const value = (i / 5) * maxNegLogP;
                        const y = margin.top + plotHeight - (i / 5) * plotHeight;
                        return (
                            <text
                                key={i}
                                x={margin.left - 10}
                                y={y + 4}
                                textAnchor="end"
                                fontSize="12"
                                className="fill-gray-600 dark:fill-gray-400"
                            >
                                {value.toFixed(0)}
                            </text>
                        );
                    })}

                    <text
                        x={15}
                        y={height / 2}
                        textAnchor="middle"
                        fontSize="14"
                        transform={`rotate(-90, 15, ${height / 2})`}
                        className="fill-gray-700 dark:fill-gray-300 font-medium"
                    >
                        -log₁₀(P)
                    </text>

                    {/* Legend */}
                    <g transform={`translate(${width - margin.right + 10}, ${margin.top})`}>
                        <text fontSize="11" className="fill-gray-700 dark:fill-gray-300 font-medium">
                            Significance
                        </text>
                        <line
                            x1="0"
                            y1="20"
                            x2="20"
                            y2="20"
                            stroke="#DC2626"
                            strokeWidth="2"
                            strokeDasharray="4,4"
                        />
                        <text x="25" y="24" fontSize="10" className="fill-gray-600 dark:fill-gray-400">
                            Genome-wide
                        </text>
                        <line
                            x1="0"
                            y1="40"
                            x2="20"
                            y2="40"
                            stroke="#F59E0B"
                            strokeWidth="2"
                            strokeDasharray="4,4"
                        />
                        <text x="25" y="44" fontSize="10" className="fill-gray-600 dark:fill-gray-400">
                            Suggestive
                        </text>
                    </g>
                </svg>

                {/* Tooltip */}
                {hoveredPoint && (
                    <div
                        className="absolute pointer-events-none bg-gray-900 dark:bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg text-xs"
                        style={{
                            left: `${hoveredPoint.x + 10}px`,
                            top: `${hoveredPoint.y - 60}px`,
                        }}
                    >
                        <div className="font-semibold">{hoveredPoint.rsid}</div>
                        <div className="text-gray-300 dark:text-gray-400 mt-1 space-y-0.5">
                            <div>Chr {hoveredPoint.chr}:{hoveredPoint.pos.toLocaleString()}</div>
                            <div>P = {hoveredPoint.pValue.toExponential(2)}</div>
                            <div>β = {hoveredPoint.beta.toFixed(3)}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Summary stats */}
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 text-center">
                Genome-wide significance: P &lt; {GENOME_WIDE_SIG.toExponential(0)} •
                Suggestive: P &lt; {SUGGESTIVE_SIG.toExponential(0)}
            </div>
        </div>
    );
};
