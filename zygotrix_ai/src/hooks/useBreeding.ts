/**
 * Virtual Breeding Lab - Custom Hook
 * Manages breeding lab state and logic
 */

import { useState, useEffect } from 'react';
import { breedingService } from '../services';
import { generateId } from '../utils';
import type { Organism, Trait, BreedingResult } from '../types';

export const useBreeding = () => {
  const [organisms, setOrganisms] = useState<Organism[]>([]);
  const [traits, setTraits] = useState<Trait[]>([]);
  const [parentA, setParentA] = useState<Organism | null>(null);
  const [parentB, setParentB] = useState<Organism | null>(null);
  const [breedingResult, setBreedingResult] = useState<BreedingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load traits on mount
  useEffect(() => {
    const loadTraits = async () => {
      try {
        const data = await breedingService.getTraits({ category: 'mendelian' });
        setTraits(data);
      } catch (err) {
        setError('Failed to load traits');
        console.error(err);
      }
    };

    loadTraits();
  }, []);

  /**
   * Create a new organism and add to bank
   */
  const createOrganism = (organism: Omit<Organism, 'id' | 'createdAt'>) => {
    const newOrganism: Organism = {
      ...organism,
      id: generateId(),
      createdAt: Date.now(),
    };
    setOrganisms((prev) => [...prev, newOrganism]);
    return newOrganism;
  };

  /**
   * Delete an organism from the bank
   */
  const deleteOrganism = (id: string) => {
    setOrganisms((prev) => prev.filter((org) => org.id !== id));

    // Clear parents if they were deleted
    if (parentA?.id === id) setParentA(null);
    if (parentB?.id === id) setParentB(null);
  };

  /**
   * Simulate breeding between selected parents
   */
  const breed = async () => {
    if (!parentA || !parentB) {
      setError('Please select both parents');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await breedingService.breed({
        parentA,
        parentB,
        traits: Object.keys(parentA.genotype),
        simulations: 100,
      });
      setBreedingResult(result);
    } catch (err) {
      setError('Breeding simulation failed. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Add an offspring to the organism bank
   */
  const addOffspringToBank = (offspring: Organism) => {
    setOrganisms((prev) => [...prev, offspring]);
  };

  /**
   * Clear breeding results
   */
  const clearResults = () => {
    setBreedingResult(null);
  };

  /**
   * Clear selected parents
   */
  const clearParents = () => {
    setParentA(null);
    setParentB(null);
  };

  /**
   * Clear error message
   */
  const clearError = () => {
    setError(null);
  };

  return {
    // State
    organisms,
    traits,
    parentA,
    parentB,
    breedingResult,
    isLoading,
    error,

    // Actions
    setParentA,
    setParentB,
    createOrganism,
    deleteOrganism,
    breed,
    addOffspringToBank,
    clearResults,
    clearParents,
    clearError,
  };
};
