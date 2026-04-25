import { authenticatedFetch, readJsonResponse } from './apiClient';
import type { AgentCapability, SandboxCaseStatus, SandboxCaseSummary, SimulationRuntimeError, SimulationStatus } from './types';

type AgentCapabilityResponse = {
  agent_id?: string;
  agent_name?: string;
  agent_type?: string;
  agent_class?: string;
  agent_role?: string;
  stage_code?: string;
  case_id?: string;
  is_active?: boolean;
  configured_tool_names?: string[];
  available_tool_names?: string[];
  actual_tool_calls?: string[];
  actual_tool_call_count?: number;
  skill_load_count?: number;
  skill_names?: string[];
  available_skill_names?: string[];
  has_skill_tool?: boolean;
  is_player_agent?: boolean;
};

type SandboxStatusResponse = {
  status: string;
  session_id?: string | null;
  selected_case_id?: string | null;
  active_cases: number;
  clients_connected: number;
  can_start: boolean;
  can_pause: boolean;
  can_restart: boolean;
  last_error?: SimulationRuntimeError | null;
  agent_capabilities?: AgentCapabilityResponse[];
};

type SimulationControlResponse = {
  success: boolean;
  sandbox: SandboxStatusResponse;
  reload_required?: boolean;
};

type SandboxCaseSummaryResponse = {
  case_id: string;
  title: string;
  plaintiff_name: string;
  defendant_name: string;
  raw_case_cause: string;
  training_category: string;
  difficulty: string;
  status: SandboxCaseStatus;
};

function mapStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item || '').trim()).filter(Boolean)
    : [];
}

function mapAgentCapability(payload: AgentCapabilityResponse): AgentCapability {
  return {
    agentId: payload.agent_id || '',
    agentName: payload.agent_name || payload.agent_id || '',
    agentType: payload.agent_type || '',
    agentClass: payload.agent_class || '',
    agentRole: payload.agent_role || '',
    stageCode: payload.stage_code || '',
    caseId: payload.case_id || '',
    isActive: Boolean(payload.is_active),
    configuredToolNames: mapStringList(payload.configured_tool_names),
    availableToolNames: mapStringList(payload.available_tool_names),
    actualToolCalls: mapStringList(payload.actual_tool_calls),
    actualToolCallCount: Number(payload.actual_tool_call_count || 0),
    skillLoadCount: Number(payload.skill_load_count || 0),
    skillNames: mapStringList(payload.skill_names),
    availableSkillNames: mapStringList(payload.available_skill_names),
    hasSkillTool: Boolean(payload.has_skill_tool),
    isPlayerAgent: Boolean(payload.is_player_agent),
  };
}

function mapSandboxStatus(payload: SandboxStatusResponse): SimulationStatus {
  return {
    status: payload.status,
    sessionStatus: payload.status,
    sessionId: payload.session_id ?? null,
    selectedCaseId: payload.selected_case_id || '',
    paused: payload.status === 'paused',
    simulationRunning: payload.status === 'running',
    clientsConnected: payload.clients_connected,
    activeCases: payload.active_cases,
    canStart: payload.can_start,
    canPause: payload.can_pause,
    canRestart: payload.can_restart,
    lastError: payload.last_error ?? null,
    agentCapabilities: Array.isArray(payload.agent_capabilities)
      ? payload.agent_capabilities.map(mapAgentCapability)
      : [],
  };
}

function mapSandboxCaseSummary(payload: SandboxCaseSummaryResponse): SandboxCaseSummary {
  return {
    caseId: payload.case_id,
    title: payload.title,
    plaintiffName: payload.plaintiff_name,
    defendantName: payload.defendant_name,
    rawCaseCause: payload.raw_case_cause,
    trainingCategory: payload.training_category,
    difficulty: payload.difficulty,
    status: payload.status,
  };
}

export async function ensureSandbox(): Promise<SimulationStatus> {
  const response = await authenticatedFetch('/api/sandbox/ensure', { method: 'POST' });
  const payload = await readJsonResponse<SimulationControlResponse>(response);
  return mapSandboxStatus(payload.sandbox);
}

export async function fetchSimulationStatus(): Promise<SimulationStatus> {
  const response = await authenticatedFetch('/api/sandbox', { method: 'GET' });
  const payload = await readJsonResponse<SandboxStatusResponse>(response);
  return mapSandboxStatus(payload);
}

export async function fetchSandboxCases(): Promise<SandboxCaseSummary[]> {
  const response = await authenticatedFetch('/api/sandbox/cases', { method: 'GET' });
  const payload = await readJsonResponse<{ cases?: SandboxCaseSummaryResponse[] }>(response);
  return Array.isArray(payload.cases) ? payload.cases.map(mapSandboxCaseSummary) : [];
}

export async function startSimulation(caseId?: string): Promise<SimulationStatus> {
  const response = await authenticatedFetch('/api/sandbox/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: caseId ? JSON.stringify({ case_id: caseId }) : undefined,
  });
  const payload = await readJsonResponse<SimulationControlResponse>(response);
  return mapSandboxStatus(payload.sandbox);
}

export async function pauseSimulation(): Promise<SimulationStatus> {
  const response = await authenticatedFetch('/api/sandbox/pause', { method: 'POST' });
  const payload = await readJsonResponse<SimulationControlResponse>(response);
  return mapSandboxStatus(payload.sandbox);
}

export async function restartSimulation(): Promise<{ simulation: SimulationStatus; reloadRequired: boolean }> {
  const response = await authenticatedFetch('/api/sandbox/restart', { method: 'POST' });
  const payload = await readJsonResponse<SimulationControlResponse>(response);
  return {
    simulation: mapSandboxStatus(payload.sandbox),
    reloadRequired: Boolean(payload.reload_required),
  };
}
