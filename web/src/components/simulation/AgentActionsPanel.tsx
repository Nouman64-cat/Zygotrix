import React, { useState } from 'react';
import { useSimulationTool } from '../../context/SimulationToolContext';
import { HiChevronUp, HiCheck, HiX } from 'react-icons/hi';
import { RiLoader4Line } from 'react-icons/ri';

export const AgentActionsPanel: React.FC = () => {
  const { agentActions, clearAgentActions } = useSimulationTool();
  const [isExpanded, setIsExpanded] = useState(false);

  if (agentActions.length === 0) {
    return null;
  }

  // Count stats
  const completedCount = agentActions.filter(a => a.status === 'completed').length;
  const failedCount = agentActions.filter(a => a.status === 'failed').length;
  const inProgressCount = agentActions.filter(a => a.status === 'in_progress').length;
  const totalCount = agentActions.length;

  return (
    <div className="fixed bottom-20 right-6 z-40">
      {/* Expanded Panel - Appears above the button */}
      <div
        className={`
          absolute bottom-full right-0 mb-2 w-80
          bg-white dark:bg-slate-900 
          border border-slate-200 dark:border-slate-700 
          rounded-xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50
          overflow-hidden
          transition-all duration-300 ease-out
          ${isExpanded
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
          }
        `}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 flex items-center justify-between">
          <h3 className="text-white font-medium text-sm">Agent Actions</h3>
          <button
            onClick={() => {
              clearAgentActions();
              setIsExpanded(false);
            }}
            className="text-white/80 hover:text-white text-xs hover:bg-white/20 rounded px-2 py-0.5 transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Actions List */}
        <div className="max-h-64 overflow-y-auto p-2 space-y-1.5">
          {agentActions.map((action, index) => (
            <div
              key={action.id}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                transition-colors duration-200
                ${action.status === 'completed'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20'
                  : action.status === 'failed'
                    ? 'bg-red-50 dark:bg-red-900/20'
                    : action.status === 'in_progress'
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'bg-slate-50 dark:bg-slate-800/50'
                }
              `}
            >
              {/* Step Number */}
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center justify-center">
                {index + 1}
              </span>

              {/* Description */}
              <span className="flex-1 truncate text-slate-700 dark:text-slate-200">
                {action.description}
              </span>

              {/* Status Icon */}
              <span className="flex-shrink-0">
                {action.status === 'completed' && (
                  <HiCheck className="w-5 h-5 text-emerald-500" />
                )}
                {action.status === 'failed' && (
                  <HiX className="w-5 h-5 text-red-500" />
                )}
                {action.status === 'in_progress' && (
                  <RiLoader4Line className="w-5 h-5 text-blue-500 animate-spin" />
                )}
                {action.status === 'pending' && (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Collapsed Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          flex items-center gap-2 px-4 py-2.5 rounded-xl
          bg-gradient-to-r from-indigo-600 to-purple-600
          hover:from-indigo-500 hover:to-purple-500
          text-white font-medium text-sm
          shadow-lg shadow-indigo-500/30
          transition-all duration-200
          hover:shadow-xl hover:shadow-indigo-500/40
          hover:-translate-y-0.5
        `}
      >
        {/* Counts */}
        <div className="flex items-center gap-1.5">
          {completedCount > 0 && (
            <span className="flex items-center gap-0.5 text-emerald-200">
              <HiCheck className="w-4 h-4" />
              <span className="text-xs">{completedCount}</span>
            </span>
          )}
          {failedCount > 0 && (
            <span className="flex items-center gap-0.5 text-red-200">
              <HiX className="w-4 h-4" />
              <span className="text-xs">{failedCount}</span>
            </span>
          )}
          {inProgressCount > 0 && (
            <span className="flex items-center gap-0.5 text-blue-200">
              <RiLoader4Line className="w-4 h-4 animate-spin" />
              <span className="text-xs">{inProgressCount}</span>
            </span>
          )}
        </div>

        <span className="border-l border-white/30 pl-2 ml-1">
          {totalCount} Action{totalCount !== 1 ? 's' : ''}
        </span>

        {/* Arrow Icon */}
        <HiChevronUp
          className={`
            w-5 h-5 transition-transform duration-300
            ${isExpanded ? 'rotate-180' : 'rotate-0'}
          `}
        />
      </button>
    </div>
  );
};
