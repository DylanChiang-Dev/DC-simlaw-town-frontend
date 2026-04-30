import type { DialogueScene } from '../data/runtimeScene';
import type { DialogueHistoryEntry } from '../state/vnEventReducer';
import { MarkdownText } from './MarkdownText';
import { formatRuntimeTechLabel } from './techDisplayNames';

type Props = {
  background?: DialogueHistoryEntry[];
  scene: DialogueScene;
};

export function TechLedger({ background = [], scene }: Props) {
  const hasTools = scene.tech.tools.length > 0;
  const hasSkills = scene.tech.skills.length > 0;
  const hasActiveAgent = Boolean(scene.tech.agent && scene.tech.agent !== '等待案件同步');
  const hasMemory = Boolean(scene.tech.memory && scene.tech.memory !== '等待真实案件状态恢复');
  const hasPipeline = Boolean(scene.tech.pipeline && scene.tech.pipeline !== '等待案件进展');
  const visibleBackground = scene.stageCode === 'RECEPTION'
    ? background.filter((entry) => entry.stageCode === 'RECEPTION').slice(-1)
    : [];

  return (
    <aside className="tech-ledger" aria-label="智能助手状态">
      <div className="ledger-kicker">AI Assistant</div>
      <h2>智能助手状态</h2>
      {hasActiveAgent && (
        <div className="ledger-agent">
          <span>当前助手</span>
          <strong>{scene.tech.agent}</strong>
        </div>
      )}
      {visibleBackground.length > 0 && (
        <div className="ledger-note background-consultation">
          <span>背景咨询</span>
          <div className="background-consultation-list">
            {visibleBackground.map((entry) => (
              <article key={entry.id}>
                <b>{entry.stageName} · {entry.speakerName}</b>
                <MarkdownText text={entry.text} />
              </article>
            ))}
          </div>
        </div>
      )}
      <div className="ledger-section">
        <span>工具</span>
        <div className="ledger-tags">
          {hasTools
            ? scene.tech.tools.map((tool) => <b key={tool}>{formatRuntimeTechLabel(tool)}</b>)
            : <em>等待工具调用</em>}
        </div>
      </div>
      <div className="ledger-section">
        <span>专业规则</span>
        <div className="ledger-tags">
          {hasSkills
            ? scene.tech.skills.map((skill) => <b key={skill}>{formatRuntimeTechLabel(skill)}</b>)
            : <em>等待技能调用</em>}
        </div>
      </div>
      {hasMemory && (
        <div className="ledger-note">
          <span>案件记忆</span>
          <p>{scene.tech.memory}</p>
        </div>
      )}
      {hasPipeline && (
        <div className="ledger-note">
          <span>流程阶段</span>
          <p>{scene.tech.pipeline}</p>
        </div>
      )}
    </aside>
  );
}
