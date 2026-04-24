import { agents } from '../data/demo';

export function TechShowcasePanel() {
  return (
    <aside className="tech-panel panel">
      <div className="panel-kicker">技术展示</div>
      <h2>Agent / Tool / Skill</h2>
      <img src="/art/agent-tool-lab.png" alt="Agent 工具实验室插图" />
      <div className="agent-list">
        {agents.map((agent) => (
          <article className="agent-card" key={agent.name}>
            <div>
              <strong>{agent.name}</strong>
              <span>{agent.role}</span>
            </div>
            <p>{agent.status}</p>
            <div className="tag-row">
              {agent.tools.slice(0, 2).map((tool) => <span key={tool}>{tool}</span>)}
              {agent.skills.slice(0, 1).map((skill) => <span className="skill-tag" key={skill}>{skill}</span>)}
            </div>
          </article>
        ))}
      </div>
    </aside>
  );
}
