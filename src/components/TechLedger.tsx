import type { DialogueScene } from '../data/runtimeScene';
import type { DialogueHistoryEntry } from '../state/vnEventReducer';
import { MarkdownText } from './MarkdownText';

type Props = {
  background?: DialogueHistoryEntry[];
  scene: DialogueScene;
};

export function TechLedger({ background = [], scene }: Props) {
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
      <div className="ledger-section">
        <span>Tool</span>
        <div className="ledger-tags">
          {scene.tech.tools.map((tool) => <b key={tool}>{tool}</b>)}
        </div>
      </div>
      <div className="ledger-section">
        <span>Skill</span>
        <div className="ledger-tags">
          {scene.tech.skills.map((skill) => <b key={skill}>{skill}</b>)}
        </div>
      </div>
      <div className="ledger-note">
        <span>Memory</span>
        <p>{scene.tech.memory}</p>
      </div>
      <div className="ledger-note">
        <span>Pipeline</span>
        <p>{scene.tech.pipeline}</p>
      </div>
    </aside>
  );
}
