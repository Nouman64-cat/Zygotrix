/**
 * BreedingZone - Central breeding area with drop zones
 */

import React, { useState } from 'react';
import { FiX, FiRefreshCw } from 'react-icons/fi';
import { Button, IconButton } from '../common';
import { ThinkingLoader } from '../common/ThinkingLoader';
import { OrganismCard } from './OrganismCard';
import { cn } from '../../utils';
import type { Organism } from '../../types';

interface BreedingZoneProps {
  parentA: Organism | null;
  parentB: Organism | null;
  onSetParentA: (organism: Organism | null) => void;
  onSetParentB: (organism: Organism | null) => void;
  onBreed: () => void;
  onClear: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

type DropZone = 'parentA' | 'parentB' | null;

export const BreedingZone: React.FC<BreedingZoneProps> = ({
  parentA,
  parentB,
  onSetParentA,
  onSetParentB,
  onBreed,
  onClear,
  isLoading,
  disabled = false,
}) => {
  const [highlightedZone, setHighlightedZone] = useState<DropZone>(null);

  const handleDragOver = (e: React.DragEvent, zone: DropZone) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setHighlightedZone(zone);
  };

  const handleDragLeave = () => {
    setHighlightedZone(null);
  };

  const handleDrop = (e: React.DragEvent, zone: 'parentA' | 'parentB') => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;

    try {
      const organism = JSON.parse(data) as Organism;

      if (zone === 'parentA') {
        onSetParentA(organism);
      } else {
        onSetParentB(organism);
      }
    } catch (error) {
      console.error('Failed to parse organism data:', error);
    }

    setHighlightedZone(null);
  };

  const canBreed = parentA && parentB && !disabled && !isLoading;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Breeding Zone
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Drag two organisms here to breed them
          </p>
        </div>
        {(parentA || parentB) && (
          <IconButton
            icon={<FiRefreshCw />}
            onClick={onClear}
            variant="ghost"
            size="sm"
            aria-label="Clear parents"
          />
        )}
      </div>

      {/* Drop Zones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Parent A Drop Zone */}
        <div
          onDragOver={(e) => handleDragOver(e, 'parentA')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'parentA')}
          className={cn(
            'border-2 border-dashed rounded-lg p-4 min-h-[280px]',
            'transition-all duration-200',
            'flex flex-col items-center justify-center',
            highlightedZone === 'parentA'
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
              : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'
          )}
        >
          {parentA ? (
            <div className="relative w-full">
              <OrganismCard organism={parentA} draggable={false} />
              <IconButton
                icon={<FiX />}
                onClick={() => onSetParentA(null)}
                variant="ghost"
                size="sm"
                className="absolute -top-2 -right-2 bg-white dark:bg-gray-800 shadow-md"
                aria-label="Remove parent A"
              />
            </div>
          ) : (
            <div className="text-center">
              <div className="text-gray-400 dark:text-gray-600 mb-2">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Parent A
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Drag an organism here
              </p>
            </div>
          )}
        </div>

        {/* Parent B Drop Zone */}
        <div
          onDragOver={(e) => handleDragOver(e, 'parentB')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'parentB')}
          className={cn(
            'border-2 border-dashed rounded-lg p-4 min-h-[280px]',
            'transition-all duration-200',
            'flex flex-col items-center justify-center',
            highlightedZone === 'parentB'
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
              : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'
          )}
        >
          {parentB ? (
            <div className="relative w-full">
              <OrganismCard organism={parentB} draggable={false} />
              <IconButton
                icon={<FiX />}
                onClick={() => onSetParentB(null)}
                variant="ghost"
                size="sm"
                className="absolute -top-2 -right-2 bg-white dark:bg-gray-800 shadow-md"
                aria-label="Remove parent B"
              />
            </div>
          ) : (
            <div className="text-center">
              <div className="text-gray-400 dark:text-gray-600 mb-2">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Parent B
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Drag an organism here
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Breed Button */}
      <div className="flex justify-center">
        {isLoading ? (
          <div className="text-center">
            <ThinkingLoader />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Simulating genetic cross...
            </p>
          </div>
        ) : (
          <Button
            onClick={onBreed}
            variant="primary"
            size="lg"
            disabled={!canBreed}
            className="min-w-[200px]"
          >
            Breed Organisms
          </Button>
        )}
      </div>

      {/* Help Text */}
      {!parentA && !parentB && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Select two organisms from the bank to see their offspring
          </p>
        </div>
      )}
    </div>
  );
};
