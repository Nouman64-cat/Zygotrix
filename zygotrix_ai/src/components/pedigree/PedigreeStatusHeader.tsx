import { FiCheckCircle, FiAlertTriangle, FiActivity } from 'react-icons/fi';
import type { GeneticAnalysisResult } from '../../types';

interface StatusHeaderProps {
    result?: GeneticAnalysisResult;
}

export const PedigreeStatusHeader = ({ result }: StatusHeaderProps) => {
    if (!result) return null;

    const isConflict = result.status === 'CONFLICT';
    const isSolvable = result.status === 'SOLVABLE';

    const statusColor = isConflict ? 'text-red-500 dark:text-red-400' :
        isSolvable ? 'text-green-600 dark:text-green-400' :
            'text-blue-500 dark:text-blue-400';

    const iconBg = isConflict ? 'bg-red-100 dark:bg-red-900/20' :
        isSolvable ? 'bg-green-100 dark:bg-green-900/20' :
            'bg-blue-100 dark:bg-blue-900/20';

    const icon = isConflict ? <FiAlertTriangle className="text-lg" /> :
        isSolvable ? <FiCheckCircle className="text-lg" /> :
            <FiActivity className="text-lg" />;

    const title = isConflict ? "Non-Mendelian Pattern Detected" :
        isSolvable ? "Mendelian Pattern Confirmed" :
            "Analysis Status: Unknown";

    return (
        <div className="flex shrink-0 items-center gap-2.5 p-2 mb-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm shadow-sm hover:bg-white/80 dark:hover:bg-zinc-900/80 transition-all">
            <div className={`flex items-center justify-center p-1.5 rounded-md ${iconBg} ${statusColor}`}>
                {icon}
            </div>

            <div className="flex items-center gap-3 overflow-hidden">
                <span className={`text-xs font-bold tracking-wide ${statusColor} uppercase whitespace-nowrap`}>
                    {title}
                </span>

                {isConflict && (
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-zinc-400 border-l border-gray-200 dark:border-zinc-700 pl-3 truncate">
                        <span className="w-1 h-3 bg-red-400 rounded-full shrink-0"></span>
                        <span className="truncate">Epistasis / Gene Masking</span>
                    </div>
                )}
            </div>
        </div>
    );
};
