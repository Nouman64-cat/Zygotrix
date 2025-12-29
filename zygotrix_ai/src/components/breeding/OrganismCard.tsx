/**
 * OrganismCard - Draggable organism card component
 */

import React, { useState } from 'react';
import { IoMdMale, IoMdFemale } from 'react-icons/io';
import { cn } from '../../utils';
import type { Organism } from '../../types';

interface OrganismCardProps {
  organism: Organism;
  draggable?: boolean;
  compact?: boolean;
  onClick?: () => void;
  onDelete?: (id: string) => void;
  showDelete?: boolean;
}

export const OrganismCard: React.FC<OrganismCardProps> = ({
  organism,
  draggable = true,
  compact = false,
  onClick,
  onDelete,
  showDelete = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    if (!draggable) return;

    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify(organism));
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const SexIcon = organism.sex === 'male' ? IoMdMale : IoMdFemale;
  const sexColor = organism.sex === 'male' ? 'text-blue-500' : 'text-pink-500';

  return (
    <div
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border transition-all duration-200 relative',
        'border-gray-200 dark:border-gray-700',
        'hover:shadow-md hover:scale-105',
        draggable && 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50 rotate-2',
        compact ? 'p-3' : 'p-4',
        onClick && 'cursor-pointer'
      )}
    >
      {/* Delete button */}
      {showDelete && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(organism.id);
          }}
          className="absolute top-2 right-2 p-1 rounded-full bg-red-100 dark:bg-red-900/30
                     text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50
                     transition-colors z-10"
          aria-label="Delete organism"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}

      {/* Organism Icon */}
      <div className="flex justify-center mb-3">
        <div
          className={cn(
            'rounded-full bg-gradient-to-br p-3',
            organism.sex === 'male'
              ? 'from-blue-400 to-blue-600'
              : 'from-pink-400 to-pink-600'
          )}
        >
          <SexIcon className="text-white text-3xl" />
        </div>
      </div>

      {/* Name and Sex */}
      <div className="text-center mb-2">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
          {organism.name}
        </h3>
        <p className={cn('text-xs flex items-center justify-center gap-1', sexColor)}>
          <SexIcon className="text-sm" />
          {organism.sex === 'male' ? 'Male' : 'Female'}
        </p>
      </div>

      {/* Genotype */}
      <div className="mb-2">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Genotype:</p>
        <div className="flex flex-wrap gap-1">
          {Object.entries(organism.genotype).map(([trait, alleles]) => (
            <span
              key={trait}
              className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30
                         text-emerald-700 dark:text-emerald-400 text-xs rounded font-mono"
              title={trait}
            >
              {alleles}
            </span>
          ))}
        </div>
      </div>

      {/* Phenotype (if not compact) */}
      {!compact && (
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Phenotype:</p>
          <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
            {Object.entries(organism.phenotype).map(([trait, value]) => (
              <li key={trait} className="flex items-start gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0"></span>
                <span className="truncate" title={`${trait}: ${value}`}>
                  {value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Generation indicator (if offspring) */}
      {organism.isOffspring && organism.generation && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Generation {organism.generation}
          </p>
        </div>
      )}
    </div>
  );
};
