import type { DialogueScene } from '../data/runtimeScene';
import {
  LAWFIRM_INTERNAL_NODES,
  TOWN_RADAR_LOCATIONS,
  getStageRadarDestination,
  type RadarActor,
  type TownRadarLocationId,
} from '../data/townRadarModel';
import type { TownRadarRuntimeState } from '../state/useTownRadarRuntime';
import { getRuntimeTechDisplayName } from './techDisplayNames';

type Props = {
  radar: TownRadarRuntimeState & { visibleActors: RadarActor[] };
  scene: DialogueScene;
};

export function TownRadar({ radar, scene }: Props) {
  const destination = getStageRadarDestination(scene.stageCode);
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
        {radar.visibleActors.map((actor) => (
          <span
            className={`town-radar-actor ${actor.kind} ${actor.active ? 'active' : ''} ${actor.moving ? 'moving' : ''}`}
            key={actor.id}
            style={getActorStyle(actor.locationId || destination.locationId)}
            title={actor.label}
          >
            {formatActorLabel(actor.label)}
          </span>
        ))}
      </div>
      <div className="town-radar-footer">
        <span>{destination.action}</span>
        {recentCapabilities.length > 0 && <b>{recentCapabilities.join(' · ')}</b>}
      </div>
    </section>
  );
}

function getActorStyle(locationId: TownRadarLocationId) {
  const location = TOWN_RADAR_LOCATIONS.find((item) => item.id === locationId) || TOWN_RADAR_LOCATIONS[0];
  return {
    left: `${location.x}%`,
    top: `${location.y + 15}%`,
  };
}

function formatActorLabel(label: string): string {
  const trimmed = String(label || '').trim();
  if (!trimmed) return '?';
  return trimmed.slice(0, 2);
}
