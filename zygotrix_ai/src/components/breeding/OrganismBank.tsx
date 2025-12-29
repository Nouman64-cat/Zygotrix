/**
 * OrganismBank - Sidebar organism library component
 */

import React from 'react';
import { FiPlus } from 'react-icons/fi';
import { Button } from '../common';
import { OrganismCard } from './OrganismCard';
import type { Organism } from '../../types';

interface OrganismBankProps {
  organisms: Organism[];
  onCreateNew: () => void;
  onDeleteOrganism?: (id: string) => void;
}

export const OrganismBank: React.FC<OrganismBankProps> = ({
  organisms,
  onCreateNew,
  onDeleteOrganism,
}) => {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 h-full">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Organism Bank
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Drag organisms to breeding zones
        </p>
        <Button
          onClick={onCreateNew}
          variant="primary"
          size="sm"
          leftIcon={<FiPlus size={16} />}
          className="w-full"
        >
          Create New Organism
        </Button>
      </div>

      {/* Organism List */}
      <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-300px)]">
        {organisms.length === 0 ? (
          <div className="text-center py-8">
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
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No organisms yet
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Create your first organism to get started
            </p>
          </div>
        ) : (
          organisms.map((organism) => (
            <OrganismCard
              key={organism.id}
              organism={organism}
              draggable={true}
              compact={false}
              showDelete={!!onDeleteOrganism}
              onDelete={onDeleteOrganism}
            />
          ))
        )}
      </div>
    </div>
  );
};
