import type { DialogueScene } from '../data/runtimeScene';
import {
  LAWFIRM_INTERNAL_NODES,
  TOWN_RADAR_LOCATIONS,
  getStageRadarDestination,
  type LawfirmInternalNodeId,
  type RadarActor,
  type StageRadarDestination,
  type TownRadarLocationId,
} from '../data/townRadarModel';
import type { TownRadarRuntimeState } from '../state/useTownRadarRuntime';
import { getRuntimeTechDisplayName } from './techDisplayNames';

type Props = {
  radar: TownRadarRuntimeState & { visibleActors: RadarActor[] };
  scene: DialogueScene;
};

export function TownRadar({ radar, scene }: Props) {
  const destination = getVisibleRadarDestination(scene.stageCode, radar.visibleActors);
  const actorLayouts = getActorLayouts(radar.visibleActors, destination.locationId);
  const recentCapabilities = [...scene.tech.activeTools, ...scene.tech.activeSkills]
    .filter(Boolean)
    .slice(0, 2)
    .map(getRuntimeTechDisplayName);

  return (
    <section className="town-radar" aria-label="小镇运行雷达">
      <div className="town-radar-header">
        <div>
          <span>Town Radar</span>
          <strong>小镇运行雷达</strong>
        </div>
        <b>{scene.stageCode} · {scene.stageName}</b>
      </div>
      <div className="town-radar-map" aria-hidden="true">
        <span className="town-radar-labels-source">律所 A 律所 B 一审法院 二审法院 前台 咨询室 律师工位/文书起草</span>
        {TOWN_RADAR_LOCATIONS.map((location) => (
          <div
            className={`town-radar-location ${location.id === destination.locationId ? 'active' : ''}`}
            key={location.id}
            style={{ left: `${location.x}%`, top: `${location.y}%` }}
          >
            <strong>{location.label}</strong>
            {(location.id === 'lawfirmA' || location.id === 'lawfirmB') && (
              <div className="town-radar-lawfirm-nodes">
                {LAWFIRM_INTERNAL_NODES.map((node) => (
                  <span className={destination.locationId === location.id && destination.nodeId === node.id ? 'active' : ''} key={node.id}>
                    {node.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        <svg className="town-radar-routes" viewBox="0 0 100 100" focusable="false">
          <path d="M22 38 C28 52 30 64 28 72" />
          <path d="M78 38 C72 52 70 64 72 72" />
          <path d="M34 78 C46 70 58 70 66 78" />
        </svg>
        {actorLayouts.map(({ actor, style }) => (
          <span
            aria-hidden="true"
            className={`town-radar-actor town-radar-actor-dot ${actor.kind} ${actor.active ? 'active' : ''} ${actor.moving ? 'moving' : ''}`}
            key={actor.id}
            style={style}
            title={actor.label}
          />
        ))}
      </div>
      {radar.visibleActors.length > 0 && (
        <div className="town-radar-legend" aria-label="雷达人物颜色">
          {radar.visibleActors.map((actor) => (
            <span className="town-radar-legend-item" key={actor.id} title={actor.label}>
              <i className={`town-radar-legend-dot ${actor.kind}`} aria-hidden="true" />
              <b>{actor.label}</b>
            </span>
          ))}
        </div>
      )}
      <div className="town-radar-footer">
        <span>{destination.action}</span>
        {recentCapabilities.length > 0 && <b>{recentCapabilities.join(' · ')}</b>}
      </div>
    </section>
  );
}

function getVisibleRadarDestination(stageCode: string, actors: RadarActor[]): StageRadarDestination {
  const stageDestination = getStageRadarDestination(stageCode);
  const actorDestination = findPrimaryActorDestination(actors);
  if (!actorDestination) return stageDestination;
  return {
    ...stageDestination,
    locationId: actorDestination.locationId,
    nodeId: actorDestination.nodeId || stageDestination.nodeId,
    action: formatVisibleRadarAction(stageDestination.action, actorDestination.locationId),
  };
}

function findPrimaryActorDestination(actors: RadarActor[]) {
  return actors.find((actor) => actor.active && actor.locationId)
    || actors.find((actor) => actor.locationId)
    || null;
}

function formatVisibleRadarAction(action: string, locationId: TownRadarLocationId): string {
  if (locationId !== 'lawfirmA' && locationId !== 'lawfirmB') return action;
  const firmLabel = locationId === 'lawfirmA' ? '律所 A' : '律所 B';
  if (/律所 [AB]/.test(action)) return action.replace(/律所 [AB]/, firmLabel);
  return `${firmLabel} 内部 · ${action.replace(/^.*?内部 · /, '')}`;
}

function getActorLayouts(actors: RadarActor[], fallbackLocationId: TownRadarLocationId) {
  const totals = new Map<string, number>();
  const indexes = new Map<string, number>();

  actors.forEach((actor) => {
    const key = groupActorPositionKey(actor, fallbackLocationId);
    totals.set(key, (totals.get(key) || 0) + 1);
  });

  return actors.map((actor) => {
    const key = groupActorPositionKey(actor, fallbackLocationId);
    const index = indexes.get(key) || 0;
    indexes.set(key, index + 1);

    return {
      actor,
      style: getActorStyle(actor.locationId || fallbackLocationId, actor.nodeId, getActorOffset(index, totals.get(key) || 1)),
    };
  });
}

function groupActorPositionKey(actor: RadarActor, fallbackLocationId: TownRadarLocationId) {
  return `${actor.locationId || fallbackLocationId}:${actor.nodeId || 'main'}`;
}

function getActorStyle(
  locationId: TownRadarLocationId,
  nodeId?: LawfirmInternalNodeId,
  offset: { offsetX: number; offsetY: number } = { offsetX: 0, offsetY: 0 },
) {
  const location = TOWN_RADAR_LOCATIONS.find((item) => item.id === locationId) || TOWN_RADAR_LOCATIONS[0];
  const nodeOffset = getLawfirmNodeOffset(locationId, nodeId);
  return {
    left: `${location.x + nodeOffset.offsetX + offset.offsetX}%`,
    top: `${location.y + nodeOffset.offsetY + offset.offsetY}%`,
  };
}

function getLawfirmNodeOffset(locationId: TownRadarLocationId, nodeId?: LawfirmInternalNodeId) {
  if (locationId !== 'lawfirmA' && locationId !== 'lawfirmB') return { offsetX: 0, offsetY: 15 };
  if (nodeId === 'frontDesk') return { offsetX: -5, offsetY: 6 };
  if (nodeId === 'consultationRoom') return { offsetX: 0, offsetY: 10 };
  if (nodeId === 'workstation') return { offsetX: 0, offsetY: 17 };
  return { offsetX: 0, offsetY: 15 };
}

function getActorOffset(index: number, total: number) {
  if (total <= 1) return { offsetX: 0, offsetY: 0 };
  const layouts = [
    [
      { offsetX: -2.8, offsetY: 0 },
      { offsetX: 2.8, offsetY: 0 },
    ],
    [
      { offsetX: -3.1, offsetY: -1.8 },
      { offsetX: 3.1, offsetY: -1.8 },
      { offsetX: 0, offsetY: 2.2 },
    ],
    [
      { offsetX: -3.1, offsetY: -2.2 },
      { offsetX: 3.1, offsetY: -2.2 },
      { offsetX: -3.1, offsetY: 2.2 },
      { offsetX: 3.1, offsetY: 2.2 },
    ],
  ];
  const layout = layouts[Math.min(total, 4) - 2];
  return layout[index % layout.length];
}
