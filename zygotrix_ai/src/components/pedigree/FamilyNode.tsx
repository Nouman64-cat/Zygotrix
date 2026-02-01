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

    // Reference Style: 
    // Dominant -> Dark Background, White Text
    // Recessive -> Light Background, Dark Text
    const containerClasses = isRecessive
        ? 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-gray-100'
        : 'bg-slate-900 dark:bg-slate-800 border-slate-900 dark:border-slate-800 text-white';

    const targetClasses = data.isTarget
        ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-white dark:ring-offset-black'
        : '';

    return (
        <div className={`
            relative flex items-center justify-between gap-3 px-4 py-3 
            min-w-[200px] rounded-xl border shadow-sm transition-transform hover:scale-105
            ${containerClasses} ${targetClasses}
        `}>
            {/* Connection Handles - Hidden but functional */}
            <Handle type="target" position={Position.Top} className="opacity-0" />

            <span className="text-sm font-semibold tracking-wide capitalize truncate max-w-[100px]" title={data.relation}>
                {data.relation}
            </span>

            <span className={`
                text-xs font-mono px-2 py-1 rounded-md opacity-90 capitalize truncate max-w-[100px]
                ${isRecessive ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300' : 'bg-slate-700/50 text-slate-200'}
            `} title={data.phenotype}>
                {data.phenotype}
            </span>

            <Handle type="source" position={Position.Bottom} className="opacity-0" />
        </div>
    );
};

export default memo(FamilyNode);
