/**
 * BreedingLabWidget - Compact breeding lab for chat embedding
 */

import React, { useState } from 'react';
import { FiRefreshCw, FiZap } from 'react-icons/fi';
import { IoMdMale, IoMdFemale } from 'react-icons/io';
import { Button } from '../common';
import { breedingService } from '../../services';
import type { Organism, BreedingResult } from '../../types';

interface BreedingLabWidgetProps {
  initialParentA?: Organism;
  initialParentB?: Organism;
  traitIds?: string[];
  title?: string;
  onResultsUpdate?: (results: BreedingResult) => void;
}

export const BreedingLabWidget: React.FC<BreedingLabWidgetProps> = ({
  initialParentA,
  initialParentB,
  traitIds = ['eye_color', 'hair_color'],
  title = '🧬 Interactive Breeding Simulation',
  onResultsUpdate,
}) => {
  const [parentA, setParentA] = useState<Organism | null>(initialParentA || null);
  const [parentB, setParentB] = useState<Organism | null>(initialParentB || null);
  const [results, setResults] = useState<BreedingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Create default organisms if not provided
  React.useEffect(() => {
    if (!parentA) {
      setParentA({
        id: '1',
        name: 'Parent A',
        sex: 'male',
        genotype: { eye_color: 'Bb', hair_color: 'Hh' },
        phenotype: { eye_color: 'Brown', hair_color: 'Black' },
        createdAt: Date.now(),
      });
    }
    if (!parentB) {
      setParentB({
        id: '2',
        name: 'Parent B',
        sex: 'female',
        genotype: { eye_color: 'bb', hair_color: 'hh' },
        phenotype: { eye_color: 'Blue', hair_color: 'Blonde' },
        createdAt: Date.now(),
      });
    }
  }, []);

  const handleBreed = async () => {
    if (!parentA || !parentB) return;

    setIsLoading(true);
    try {
      const result = await breedingService.breed({
        parentA,
        parentB,
        traits: traitIds,
        simulations: 100,
      });
      setResults(result);
      onResultsUpdate?.(result);
    } catch (error) {
      console.error('Breeding failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const randomizeGenotypes = () => {
    const randomGenotype = (alleles: string[]) => {
      const [dominant, recessive] = alleles;
      const options = [
        `${dominant}${dominant}`,
        `${dominant}${recessive}`,
        `${recessive}${recessive}`,
      ];
      return options[Math.floor(Math.random() * options.length)];
    };

    if (parentA) {
      setParentA({
        ...parentA,
        genotype: {
          eye_color: randomGenotype(['B', 'b']),
          hair_color: randomGenotype(['H', 'h']),
        },
        phenotype: determinePhenotype({
          eye_color: randomGenotype(['B', 'b']),
          hair_color: randomGenotype(['H', 'h']),
        }),
      });
    }

    if (parentB) {
      setParentB({
        ...parentB,
        genotype: {
          eye_color: randomGenotype(['B', 'b']),
          hair_color: randomGenotype(['H', 'h']),
        },
        phenotype: determinePhenotype({
          eye_color: randomGenotype(['B', 'b']),
          hair_color: randomGenotype(['H', 'h']),
        }),
      });
    }

    setResults(null);
  };

  const determinePhenotype = (genotype: Record<string, string>): Record<string, string> => {
    const phenotype: Record<string, string> = {};

    // Eye color
    if (genotype.eye_color?.includes('B')) {
      phenotype.eye_color = 'Brown';
    } else {
      phenotype.eye_color = 'Blue';
    }

    // Hair color
    if (genotype.hair_color?.includes('H')) {
      phenotype.hair_color = 'Black';
    } else {
      phenotype.hair_color = 'Blonde';
    }

    return phenotype;
  };

  if (!parentA || !parentB) return null;

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-gray-800 dark:to-gray-900
                    border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 my-3 max-w-2xl">
      {/* Title */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          {title}
        </h3>
        <button
          onClick={randomizeGenotypes}
          className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700
                     dark:hover:text-emerald-300 flex items-center gap-1"
        >
          <FiRefreshCw size={12} />
          Randomize
        </button>
      </div>

      {/* Parents Display */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Parent A */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <IoMdMale className="text-blue-500" />
            <span className="text-xs font-medium text-gray-900 dark:text-white">Parent A</span>
          </div>
          <div className="space-y-1">
            <div className="flex gap-1">
              {Object.entries(parentA.genotype).map(([trait, genotype]) => (
                <span key={trait} className="text-xs font-mono bg-blue-100 dark:bg-blue-900/30
                                             text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                  {genotype}
                </span>
              ))}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {Object.values(parentA.phenotype).join(', ')}
            </div>
          </div>
        </div>

        {/* Parent B */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-pink-200 dark:border-pink-800">
          <div className="flex items-center gap-2 mb-2">
            <IoMdFemale className="text-pink-500" />
            <span className="text-xs font-medium text-gray-900 dark:text-white">Parent B</span>
          </div>
          <div className="space-y-1">
            <div className="flex gap-1">
              {Object.entries(parentB.genotype).map(([trait, genotype]) => (
                <span key={trait} className="text-xs font-mono bg-pink-100 dark:bg-pink-900/30
                                             text-pink-700 dark:text-pink-300 px-1.5 py-0.5 rounded">
                  {genotype}
                </span>
              ))}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {Object.values(parentB.phenotype).join(', ')}
            </div>
          </div>
        </div>
      </div>

      {/* Breed Button */}
      <Button
        onClick={handleBreed}
        variant="primary"
        size="sm"
        className="w-full mb-3 !bg-emerald-600 hover:!bg-emerald-700"
        leftIcon={<FiZap />}
        disabled={isLoading}
      >
        {isLoading ? 'Simulating...' : 'Run Genetic Cross'}
      </Button>

      {/* Results */}
      {results && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
            Results ({results.simulations} simulations)
          </h4>

          {/* Phenotypic Ratios */}
          <div className="space-y-2">
            {Object.entries(results.phenotypicRatios).map(([trait, ratios]) => (
              <div key={trait}>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 capitalize">
                  {trait.replace(/_/g, ' ')}:
                </p>
                <div className="space-y-1">
                  {Object.entries(ratios)
                    .sort(([, a], [, b]) => b - a)
                    .map(([phenotype, ratio]) => (
                      <div key={phenotype} className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full flex items-center justify-end px-2"
                            style={{ width: `${ratio * 100}%` }}
                          >
                            <span className="text-xs font-medium text-white">
                              {(ratio * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-700 dark:text-gray-300 min-w-[80px]">
                          {phenotype}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Genotypic Ratios (Collapsible) */}
          <details className="mt-3">
            <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
              View genotypic ratios
            </summary>
            <div className="mt-2 space-y-2">
              {Object.entries(results.genotypicRatios).map(([trait, ratios]) => (
                <div key={trait} className="text-xs">
                  <p className="text-gray-500 dark:text-gray-400 mb-1 capitalize">
                    {trait.replace(/_/g, ' ')}:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(ratios)
                      .sort(([, a], [, b]) => b - a)
                      .map(([genotype, ratio]) => (
                        <span key={genotype} className="font-mono bg-gray-100 dark:bg-gray-700
                                                        text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
                          {genotype}: {(ratio * 100).toFixed(1)}%
                        </span>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
};
