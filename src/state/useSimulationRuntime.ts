import { useCallback, useEffect, useState } from 'react';
import {
  fetchSandboxCases,
  fetchSimulationStatus,
  restartSimulation,
  startSimulation,
} from '../services/sandboxApi';
import type { SandboxCaseSummary, SimulationStatus } from '../services/types';

export type SimulationRuntimeState = {
  activeCaseId: string;
  cases: SandboxCaseSummary[];
  error: string;
  loading: boolean;
  selectedCaseId: string;
  simulation: SimulationStatus | null;
  refresh: () => Promise<void>;
  selectCase: (caseId: string) => void;
  startSelectedCase: (caseId?: string) => Promise<void>;
  restart: () => Promise<void>;
};

function resolveActiveCaseId(simulation: SimulationStatus | null, cases: SandboxCaseSummary[]): string {
  const status = simulation?.status || '';
  if (!simulation?.simulationRunning && status !== 'running' && status !== 'paused') return '';
  return simulation?.selectedCaseId || cases.find((item) => item.status === 'running')?.caseId || '';
}

function resolveSelectedCaseId(
  current: string,
  simulation: SimulationStatus | null,
  cases: SandboxCaseSummary[],
): string {
  const activeCaseId = resolveActiveCaseId(simulation, cases);
  if (activeCaseId) return activeCaseId;
  if (current && cases.some((item) => item.caseId === current)) return current;
  return cases[0]?.caseId || '';
}

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
      setSelectedCaseId((current) => resolveSelectedCaseId(current, nextSimulation, nextCases));
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
      setSelectedCaseId((current) => resolveSelectedCaseId(current, nextSimulation, nextCases));
    } catch (err) {
      setError(err instanceof Error ? err.message : '案件操作失败');
      try {
        const [nextSimulation, nextCases] = await Promise.all([
          fetchSimulationStatus(),
          fetchSandboxCases(),
        ]);
        setSimulation(nextSimulation);
        setCases(nextCases);
        setSelectedCaseId((current) => resolveSelectedCaseId(current, nextSimulation, nextCases));
      } catch {
        // Keep the original control error visible.
      }
    } finally {
      setLoading(false);
    }
  }

  const activeCaseId = resolveActiveCaseId(simulation, cases);

  return {
    activeCaseId,
    cases,
    error,
    loading,
    selectedCaseId,
    simulation,
    refresh,
    selectCase: setSelectedCaseId,
    startSelectedCase: async (caseId?: string) => {
      const nextCaseId = caseId || activeCaseId || selectedCaseId;
      if (activeCaseId && nextCaseId && activeCaseId !== nextCaseId) {
        await refresh();
        setError('当前已有其他案件在运行，请先继续当前案件或重置后再选择新案件');
        return;
      }
      await runControl(() => startSimulation(nextCaseId || undefined));
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
