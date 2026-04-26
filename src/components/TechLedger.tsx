import type { DialogueScene } from '../data/runtimeScene';
import type { DialogueHistoryEntry } from '../state/vnEventReducer';
import { MarkdownText } from './MarkdownText';

type Props = {
  background?: DialogueHistoryEntry[];
  scene: DialogueScene;
};

export function TechLedger({ background = [], scene }: Props) {
  const hasTools = scene.tech.tools.length > 0;
  const hasSkills = scene.tech.skills.length > 0;
  const hasActiveAgent = Boolean(scene.tech.agent && scene.tech.agent !== '等待后端同步');
  const hasMemory = Boolean(scene.tech.memory && scene.tech.memory !== '等待真实案件状态恢复');
  const hasPipeline = Boolean(scene.tech.pipeline && scene.tech.pipeline !== '等待后端事件');

  return (
    <aside className="tech-ledger" aria-label="技术账本">
      <div className="ledger-kicker">Agent Tools / Skills</div>
      <h2>Agent 工具与技能</h2>
      {hasActiveAgent && (
        <div className="ledger-agent">
          <span>当前 Agent</span>
          <strong>{scene.tech.agent}</strong>
        </div>
      )}
      {background.length > 0 && (
        <div className="ledger-note background-consultation">
          <span>背景咨询</span>
          <div className="background-consultation-list">
            {background.slice(-3).map((entry) => (
              <article key={entry.id}>
                <b>{entry.stageName}</b>
                <MarkdownText text={entry.text} />
              </article>
            ))}
          </div>
        </div>
      )}
      <div className="ledger-section">
        <span>Tool</span>
        <div className="ledger-tags">
          {hasTools
            ? scene.tech.tools.map((tool) => <b key={tool}>{tool}</b>)
            : <em>等待工具调用</em>}
        </div>
      </div>
      <div className="ledger-section">
        <span>Skill</span>
        <div className="ledger-tags">
          {hasSkills
            ? scene.tech.skills.map((skill) => <b key={skill}>{skill}</b>)
            : <em>等待技能调用</em>}
        </div>
      </div>
      {hasMemory && (
        <div className="ledger-note">
          <span>Memory</span>
          <p>{scene.tech.memory}</p>
        </div>
      )}
      {hasPipeline && (
        <div className="ledger-note">
          <span>Pipeline</span>
          <p>{scene.tech.pipeline}</p>
        </div>
      )}
    </aside>
  );
}
