import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { PedigreeMember } from '../../types';

export interface FamilyNodeData extends PedigreeMember {
    isTarget?: boolean;
}

const FamilyNode = ({ data }: NodeProps<FamilyNodeData>) => {
    // Heuristic for styling based on phenotype string
    // In a real app, strict trait mapping would happen in backend
    const phenotype = data.phenotype?.toLowerCase() || 'unknown';
    const isRecessive = ['blonde', 'red', 'blue', 'fair', 'light', 'recessive', 'aa'].some(t =>
        phenotype.includes(t)
    );

    // Cyberpunk/Scientific colors styling
    // Recessive/Alert -> Gold/Yellow
    // Dominant/Standard -> Blue/Slate
    const borderColor = isRecessive ? 'border-yellow-500' : 'border-blue-500';
    const glowColor = isRecessive ? 'shadow-yellow-500/20' : 'shadow-blue-500/20';
    const bgColor = isRecessive ? 'bg-yellow-50/90 dark:bg-yellow-950/80' : 'bg-slate-50/90 dark:bg-slate-950/80';
    const headerBg = isRecessive ? 'bg-yellow-100/50 dark:bg-yellow-900/30' : 'bg-blue-100/50 dark:bg-blue-900/30';
    const textColor = isRecessive ? 'text-yellow-900 dark:text-yellow-100' : 'text-blue-900 dark:text-blue-100';
    const labelColor = isRecessive ? 'text-yellow-600 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400';

    return (
        <div className={`shadow-lg shadow-[0_4px_20px_-5px] ${glowColor} rounded-lg border ${borderColor} ${bgColor} min-w-[160px] max-w-[200px] overflow-hidden backdrop-blur-md transition-all duration-300 hover:scale-[1.02]`}>
            <Handle type="target" position={Position.Top} className="!bg-gray-400 !w-2 !h-2 rounded-full !border-0" />

            <div className={`px-3 py-2 border-b border-black/10 dark:border-white/10 ${headerBg} flex items-center justify-between`}>
                <span className={`text-[10px] font-mono uppercase tracking-widest ${labelColor} truncate`}>
                    {data.relation}
                </span>
                {data.isTarget && (
                    <span className="flex h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px] shadow-red-500 animate-pulse" title="Target Subject" />
                )}
            </div>

            <div className="p-3">
                <div className={`text-sm font-bold capitalize ${textColor} mb-1`}>
                    {data.phenotype}
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-white/40 font-mono">
                    <span>{data.id}</span>
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-gray-400 !w-2 !h-2 rounded-full !border-0" />
        </div>
    );
};

export default memo(FamilyNode);
