import { useEffect, useMemo, useState } from 'react';
import {
  confirmPlayerLawyerDocumentDraft,
  createPlayerLawyerDocumentDraft,
  fetchPlayerLawyerDocumentSkills,
} from '../services/playerLawyerApi';
import { MarkdownText } from './MarkdownText';
import type { PlayerLawyerDocumentDraft, PlayerLawyerRequest, PlayerLawyerSkill } from '../services/types';

const STAGE_DOCUMENT_TYPES: Record<string, string> = {
  CD: 'CD',
  DD: 'DD',
  AD: 'AD',
  AR: 'AR',
};

const STAGE_SKILL_IDS: Record<string, string> = {
  CD: 'lawyer-complaint-drafting',
  DD: 'lawyer-defense-drafting',
  AD: 'lawyer-appeal-drafting',
  AR: 'lawyer-appeal-response-drafting',
};

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirmed?: () => Promise<void> | void;
  request?: PlayerLawyerRequest | null;
};

export function DocumentWorkbench({ open, onClose, onConfirmed, request }: Props) {
  const [draft, setDraft] = useState<PlayerLawyerDocumentDraft | null>(null);
  const [documentText, setDocumentText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [playerDraft, setPlayerDraft] = useState('');
  const [playerPrompt, setPlayerPrompt] = useState('');
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [skills, setSkills] = useState<PlayerLawyerSkill[]>([]);

  const stage = String(request?.stage || '').toUpperCase();
  const documentType = STAGE_DOCUMENT_TYPES[stage] || 'CD';
  const liveMode = Boolean(request?.requestId && STAGE_DOCUMENT_TYPES[stage]);

  const selectedSkill = useMemo(
    () => skills.find((skill) => skill.skillId === selectedSkillId) || null,
    [selectedSkillId, skills],
  );

  useEffect(() => {
    if (!open) return;
    setDraft(null);
    setDocumentText('');
    setError('');
    setPlayerDraft('');
    setPlayerPrompt(request?.prompt || '');

    if (!liveMode) return;
    setLoading(true);
    fetchPlayerLawyerDocumentSkills()
      .then((items) => {
        setSkills(items);
        const preferred = STAGE_SKILL_IDS[stage];
        setSelectedSkillId(
          items.find((item) => item.skillId === preferred)?.skillId || items[0]?.skillId || '',
        );
      })
      .catch((err) => setError(err instanceof Error ? err.message : '读取文书 Skill 失败'))
      .finally(() => setLoading(false));
  }, [liveMode, open, request?.prompt, request?.requestId, stage]);

  if (!open) return null;

  async function handleGenerateDraft(): Promise<void> {
    if (!request || !selectedSkillId) return;
    setLoading(true);
    setError('');
    try {
      const nextDraft = await createPlayerLawyerDocumentDraft({
        caseId: request.caseId,
        documentType,
        skillId: selectedSkillId,
        playerPrompt,
        playerDraft,
        requestId: request.requestId,
      });
      setDraft(nextDraft);
      setDocumentText(nextDraft.documentText);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成文书草稿失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmDraft(): Promise<void> {
    if (!draft || !documentText.trim()) return;
    setLoading(true);
    setError('');
    try {
      await confirmPlayerLawyerDocumentDraft({
        draftId: draft.draftId,
        documentText: documentText.trim(),
      });
      await onConfirmed?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '确认文书失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-label="文书起草工作台">
      <section className={`document-workbench ${liveMode ? 'document-workbench-live' : ''}`}>
        <button className="close-button" type="button" onClick={onClose} aria-label="关闭">×</button>
        {!liveMode && <img src="/art/vn/bg-case-analysis-room.png" alt="文书起草与案件研判工作台" />}
        <div className="document-copy">
          <div className="panel-kicker">Document Assist</div>
          <h2>{liveMode ? '文书任务' : '起诉状模板化输入'}</h2>
          {!liveMode ? (
            <>
              <p>用户不需要从零写法律文书。系统把案件事实、争议焦点、证据目录和诉讼请求拆成可填写字段，再由 Skill 约束文书格式。</p>
              <div className="document-fields">
                <span>诉讼请求</span>
                <span>事实与理由</span>
                <span>证据目录</span>
                <span>法院与案由</span>
              </div>
              <button className="primary-action wide" type="button" onClick={onClose}>关闭文书预览</button>
            </>
          ) : (
            <>
              <MarkdownText
                fallback="系统会读取当前案件上下文，并用选中的文书 Skill 生成可编辑草稿。"
                text={request?.contextSummary}
              />
              <div className="document-live-grid">
                <label>
                  <span>文书 Skill</span>
                  <select
                    disabled={loading}
                    onChange={(event) => setSelectedSkillId(event.target.value)}
                    value={selectedSkillId}
                  >
                    {skills.map((skill) => (
                      <option key={skill.skillId} value={skill.skillId}>
                        {skill.name || skill.skillId}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>用户提示</span>
                  <textarea
                    disabled={loading}
                    onChange={(event) => setPlayerPrompt(event.target.value)}
                    placeholder="请说明文书起草重点..."
                    value={playerPrompt}
                  />
                </label>
                <label>
                  <span>用户草稿（可选）</span>
                  <textarea
                    disabled={loading}
                    onChange={(event) => setPlayerDraft(event.target.value)}
                    placeholder="已有草稿可粘贴在这里..."
                    value={playerDraft}
                  />
                </label>
              </div>
              {selectedSkill && <p className="document-skill-description">{selectedSkill.description}</p>}
              {draft && (
                <label className="document-output">
                  <span>生成草稿</span>
                  <textarea
                    disabled={loading}
                    onChange={(event) => setDocumentText(event.target.value)}
                    value={documentText}
                  />
                </label>
              )}
              {error && <div className="document-error" role="alert">{error}</div>}
              <div className="document-actions">
                <button
                  className="secondary-action"
                  disabled={loading || !selectedSkillId}
                  onClick={() => void handleGenerateDraft()}
                  type="button"
                >
                  {loading && !draft ? '生成中' : '生成草稿'}
                </button>
                <button
                  className="primary-action"
                  disabled={loading || !draft || !documentText.trim()}
                  onClick={() => void handleConfirmDraft()}
                  type="button"
                >
                  {loading && draft ? '确认中' : '确认草稿并继续流程'}
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
