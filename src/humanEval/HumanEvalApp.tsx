import { useEffect, useMemo, useState } from 'react';
import { AuthGate, type AuthGateState } from '../components/AuthGate';
import { BuildVersionBadge } from '../components/BuildVersionBadge';
import {
  fetchHumanEvalCase,
  fetchHumanEvalCases,
  fetchHumanEvalRating,
  fetchHumanEvalSchema,
  saveHumanEvalRating,
  type HumanEvalAssignment,
  type HumanEvalCaseSummary,
  type HumanEvalRatingPayload,
} from '../services/humanEvalApi';
import { HumanEvalCaseList } from './HumanEvalCaseList';
import { HumanEvalCaseReader } from './HumanEvalCaseReader';
import { HumanEvalScorePanel } from './HumanEvalScorePanel';

function createEmptyRating(raterId: string): HumanEvalRatingPayload {
  return {
    rater_id: raterId,
    status: 'draft',
    stage_scores: {},
    role_scores: {},
  };
}

function HumanEvalShell({ auth }: { auth: AuthGateState }) {
  const defaultRaterId = auth.user?.email || auth.user?.id || 'rater_01';
  const [assignedCases, setAssignedCases] = useState<HumanEvalCaseSummary[]>([]);
  const [allCases, setAllCases] = useState<HumanEvalCaseSummary[]>([]);
  const [assignment, setAssignment] = useState<HumanEvalAssignment | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [caseData, setCaseData] = useState<unknown>(null);
  const [activeStage, setActiveStage] = useState('LC');
  const [rating, setRating] = useState<HumanEvalRatingPayload>(() => createEmptyRating(defaultRaterId));
  const [raterId, setRaterId] = useState(defaultRaterId);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!auth.backendConfigured || !auth.user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchHumanEvalCases(), fetchHumanEvalSchema()])
      .then(([casePayload]) => {
        if (cancelled) return;
        const nextAllCases = casePayload.all_cases || casePayload.cases || [];
        setAssignedCases(casePayload.assigned_cases);
        setAllCases(nextAllCases);
        setAssignment(casePayload.assignment);
        setSelectedCaseId(casePayload.assigned_cases[0]?.case_id || nextAllCases[0]?.case_id || null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : '人工评测材料加载失败'))
      .finally(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [auth.backendConfigured, auth.user]);

  useEffect(() => {
    if (!selectedCaseId) return;
    let cancelled = false;
    Promise.all([fetchHumanEvalCase(selectedCaseId), fetchHumanEvalRating(selectedCaseId)])
      .then(([casePayload, ratingPayload]) => {
        if (cancelled) return;
        setCaseData(casePayload.case);
        setActiveStage('LC');
        const savedRating = ratingPayload.rating as { payload?: HumanEvalRatingPayload; rater_id?: string } | null;
        const nextRating = savedRating?.payload || createEmptyRating(defaultRaterId);
        setRating(nextRating);
        setRaterId(savedRating?.rater_id || nextRating.rater_id || defaultRaterId);
      })
      .catch((err) => setError(err instanceof Error ? err.message : '案件材料加载失败'));
    return () => {
      cancelled = true;
    };
  }, [defaultRaterId, selectedCaseId]);

  const ratingWithRater = useMemo(() => ({ ...rating, rater_id: raterId }), [rating, raterId]);

  async function handleSave(status: 'draft' | 'submitted') {
    if (!selectedCaseId) return;
    setSaving(true);
    setError('');
    try {
      await saveHumanEvalRating(selectedCaseId, { ...ratingWithRater, status });
      const refreshed = await fetchHumanEvalCases();
      setAssignedCases(refreshed.assigned_cases);
      setAllCases(refreshed.all_cases || refreshed.cases || []);
      setAssignment(refreshed.assignment);
    } catch (err) {
      setError(err instanceof Error ? err.message : '评分保存失败');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="human-eval-loading">正在加载人工评测材料...</div>;
  }

  return (
    <div className="human-eval-page">
      <div className="human-eval-topbar">
        <button onClick={() => window.location.assign('/')} type="button">返回正式模拟</button>
        <a href="/api/human-eval/export.csv">导出 CSV</a>
      </div>
      {error && <div className="human-eval-error" role="alert">{error}</div>}
      <div className="human-eval-workbench">
        <HumanEvalCaseList
          assignedCases={assignedCases}
          allCases={allCases}
          assignment={assignment}
          selectedCaseId={selectedCaseId}
          onSelect={setSelectedCaseId}
        />
        <HumanEvalCaseReader caseData={caseData as never} activeStage={activeStage} onStageSelect={setActiveStage} />
        <HumanEvalScorePanel
          activeStage={activeStage}
          rating={ratingWithRater}
          raterId={raterId}
          onRaterIdChange={setRaterId}
          onRatingChange={setRating}
          onSave={handleSave}
          saving={saving}
        />
      </div>
      <BuildVersionBadge />
    </div>
  );
}

export function HumanEvalApp() {
  return (
    <AuthGate ensureWorkspace={false}>
      {(auth) => <HumanEvalShell auth={auth} />}
    </AuthGate>
  );
}
