/**
 * BreedingLab - Virtual Breeding Lab Page
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiActivity } from 'react-icons/fi';
import { IconButton } from '../components/common';
import {
  OrganismBank,
  BreedingZone,
  OffspringDisplay,
  GenotypeSelector,
} from '../components/breeding';
import { useBreeding } from '../hooks';

export const BreedingLab: React.FC = () => {
  const navigate = useNavigate();
  const {
    organisms,
    traits,
    parentA,
    parentB,
    breedingResult,
    isLoading,
    error,
    setParentA,
    setParentB,
    createOrganism,
    deleteOrganism,
    breed,
    addOffspringToBank,
    clearResults,
    clearParents,
    clearError,
  } = useBreeding();

  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <IconButton
              icon={<FiArrowLeft />}
              onClick={() => navigate('/chat')}
              variant="ghost"
              aria-label="Back to chat"
            />
            <FiActivity className="text-2xl text-emerald-600" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Virtual Breeding Lab
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Explore genetics through interactive organism breeding
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              <button
                onClick={clearError}
                className="text-red-500 hover:text-red-600 dark:hover:text-red-300"
              >
                <svg
                  className="w-5 h-5"
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
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Organism Bank */}
          <div className="lg:col-span-1">
            <OrganismBank
              organisms={organisms}
              onCreateNew={() => setShowCreateModal(true)}
              onDeleteOrganism={deleteOrganism}
            />
          </div>

          {/* Main Area - Breeding Zone + Results */}
          <div className="lg:col-span-3 space-y-6">
            {/* Breeding Zone */}
            <BreedingZone
              parentA={parentA}
              parentB={parentB}
              onSetParentA={setParentA}
              onSetParentB={setParentB}
              onBreed={breed}
              onClear={clearParents}
              isLoading={isLoading}
              disabled={false}
            />

            {/* Offspring Display (only show if results exist) */}
            {breedingResult && (
              <OffspringDisplay
                result={breedingResult}
                onAddToBank={addOffspringToBank}
                onClear={clearResults}
              />
            )}

            {/* Empty State (no organisms and no results) */}
            {organisms.length === 0 && !breedingResult && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-12 text-center">
                <div className="text-gray-400 dark:text-gray-600 mb-4">
                  <FiActivity className="mx-auto h-16 w-16" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Welcome to the Breeding Lab!
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Get started by creating your first organisms to breed. You'll be able to
                  explore genetic inheritance patterns through interactive simulations.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white
                             rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  <FiActivity />
                  Create Your First Organism
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Genotype Selector Modal */}
      <GenotypeSelector
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={(organism) => {
          createOrganism(organism);
          setShowCreateModal(false);
        }}
        traits={traits}
      />
    </div>
  );
};
