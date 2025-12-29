/**
 * GenotypeSelector - Modal for creating new organisms
 */

import React, { useState, useEffect } from 'react';
import { MdClose } from 'react-icons/md';
import { Button, Input } from '../common';
import type { Organism, Trait } from '../../types';

interface GenotypeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (organism: Omit<Organism, 'id' | 'createdAt'>) => void;
  traits: Trait[];
}

// Predefined simple traits for MVP
const SIMPLE_TRAITS = {
  eye_color: {
    name: 'Eye Color',
    alleles: ['B', 'b'],
    phenotypes: {
      BB: 'Brown',
      Bb: 'Brown',
      bb: 'Blue',
    },
  },
  hair_color: {
    name: 'Hair Color',
    alleles: ['H', 'h'],
    phenotypes: {
      HH: 'Black',
      Hh: 'Black',
      hh: 'Blonde',
    },
  },
};

export const GenotypeSelector: React.FC<GenotypeSelectorProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [genotypes, setGenotypes] = useState<Record<string, string>>({
    eye_color: 'Bb',
    hair_color: 'Hh',
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setSex('male');
      setGenotypes({
        eye_color: 'Bb',
        hair_color: 'Hh',
      });
    }
  }, [isOpen]);

  const handleGenotypeChange = (trait: string, value: string) => {
    setGenotypes((prev) => ({ ...prev, [trait]: value }));
  };

  const determinePhenotypes = (): Record<string, string> => {
    const phenotypes: Record<string, string> = {};

    Object.entries(genotypes).forEach(([trait, genotype]) => {
      const traitDef = SIMPLE_TRAITS[trait as keyof typeof SIMPLE_TRAITS];
      if (traitDef) {
        phenotypes[trait] = traitDef.phenotypes[genotype as keyof typeof traitDef.phenotypes];
      }
    });

    return phenotypes;
  };

  const handleCreate = () => {
    if (!name.trim()) {
      alert('Please enter a name for the organism');
      return;
    }

    const organism: Omit<Organism, 'id' | 'createdAt'> = {
      name: name.trim(),
      sex,
      genotype: genotypes,
      phenotype: determinePhenotypes(),
    };

    onCreate(organism);
    onClose();
  };

  if (!isOpen) return null;

  const phenotypes = determinePhenotypes();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Create New Organism
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            aria-label="Close"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Organism #1"
              className="w-full"
            />
          </div>

          {/* Sex Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sex
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sex"
                  value="male"
                  checked={sex === 'male'}
                  onChange={() => setSex('male')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Male</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sex"
                  value="female"
                  checked={sex === 'female'}
                  onChange={() => setSex('female')}
                  className="text-pink-600 focus:ring-pink-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Female</span>
              </label>
            </div>
          </div>

          {/* Genotype Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Genotype
            </label>
            <div className="space-y-4">
              {Object.entries(SIMPLE_TRAITS).map(([traitId, trait]) => (
                <div key={traitId}>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {trait.name}
                  </p>
                  <select
                    value={genotypes[traitId]}
                    onChange={(e) => handleGenotypeChange(traitId, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                               rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500
                               text-sm"
                  >
                    {Object.keys(trait.phenotypes).map((genotype) => (
                      <option key={genotype} value={genotype}>
                        {genotype} ({trait.phenotypes[genotype as keyof typeof trait.phenotypes]})
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Phenotype Preview */}
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mb-2">
              Phenotype Preview
            </h3>
            <ul className="space-y-1">
              {Object.entries(phenotypes).map(([trait, value]) => (
                <li key={trait} className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="capitalize">{trait.replace(/_/g, ' ')}: {value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-800">
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button onClick={handleCreate} variant="primary">
            Create Organism
          </Button>
        </div>
      </div>
    </div>
  );
};
