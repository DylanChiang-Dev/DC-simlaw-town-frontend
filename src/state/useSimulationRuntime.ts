import { useCallback, useEffect, useState } from 'react';
import {
  fetchSandboxCases,
  fetchSimulationStatus,
  pauseSimulation,
  restartSimulation,
  startSimulation,
} from '../services/sandboxApi';
import type { SandboxCaseSummary, SimulationStatus } from '../services/types';

export type SimulationRuntimeState = {
  cases: SandboxCaseSummary[];
  error: string;
  loading: boolean;
  selectedCaseId: string;
  simulation: SimulationStatus | null;
  refresh: () => Promise<void>;
  selectCase: (caseId: string) => void;
  startSelectedCase: (caseId?: string) => Promise<void>;
  pause: () => Promise<void>;
  restart: () => Promise<void>;
};

export function useSimulationRuntime(enabled: boolean): SimulationRuntimeState {
  const [cases, setCases] = useState<SandboxCaseSummary[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [simulation, setSimulation] = useState<SimulationStatus | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError('');
    try {
      const [nextSimulation, nextCases] = await Promise.all([
        fetchSimulationStatus(),
        fetchSandboxCases(),
      ]);
      setSimulation(nextSimulation);
      setCases(nextCases);
      setSelectedCaseId((current) => current || nextCases[0]?.caseId || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : '读取案件运行状态失败');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function runControl(operation: () => Promise<SimulationStatus>): Promise<void> {
    setLoading(true);
    setError('');
    try {
      const nextSimulation = await operation();
      setSimulation(nextSimulation);
      const nextCases = await fetchSandboxCases();
      setCases(nextCases);
    } catch (err) {
      setError(err instanceof Error ? err.message : '案件操作失败');
    } finally {
      setLoading(false);
    }
  }

  return {
    cases,
    error,
    loading,
    selectedCaseId,
    simulation,
    refresh,
    selectCase: setSelectedCaseId,
    startSelectedCase: async (caseId?: string) => {
      const nextCaseId = caseId || selectedCaseId;
      await runControl(() => startSimulation(nextCaseId || undefined));
    },
    pause: async () => {
      await runControl(pauseSimulation);
    },
    restart: async () => {
      setLoading(true);
      setError('');
      try {
        const result = await restartSimulation();
        setSimulation(result.simulation);
        const nextCases = await fetchSandboxCases();
        setCases(nextCases);
        setSelectedCaseId(nextCases[0]?.caseId || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : '重置案件运行区失败');
      } finally {
        setLoading(false);
      }
    },
  };
}
