import type { OnboardingStepId } from './onboardingContent';

type OnboardingRuntimeInput = {
  caseClosed: boolean;
  casePickerOpen: boolean;
  documentFollowupCount: number;
  finalCaseClosedLineAcknowledged: boolean;
  nextUnacknowledgedStoryEntryId: string;
  visiblePlayerRequestStage: string;
};

const DOCUMENT_STAGES = new Set(['CD', 'DD', 'AD', 'AR']);
const COURT_STAGES = new Set(['CI', 'CIA']);
const MIN_DOCUMENT_FOLLOWUPS_BEFORE_DRAFTING = 2;

export function getCurrentOnboardingStepId(input: OnboardingRuntimeInput): OnboardingStepId | null {
  if (input.nextUnacknowledgedStoryEntryId) {
    return null;
  }

  if (input.caseClosed && input.finalCaseClosedLineAcknowledged) {
    return 'closing-score';
  }

  const stage = String(input.visiblePlayerRequestStage || '').toUpperCase();
  if (DOCUMENT_STAGES.has(stage)) {
    return input.documentFollowupCount < MIN_DOCUMENT_FOLLOWUPS_BEFORE_DRAFTING
      ? 'document-followup'
      : 'document-drafting';
  }
  if (COURT_STAGES.has(stage)) {
    return 'court-argument';
  }
  if (stage) {
    return 'text-input';
  }

  if (input.casePickerOpen) {
    return 'case-picker';
  }

  return 'opening-dialogue';
}
