import { useState } from 'react';
import type { DialogueScene } from '../data/runtimeScene';
import type { RuntimeTechCatalogItem } from '../services/types';
import type { DialogueHistoryEntry } from '../state/vnEventReducer';
import { MarkdownText } from './MarkdownText';
import { getRuntimeTechDisplayName } from './techDisplayNames';

type Props = {
  background?: DialogueHistoryEntry[];
  scene: DialogueScene;
};

export function TechLedger({ background = [], scene }: Props) {
  const [extensionsOpen, setExtensionsOpen] = useState(false);
  const catalog = scene.tech.catalog;
  const coreTools = catalog?.tools.core || buildFallbackItems(scene.tech.tools, '运行工具');
  const runtimeSkills = catalog?.skills.runtime || buildFallbackItems(scene.tech.skills, '专业技能');
  const extensionTools = catalog?.tools.extension || [];
  const hasActiveAgent = Boolean(scene.tech.agent && scene.tech.agent !== '等待案件同步');
  const hasMemory = Boolean(scene.tech.memory && scene.tech.memory !== '等待真实案件状态恢复');
  const hasPipeline = Boolean(scene.tech.pipeline && scene.tech.pipeline !== '等待案件进展');
  const visibleBackground = scene.stageCode === 'RECEPTION'
    ? background.filter((entry) => entry.stageCode === 'RECEPTION').slice(-1)
    : [];

  return (
    <aside className="tech-ledger" aria-label="工具与技能面板">
      <div className="ledger-kicker">AI Assistant</div>
      <h2>工具与技能面板</h2>
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
      <RuntimeTechGroup
        activeIds={scene.tech.activeTools}
        emptyText="等待工具目录"
        items={coreTools}
        title="运行工具"
        usageCounts={scene.tech.usedTools}
      />
      <RuntimeTechGroup
        activeIds={scene.tech.activeSkills}
        emptyText="等待技能目录"
        items={runtimeSkills}
        title="专业技能"
        usageCounts={scene.tech.usedSkills}
      />
      <div className="ledger-section runtime-tech-collapsible">
        <button
          aria-expanded={extensionsOpen}
          className="runtime-tech-toggle"
          onClick={() => setExtensionsOpen((open) => !open)}
          type="button"
        >
          <span>扩展能力</span>
          <b>{extensionTools.length}</b>
        </button>
        {extensionsOpen && (
          <RuntimeTechList
            activeIds={scene.tech.activeTools}
            emptyText="暂无扩展能力"
            items={extensionTools}
            usageCounts={scene.tech.usedTools}
          />
        )}
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

function RuntimeTechGroup({
  activeIds,
  emptyText,
  items,
  title,
  usageCounts,
}: {
  activeIds: string[];
  emptyText: string;
  items: RuntimeTechCatalogItem[];
  title: string;
  usageCounts: Record<string, number>;
}) {
  return (
    <div className="ledger-section">
      <span>{title}</span>
      <RuntimeTechList activeIds={activeIds} emptyText={emptyText} items={items} usageCounts={usageCounts} />
    </div>
  );
}

function RuntimeTechList({
  activeIds,
  emptyText,
  items,
  usageCounts,
}: {
  activeIds: string[];
  emptyText: string;
  items: RuntimeTechCatalogItem[];
  usageCounts: Record<string, number>;
}) {
  if (items.length === 0) {
    return <div className="ledger-tags"><em>{emptyText}</em></div>;
  }
  const activeSet = new Set(activeIds);
  return (
    <div className="runtime-tech-grid">
      {items.map((item) => {
        const usedCount = usageCounts[item.id] || 0;
        const active = activeSet.has(item.id);
        const className = `tech-item${active ? ' active' : ''}${usedCount > 0 ? ' used' : ''}`;
        return (
          <article className={className} key={item.id} title={item.description || item.id}>
            <div className="tech-item-main">
              <strong>{item.displayName || getRuntimeTechDisplayName(item.id)}</strong>
              <code>{item.id}</code>
            </div>
            <span>{active ? '调用中' : usedCount > 0 ? `已用 ${usedCount}` : '待命'}</span>
          </article>
        );
      })}
    </div>
  );
}

function buildFallbackItems(ids: string[], category: string): RuntimeTechCatalogItem[] {
  return ids.map((id) => ({
    id,
    displayName: getRuntimeTechDisplayName(id),
    category,
    description: '',
    runtimeStatus: 'observed',
  }));
}
