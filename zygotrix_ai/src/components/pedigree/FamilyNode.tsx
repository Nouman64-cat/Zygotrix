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
    // Target (Offspring) -> Green Theme
    // Dominant -> Dark Background, White Text
    // Recessive -> Light Background, Dark Text

    let containerClasses = '';
    let badgeClasses = '';

    if (data.isTarget) {
        // Green Theme for Target
        containerClasses = 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 border-2 text-emerald-900 dark:text-emerald-100 shadow-emerald-500/20';
        badgeClasses = 'bg-emerald-200/50 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-100';
    } else if (isRecessive) {
        // Light Theme for Recessive (e.g. Grandma)
        containerClasses = 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-gray-100';
        badgeClasses = 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300';
    } else {
        // Dark Theme for Dominant (e.g. Grandfather)
        containerClasses = 'bg-slate-900 dark:bg-slate-800 border-slate-900 dark:border-slate-800 text-white';
        badgeClasses = 'bg-slate-700/50 text-slate-200';
    }

    return (
        <div className={`
            relative flex items-center justify-between gap-3 px-4 py-3 
            min-w-[200px] rounded-xl border shadow-sm transition-transform hover:scale-105
            ${containerClasses}
        `}>
            {/* Connection Handles - Hidden but functional */}
            <Handle type="target" position={Position.Top} className="opacity-0" />

            <span className="text-sm font-bold tracking-wide capitalize truncate max-w-[100px]" title={data.relation}>
                {data.relation}
            </span>

            <span className={`
                text-xs font-mono px-2 py-1 rounded-md opacity-90 capitalize truncate max-w-[100px] font-bold
                ${badgeClasses}
            `} title={data.phenotype}>
                {data.phenotype}
            </span>

            <Handle type="source" position={Position.Bottom} className="opacity-0" />
        </div>
    );
};

export default memo(FamilyNode);
