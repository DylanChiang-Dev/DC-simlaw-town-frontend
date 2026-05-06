import { useCallback, useState } from 'react';
import type { OnboardingStepId } from './onboardingContent';

export const ONBOARDING_COMPLETED_STORAGE_KEY = 'simlaw-town:onboarding-v1-completed';
export const ONBOARDING_DISMISSED_STEPS_STORAGE_KEY = 'simlaw-town:onboarding-v1-dismissed-steps';

type DismissedStepMap = Record<string, true>;

export type OnboardingState = {
  completeOnboarding: () => void;
  guideOpen: boolean;
  isCompleted: boolean;
  isStepDismissed: (stepId: OnboardingStepId | null | undefined) => boolean;
  markStepDismissed: (stepId: OnboardingStepId) => void;
  openGuide: () => void;
  resetOnboarding: () => void;
  setGuideOpen: (open: boolean) => void;
};

export function useOnboardingState(): OnboardingState {
  const [guideOpen, setGuideOpen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(() => readCompleted());
  const [dismissedSteps, setDismissedSteps] = useState<DismissedStepMap>(() => readDismissedSteps());

  const persistDismissedSteps = useCallback((next: DismissedStepMap) => {
    setDismissedSteps(next);
    writeDismissedSteps(next);
  }, []);

  const markStepDismissed = useCallback((stepId: OnboardingStepId) => {
    persistDismissedSteps({ ...dismissedSteps, [stepId]: true });
  }, [dismissedSteps, persistDismissedSteps]);

  const completeOnboarding = useCallback(() => {
    setIsCompleted(true);
    writeCompleted(true);
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(ONBOARDING_COMPLETED_STORAGE_KEY);
    localStorage.removeItem(ONBOARDING_DISMISSED_STEPS_STORAGE_KEY);
    setIsCompleted(false);
    setDismissedSteps({});
    setGuideOpen(true);
  }, []);

  return {
    completeOnboarding,
    guideOpen,
    isCompleted,
    isStepDismissed: (stepId) => Boolean(stepId && dismissedSteps[stepId]),
    markStepDismissed,
    openGuide: () => setGuideOpen(true),
    resetOnboarding,
    setGuideOpen,
  };
}

function readCompleted(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_COMPLETED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeCompleted(value: boolean): void {
  try {
    localStorage.setItem(ONBOARDING_COMPLETED_STORAGE_KEY, value ? 'true' : 'false');
  } catch {
    // Onboarding should never break the app when browser storage is unavailable.
  }
}

function readDismissedSteps(): DismissedStepMap {
  try {
    const rawValue = localStorage.getItem(ONBOARDING_DISMISSED_STEPS_STORAGE_KEY);
    if (!rawValue) return {};
    const parsed = JSON.parse(rawValue);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.keys(parsed).filter((key) => parsed[key] === true).map((key) => [key, true]),
    );
  } catch {
    return {};
  }
}

function writeDismissedSteps(value: DismissedStepMap): void {
  try {
    localStorage.setItem(ONBOARDING_DISMISSED_STEPS_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Onboarding should never break the app when browser storage is unavailable.
  }
}
