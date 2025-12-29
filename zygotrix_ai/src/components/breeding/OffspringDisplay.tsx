/**
 * OffspringDisplay - Results visualization component
 */

import React from 'react';
import { FiX, FiPlus } from 'react-icons/fi';
import { Button, IconButton } from '../common';
import { OrganismCard } from './OrganismCard';
import type { BreedingResult, Organism } from '../../types';

interface OffspringDisplayProps {
  result: BreedingResult;
  onAddToBank: (organism: Organism) => void;
  onClear: () => void;
}

export const OffspringDisplay: React.FC<OffspringDisplayProps> = ({
  result,
  onAddToBank,
  onClear,
}) => {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Offspring Results
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Based on {result.simulations} simulations
          </p>
        </div>
        <IconButton
          icon={<FiX />}
          onClick={onClear}
          variant="ghost"
          size="sm"
          aria-label="Clear results"
        />
      </div>

      {/* Ratios Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Genotypic Ratios */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-3">
            Genotypic Ratios
          </h3>
          <div className="space-y-3">
            {Object.entries(result.genotypicRatios).map(([trait, ratios]) => (
              <div key={trait}>
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1 capitalize">
                  {trait.replace(/_/g, ' ')}
                </p>
                <div className="space-y-1">
                  {Object.entries(ratios)
                    .sort(([, a], [, b]) => b - a)
                    .map(([genotype, ratio]) => (
                      <div key={genotype} className="flex items-center justify-between text-xs">
                        <span className="font-mono text-blue-800 dark:text-blue-200">
                          {genotype}
                        </span>
                        <span className="text-blue-600 dark:text-blue-400">
                          {(ratio * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Phenotypic Ratios */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 dark:text-green-100 text-sm mb-3">
            Phenotypic Ratios
          </h3>
          <div className="space-y-3">
            {Object.entries(result.phenotypicRatios).map(([trait, ratios]) => (
              <div key={trait}>
                <p className="text-xs text-green-700 dark:text-green-300 font-medium mb-1 capitalize">
                  {trait.replace(/_/g, ' ')}
                </p>
                <div className="space-y-1">
                  {Object.entries(ratios)
                    .sort(([, a], [, b]) => b - a)
                    .map(([phenotype, ratio]) => (
                      <div key={phenotype} className="flex items-center justify-between text-xs">
                        <span className="text-green-800 dark:text-green-200">
                          {phenotype}
                        </span>
                        <span className="text-green-600 dark:text-green-400">
                          {(ratio * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Offspring Grid */}
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">
          Sample Offspring ({result.offspring.length})
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {result.offspring.map((offspring, index) => (
            <div key={offspring.id} className="relative group">
              <OrganismCard organism={offspring} draggable={false} compact={true} />
              <button
                onClick={() => onAddToBank(offspring)}
                className="absolute bottom-2 right-2 p-1.5 rounded-full
                           bg-emerald-500 text-white
                           opacity-0 group-hover:opacity-100
                           transition-opacity duration-200
                           hover:bg-emerald-600
                           shadow-lg"
                title="Add to bank"
                aria-label={`Add ${offspring.name} to bank`}
              >
                <FiPlus size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Sex Ratios (if available) */}
      {result.sexRatios && (
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
            Sex Distribution
          </h3>
          <div className="flex gap-4">
            {Object.entries(result.sexRatios).map(([sex, ratio]) => (
              <div key={sex} className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    sex === 'male' ? 'bg-blue-500' : 'bg-pink-500'
                  }`}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                  {sex}: {(ratio * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
