import React from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    type ChartData,
    type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { MdTrendingUp } from "react-icons/md";

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
);

interface UsageChartProps {
    title: string;
    data: ChartData<"line">;
    options?: ChartOptions<"line">;
    days: number;
    onDaysChange: (days: number) => void;
    height?: string; // class for height, e.g. "h-[300px]"
    icon?: React.ReactNode;
}

const UsageChart: React.FC<UsageChartProps> = ({
    title,
    data,
    options,
    days,
    onDaysChange,
    height = "h-[200px] sm:h-[300px]",
    icon = <MdTrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />,
}) => {
    return (
        <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                    {icon}
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                        {title}
                    </h2>
                </div>
                <select
                    value={days}
                    onChange={(e) => onDaysChange(Number(e.target.value))}
                    className="px-2 sm:px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                    <option value={7}>Last 7 Days</option>
                    <option value={14}>Last 14 Days</option>
                    <option value={30}>Last 30 Days</option>
                    <option value={60}>Last 60 Days</option>
                    <option value={90}>Last 90 Days</option>
                </select>
            </div>

            <div className={height}>
                {data.datasets.length > 0 ? (
                    <Line data={data} options={options} />
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-gray-400 dark:text-slate-500 text-sm">
                            No usage data available
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UsageChart;
