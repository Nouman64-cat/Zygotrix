import React, { useMemo } from 'react';

interface QQPlotProps {
    data: {
        expected: number[];
        observed: number[];
        genomic_inflation_lambda: number;
    };
}

export const QQPlot: React.FC<QQPlotProps> = ({ data }) => {
    // Plot dimensions
    const width = 500;
    const height = 500;
    const margin = { top: 20, right: 20, bottom: 60, left: 60 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    // Calculate max value for axis range
    const maxValue = useMemo(() => {
        const maxExpected = Math.max(...data.expected);
        const maxObserved = Math.max(...data.observed);
        return Math.ceil(Math.max(maxExpected, maxObserved));
    }, [data]);

    // Scale functions
    const scaleX = (value: number) => (value / maxValue) * plotWidth;
    const scaleY = (value: number) => plotHeight - (value / maxValue) * plotHeight;

    // Genomic inflation interpretation
    const getInflationInterpretation = (lambda: number) => {
        if (lambda < 0.95) return { text: 'Deflated', color: 'text-orange-600 dark:text-orange-400' };
        if (lambda <= 1.05) return { text: 'Ideal', color: 'text-green-600 dark:text-green-400' };
        if (lambda <= 1.10) return { text: 'Mild Inflation', color: 'text-yellow-600 dark:text-yellow-400' };
        return { text: 'Inflated', color: 'text-red-600 dark:text-red-400' };
    };

    const inflation = getInflationInterpretation(data.genomic_inflation_lambda);

    return (
        <div className="flex flex-col items-center">
            {/* Q-Q Plot SVG */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <svg width={width} height={height} className="mx-auto">
                    {/* Background */}
                    <rect
                        x={margin.left}
                        y={margin.top}
                        width={plotWidth}
                        height={plotHeight}
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-gray-300 dark:text-gray-600"
                    />

                    {/* Grid lines */}
                    {[...Array(6)].map((_, i) => {
                        const pos = (i / 5) * plotWidth;
                        return (
                            <g key={i}>
                                {/* Vertical grid line */}
                                <line
                                    x1={margin.left + pos}
                                    y1={margin.top}
                                    x2={margin.left + pos}
                                    y2={margin.top + plotHeight}
                                    stroke="currentColor"
                                    strokeWidth="0.5"
                                    className="text-gray-200 dark:text-gray-700"
                                    strokeDasharray="2,2"
                                />
                                {/* Horizontal grid line */}
                                <line
                                    x1={margin.left}
                                    y1={margin.top + plotHeight - pos}
                                    x2={margin.left + plotWidth}
                                    y2={margin.top + plotHeight - pos}
                                    stroke="currentColor"
                                    strokeWidth="0.5"
                                    className="text-gray-200 dark:text-gray-700"
                                    strokeDasharray="2,2"
                                />
                            </g>
                        );
                    })}

                    {/* Diagonal reference line (y = x) */}
                    <line
                        x1={margin.left}
                        y1={margin.top + plotHeight}
                        x2={margin.left + plotWidth}
                        y2={margin.top}
                        stroke="#6B7280"
                        strokeWidth="2"
                        strokeDasharray="4,4"
                    />

                    {/* Data points */}
                    {data.expected.map((expectedVal, idx) => {
                        const observedVal = data.observed[idx];
                        const x = margin.left + scaleX(expectedVal);
                        const y = margin.top + scaleY(observedVal);

                        return (
                            <circle
                                key={idx}
                                cx={x}
                                cy={y}
                                r="2"
                                fill="#10B981"
                                opacity="0.6"
                            />
                        );
                    })}

                    {/* X-axis */}
                    <line
                        x1={margin.left}
                        y1={margin.top + plotHeight}
                        x2={margin.left + plotWidth}
                        y2={margin.top + plotHeight}
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="text-gray-600 dark:text-gray-400"
                    />

                    {/* X-axis labels */}
                    {[...Array(6)].map((_, i) => {
                        const value = (i / 5) * maxValue;
                        const x = margin.left + (i / 5) * plotWidth;
                        return (
                            <text
                                key={i}
                                x={x}
                                y={height - margin.bottom + 20}
                                textAnchor="middle"
                                fontSize="12"
                                className="fill-gray-600 dark:fill-gray-400"
                            >
                                {value.toFixed(0)}
                            </text>
                        );
                    })}

                    <text
                        x={width / 2}
                        y={height - 5}
                        textAnchor="middle"
                        fontSize="14"
                        className="fill-gray-700 dark:fill-gray-300 font-medium"
                    >
                        Expected -log₁₀(P)
                    </text>

                    {/* Y-axis */}
                    <line
                        x1={margin.left}
                        y1={margin.top}
                        x2={margin.left}
                        y2={margin.top + plotHeight}
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="text-gray-600 dark:text-gray-400"
                    />

                    {/* Y-axis labels */}
                    {[...Array(6)].map((_, i) => {
                        const value = (i / 5) * maxValue;
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
                        Observed -log₁₀(P)
                    </text>
                </svg>
            </div>

            {/* Statistics Panel */}
            <div className="mt-4 w-full max-w-md grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-slate-50 dark:from-emerald-900/20 dark:to-slate-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Genomic Inflation (λ<sub>GC</sub>)
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {data.genomic_inflation_lambda.toFixed(3)}
                    </div>
                    <div className={`text-xs font-semibold mt-1 ${inflation.color}`}>
                        {inflation.text}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg p-4 border border-gray-300 dark:border-gray-600">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        SNPs Analyzed
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {data.observed.length.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Interpretation Guide */}
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 max-w-md">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Q-Q Plot Interpretation
                </h4>
                <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                    <li>• <strong>Points on diagonal:</strong> P-values match null expectation</li>
                    <li>• <strong>Points above diagonal:</strong> More significant than expected</li>
                    <li>• <strong>λ<sub>GC</sub> ≈ 1.0:</strong> No systematic bias (ideal)</li>
                    <li>• <strong>λ<sub>GC</sub> &gt; 1.05:</strong> Possible population stratification</li>
                    <li>• <strong>λ<sub>GC</sub> &lt; 0.95:</strong> Possible overcorrection</li>
                </ul>
            </div>
        </div>
    );
};
