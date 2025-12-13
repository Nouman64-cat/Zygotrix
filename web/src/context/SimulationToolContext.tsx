import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { TraitInfo } from '../types/api';

interface ParentGenotype {
  [geneId: string]: string[]; // gene_id -> [allele1, allele2?]
}

interface SimulationState {
  activeTraits: TraitInfo[];
  motherGenotype: ParentGenotype;
  fatherGenotype: ParentGenotype;
  simulationCount: number;
  isRunning: boolean;
  results: any | null;
}

interface AgentAction {
  id: string;
  type: 'add_trait' | 'remove_trait' | 'set_genotype' | 'set_simulation_count' | 'run_simulation' | 'randomize_alleles';
  description: string;
  timestamp: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  details?: any;
}

// Action handlers that SimulationStudioPage will provide
interface ActionHandlers {
  onAddTrait?: (traitKey: string) => Promise<void>;
  onAddAllTraits?: () => Promise<void>;
  onRemoveTrait?: (traitKey: string) => Promise<void>;
  onSetMotherGenotype?: (geneId: string, alleles: string[]) => Promise<void>;
  onSetFatherGenotype?: (geneId: string, alleles: string[]) => Promise<void>;
  onRandomizeAlleles?: (parent: 'mother' | 'father' | 'both') => Promise<void>;
  onSetSimulationCount?: (count: number) => Promise<void>;
  onRunSimulation?: () => Promise<void>;
}

interface SimulationToolContextType {
  state: SimulationState;
  agentActions: AgentAction[];

  // Tool functions that the agent can call
  addTrait: (traitKey: string) => Promise<{ success: boolean; message: string }>;
  addAllTraits: () => Promise<{ success: boolean; message: string }>;
  removeTrait: (traitKey: string) => Promise<{ success: boolean; message: string }>;
  setMotherGenotype: (geneId: string, alleles: string[]) => Promise<{ success: boolean; message: string }>;
  setFatherGenotype: (geneId: string, alleles: string[]) => Promise<{ success: boolean; message: string }>;
  randomizeAlleles: (parent: 'mother' | 'father' | 'both') => Promise<{ success: boolean; message: string }>;
  setSimulationCount: (count: number) => Promise<{ success: boolean; message: string }>;
  runSimulation: () => Promise<{ success: boolean; message: string; results?: any }>;

  // Direct state setters for UI
  setActiveTraits: (traits: TraitInfo[]) => void;
  setMotherGenotypeState: (genotype: ParentGenotype) => void;
  setFatherGenotypeState: (genotype: ParentGenotype) => void;
  setSimulationCountState: (count: number) => void;
  setResults: (results: any) => void;
  setIsRunning: (isRunning: boolean) => void;

  // Register action handlers from SimulationStudioPage
  registerHandlers: (handlers: ActionHandlers) => void;

  // Action management
  addAgentAction: (action: Omit<AgentAction, 'id' | 'timestamp'>) => string;
  updateAgentAction: (id: string, updates: Partial<AgentAction>) => void;
  clearAgentActions: () => void;
}

export const SimulationToolContext = createContext<SimulationToolContextType | undefined>(undefined);

export const SimulationToolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SimulationState>({
    activeTraits: [],
    motherGenotype: {},
    fatherGenotype: {},
    simulationCount: 500,
    isRunning: false,
    results: null,
  });

  const [agentActions, setAgentActions] = useState<AgentAction[]>([]);
  const [actionHandlers, setActionHandlers] = useState<ActionHandlers>({});

  // Action management
  const addAgentAction = useCallback((action: Omit<AgentAction, 'id' | 'timestamp'>): string => {
    const id = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newAction: AgentAction = {
      ...action,
      id,
      timestamp: new Date(),
    };
    setAgentActions(prev => [...prev, newAction]);
    return id;
  }, []);

  const updateAgentAction = useCallback((id: string, updates: Partial<AgentAction>) => {
    setAgentActions(prev =>
      prev.map(action => (action.id === id ? { ...action, ...updates } : action))
    );
  }, []);

  const clearAgentActions = useCallback(() => {
    setAgentActions([]);
  }, []);

  // Register action handlers from SimulationStudioPage
  const registerHandlers = useCallback((handlers: ActionHandlers) => {
    setActionHandlers(handlers);
  }, []);

  // Direct state setters
  const setActiveTraits = useCallback((traits: TraitInfo[]) => {
    setState(prev => ({ ...prev, activeTraits: traits }));
  }, []);

  const setMotherGenotypeState = useCallback((genotype: ParentGenotype) => {
    setState(prev => ({ ...prev, motherGenotype: genotype }));
  }, []);

  const setFatherGenotypeState = useCallback((genotype: ParentGenotype) => {
    setState(prev => ({ ...prev, fatherGenotype: genotype }));
  }, []);

  const setSimulationCountState = useCallback((count: number) => {
    setState(prev => ({ ...prev, simulationCount: count }));
  }, []);

  const setResults = useCallback((results: any) => {
    setState(prev => ({ ...prev, results }));
  }, []);

  const setIsRunning = useCallback((isRunning: boolean) => {
    setState(prev => ({ ...prev, isRunning }));
  }, []);

  // Tool functions (these will be called by the agent)
  const addTrait = useCallback(async (traitKey: string): Promise<{ success: boolean; message: string }> => {
    const actionId = addAgentAction({
      type: 'add_trait',
      description: `Adding trait: ${traitKey}`,
      status: 'in_progress',
      details: { traitKey },
    });

    try {
      if (actionHandlers.onAddTrait) {
        await actionHandlers.onAddTrait(traitKey);
      }
      updateAgentAction(actionId, { status: 'completed' });
      return { success: true, message: `Trait ${traitKey} added successfully` };
    } catch (error) {
      updateAgentAction(actionId, { status: 'failed' });
      return { success: false, message: `Failed to add trait: ${error}` };
    }
  }, [addAgentAction, updateAgentAction, actionHandlers]);

  const addAllTraits = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    const actionId = addAgentAction({
      type: 'add_trait',
      description: 'Adding all available traits',
      status: 'in_progress',
      details: { all: true },
    });

    try {
      if (actionHandlers.onAddAllTraits) {
        await actionHandlers.onAddAllTraits();
      } else {
        updateAgentAction(actionId, { status: 'failed' });
        return { success: false, message: 'Add all traits handler not registered. Please refresh the page.' };
      }
      updateAgentAction(actionId, { status: 'completed' });
      return { success: true, message: 'All traits added successfully' };
    } catch (error) {
      updateAgentAction(actionId, { status: 'failed' });
      return { success: false, message: `Failed to add all traits: ${error}` };
    }
  }, [addAgentAction, updateAgentAction, actionHandlers]);

  const removeTrait = useCallback(async (traitKey: string): Promise<{ success: boolean; message: string }> => {
    const actionId = addAgentAction({
      type: 'remove_trait',
      description: `Removing trait: ${traitKey}`,
      status: 'in_progress',
      details: { traitKey },
    });

    try {
      if (actionHandlers.onRemoveTrait) {
        await actionHandlers.onRemoveTrait(traitKey);
      }
      updateAgentAction(actionId, { status: 'completed' });
      return { success: true, message: `Trait ${traitKey} removed successfully` };
    } catch (error) {
      updateAgentAction(actionId, { status: 'failed' });
      return { success: false, message: `Failed to remove trait: ${error}` };
    }
  }, [addAgentAction, updateAgentAction, actionHandlers]);

  const setMotherGenotype = useCallback(async (geneId: string, alleles: string[]): Promise<{ success: boolean; message: string }> => {
    const actionId = addAgentAction({
      type: 'set_genotype',
      description: `Setting mother's genotype for ${geneId}: ${alleles.join(', ')}`,
      status: 'in_progress',
      details: { parent: 'mother', geneId, alleles },
    });

    try {
      if (actionHandlers.onSetMotherGenotype) {
        await actionHandlers.onSetMotherGenotype(geneId, alleles);
      }
      updateAgentAction(actionId, { status: 'completed' });
      return { success: true, message: `Mother's genotype set for ${geneId}` };
    } catch (error) {
      updateAgentAction(actionId, { status: 'failed' });
      return { success: false, message: `Failed to set genotype: ${error}` };
    }
  }, [addAgentAction, updateAgentAction, actionHandlers]);

  const setFatherGenotype = useCallback(async (geneId: string, alleles: string[]): Promise<{ success: boolean; message: string }> => {
    const actionId = addAgentAction({
      type: 'set_genotype',
      description: `Setting father's genotype for ${geneId}: ${alleles.join(', ')}`,
      status: 'in_progress',
      details: { parent: 'father', geneId, alleles },
    });

    try {
      if (actionHandlers.onSetFatherGenotype) {
        await actionHandlers.onSetFatherGenotype(geneId, alleles);
      }
      updateAgentAction(actionId, { status: 'completed' });
      return { success: true, message: `Father's genotype set for ${geneId}` };
    } catch (error) {
      updateAgentAction(actionId, { status: 'failed' });
      return { success: false, message: `Failed to set genotype: ${error}` };
    }
  }, [addAgentAction, updateAgentAction, actionHandlers]);

  const randomizeAlleles = useCallback(async (parent: 'mother' | 'father' | 'both'): Promise<{ success: boolean; message: string }> => {
    const actionId = addAgentAction({
      type: 'randomize_alleles',
      description: `Randomizing alleles for ${parent}`,
      status: 'in_progress',
      details: { parent },
    });

    try {
      if (actionHandlers.onRandomizeAlleles) {
        await actionHandlers.onRandomizeAlleles(parent);
      }
      updateAgentAction(actionId, { status: 'completed' });
      return { success: true, message: `Alleles randomized for ${parent}` };
    } catch (error) {
      updateAgentAction(actionId, { status: 'failed' });
      return { success: false, message: `Failed to randomize alleles: ${error}` };
    }
  }, [addAgentAction, updateAgentAction, actionHandlers]);

  const setSimulationCount = useCallback(async (count: number): Promise<{ success: boolean; message: string }> => {
    const actionId = addAgentAction({
      type: 'set_simulation_count',
      description: `Setting simulation count to ${count}`,
      status: 'in_progress',
      details: { count },
    });

    try {
      if (actionHandlers.onSetSimulationCount) {
        await actionHandlers.onSetSimulationCount(count);
      }
      updateAgentAction(actionId, { status: 'completed' });
      return { success: true, message: `Simulation count set to ${count}` };
    } catch (error) {
      updateAgentAction(actionId, { status: 'failed' });
      return { success: false, message: `Failed to set simulation count: ${error}` };
    }
  }, [addAgentAction, updateAgentAction, actionHandlers]);

  const runSimulation = useCallback(async (): Promise<{ success: boolean; message: string; results?: any }> => {
    const actionId = addAgentAction({
      type: 'run_simulation',
      description: `Running simulation with ${state.simulationCount} offspring`,
      status: 'in_progress',
      details: { count: state.simulationCount },
    });

    try {
      if (actionHandlers.onRunSimulation) {
        await actionHandlers.onRunSimulation();
      } else {
        updateAgentAction(actionId, { status: 'failed' });
        return { success: false, message: 'Simulation handler not registered. Are you on the Simulation Studio page?' };
      }
      updateAgentAction(actionId, { status: 'completed' });
      return { success: true, message: 'Simulation completed successfully' };
    } catch (error) {
      updateAgentAction(actionId, { status: 'failed' });
      return { success: false, message: `Simulation failed: ${error}` };
    }
  }, [addAgentAction, updateAgentAction, state.simulationCount, actionHandlers]);

  const value: SimulationToolContextType = useMemo(() => ({
    state,
    agentActions,
    addTrait,
    addAllTraits,
    removeTrait,
    setMotherGenotype,
    setFatherGenotype,
    randomizeAlleles,
    setSimulationCount,
    runSimulation,
    setActiveTraits,
    setMotherGenotypeState,
    setFatherGenotypeState,
    setSimulationCountState,
    setResults,
    setIsRunning,
    registerHandlers,
    addAgentAction,
    updateAgentAction,
    clearAgentActions,
  }), [
    state,
    agentActions,
    addTrait,
    addAllTraits,
    removeTrait,
    setMotherGenotype,
    setFatherGenotype,
    randomizeAlleles,
    setSimulationCount,
    runSimulation,
    setActiveTraits,
    setMotherGenotypeState,
    setFatherGenotypeState,
    setSimulationCountState,
    setResults,
    setIsRunning,
    registerHandlers,
    addAgentAction,
    updateAgentAction,
    clearAgentActions,
  ]);

  return (
    <SimulationToolContext.Provider value={value}>
      {children}
    </SimulationToolContext.Provider>
  );
};

export const useSimulationTool = () => {
  const context = useContext(SimulationToolContext);
  if (context === undefined) {
    throw new Error('useSimulationTool must be used within a SimulationToolProvider');
  }
  return context;
};
