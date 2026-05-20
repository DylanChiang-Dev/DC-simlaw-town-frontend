import type { CharacterKey } from '../data/runtimeScene';
import type { CaseClosingEvaluation, CaseDocumentEntry } from '../services/types';

export type DemoStageCode = 'PLC' | 'CD' | 'DLC' | 'DD' | 'CI' | 'AD' | 'AR' | 'CIA';

export type DemoTaskKind = 'reply' | 'document' | 'court';

export type DemoTask = {
  kind: DemoTaskKind;
  prompt: string;
  contextSummary: string;
  presetText: string;
  followups?: Array<{ question: string; answer: string }>;
  polishedText?: string;
};

export type DemoDialogueEntry = {
  speaker: CharacterKey;
  speakerName: string;
  text: string;
  playerResponsibility?: boolean;
};

export type DemoStage = {
  code: DemoStageCode;
  title: string;
  sceneText: string;
  speaker: CharacterKey;
  speakerName: string;
  entries: DemoDialogueEntry[];
  task?: DemoTask;
  document?: {
    title: string;
    fileName: string;
    text: string;
  };
  activeTools: string[];
  activeSkills: string[];
  memory: string;
  pipeline: string;
};

export type DemoCase = {
  caseId: string;
  title: string;
  plaintiffName: string;
  defendantName: string;
  trainingCategory: string;
  difficulty: string;
  summary: string;
  plaintiffKey: CharacterKey;
  defendantKey: CharacterKey;
  stages: DemoStage[];
  documents: CaseDocumentEntry[];
  closing: {
    finalJudgment: string;
    playerTurnCount: number;
    evaluation: CaseClosingEvaluation;
  };
};

export type DemoRunStep =
  | { type: 'stage'; stageIndex: number; entryIndex: number }
  | { type: 'task'; stageIndex: number }
  | { type: 'document'; stageIndex: number }
  | { type: 'closing' };
