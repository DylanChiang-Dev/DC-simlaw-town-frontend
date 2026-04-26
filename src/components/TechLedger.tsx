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
  const hasBackground = background.length > 0;
  const hasActiveAgent = Boolean(scene.tech.agent && scene.tech.agent !== '等待后端同步');
  const hasMeaningfulRuntime = Boolean(
    hasTools
    || hasSkills
    || hasBackground
    || hasActiveAgent
    || (scene.tech.memory && scene.tech.memory !== '等待真实案件状态恢复')
    || (scene.tech.pipeline && scene.tech.pipeline !== '等待后端事件')
  );

  if (!hasMeaningfulRuntime) return null;

  return (
    <aside className="tech-ledger" aria-label="技术账本">
      <div className="ledger-kicker">Agent Runtime</div>
      <h2>{scene.tech.agent}</h2>
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
      {hasTools && (
        <div className="ledger-section">
          <span>Tool</span>
          <div className="ledger-tags">
            {scene.tech.tools.map((tool) => <b key={tool}>{tool}</b>)}
          </div>
        </div>
      )}
      {hasSkills && (
        <div className="ledger-section">
          <span>Skill</span>
          <div className="ledger-tags">
            {scene.tech.skills.map((skill) => <b key={skill}>{skill}</b>)}
          </div>
        </div>
      )}
      {scene.tech.memory && scene.tech.memory !== '等待真实案件状态恢复' && (
        <div className="ledger-note">
          <span>Memory</span>
          <p>{scene.tech.memory}</p>
        </div>
      )}
      {scene.tech.pipeline && scene.tech.pipeline !== '等待后端事件' && (
        <div className="ledger-note">
          <span>Pipeline</span>
          <p>{scene.tech.pipeline}</p>
        </div>
      )}
    </aside>
  );
}
