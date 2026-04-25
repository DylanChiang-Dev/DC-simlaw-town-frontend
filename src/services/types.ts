export type AuthUser = {
  id: string;
  email: string;
  status: string;
  tokenVersion: number;
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
  expiresAt?: string;
};

export type AuthResponseUser = {
  id?: string;
  email?: string;
  status?: string;
  token_version?: number;
  tokenVersion?: number;
};

export type SimulationRuntimeError = {
  scope: 'sandbox';
  case_id: string;
  scenario_type: string;
  stage_label: string;
  code: string;
  message: string;
  retryable: boolean;
  occurred_at: string;
};

export type SandboxCaseStatus = 'idle' | 'running' | 'closed';

export type SandboxCaseSummary = {
  caseId: string;
  title: string;
  plaintiffName: string;
  defendantName: string;
  rawCaseCause: string;
  trainingCategory: string;
  difficulty: string;
  status: SandboxCaseStatus;
};

export type AgentCapability = {
  agentId: string;
  agentName: string;
  agentType: string;
  agentClass: string;
  agentRole: string;
  stageCode: string;
  caseId: string;
  isActive: boolean;
  configuredToolNames: string[];
  availableToolNames: string[];
  actualToolCalls: string[];
  actualToolCallCount: number;
  skillLoadCount: number;
  skillNames: string[];
  availableSkillNames: string[];
  hasSkillTool: boolean;
  isPlayerAgent: boolean;
};

export type SimulationStatus = {
  status: string;
  sessionStatus: string;
  sessionId: string | null;
  selectedCaseId: string;
  paused: boolean;
  simulationRunning: boolean;
  clientsConnected: number;
  activeCases: number;
  canStart: boolean;
  canPause: boolean;
  canRestart: boolean;
  lastError: SimulationRuntimeError | null;
  agentCapabilities: AgentCapability[];
};

export type PlayerLawyerRequestStatus = 'pending' | 'submitted' | 'cancelled' | 'expired';

export type PlayerLawyerRequest = {
  requestId: string;
  sandboxId: number;
  caseId: string;
  stage: string;
  role: string;
  speakerLabel: string;
  prompt: string;
  contextSummary: string;
  status: PlayerLawyerRequestStatus | string;
  message: string;
  createdAt: string;
  submittedAt?: string | null;
};

export type PlayerLawyerStatus = {
  playerMode: string;
  enabled: boolean;
};

export type PlayerLawyerSkill = {
  skillId: string;
  documentType: string;
  name: string;
  description: string;
  path: string;
};

export type PlayerLawyerDocumentDraft = {
  draftId: string;
  requestId: string;
  sandboxId: number;
  caseId: string;
  documentType: string;
  skillId: string;
  playerPrompt: string;
  playerDraft: string;
  documentText: string;
  confirmed: boolean;
  finishReason: string;
  pdfPath: string;
  createdAt: string;
  confirmedAt?: string | null;
};

export type PlayerLawyerDocumentAssistInput = {
  caseId: string;
  documentType: string;
  skillId: string;
  playerPrompt: string;
  playerDraft?: string;
  requestId?: string;
};

export type PlayerLawyerDocumentConfirmInput = {
  draftId: string;
  documentText: string;
};

export type CaseDocumentEntry = {
  caseId: string;
  documentKey: string;
  stage: string;
  documentType: string;
  title: string;
  fileName: string;
  available: boolean;
  downloadUrl: string;
};
