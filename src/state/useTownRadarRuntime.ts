import { useEffect, useMemo, useReducer } from 'react';
import {
  createStageRadarActors,
  getPriorityRadarActors,
  getRadarActorKind,
  getStageRadarDestination,
  normalizeRadarLocationId,
  type LawfirmInternalNodeId,
  type RadarActor,
  type TownRadarLocationId,
} from '../data/townRadarModel';
import type { DialogueScene } from '../data/runtimeScene';
import { getEventBus } from '../services/eventBus';

export type TownRadarActorState = RadarActor & {
  rawLocationId?: string;
  targetLocationId?: TownRadarLocationId;
  targetNodeId?: LawfirmInternalNodeId;
  updatedAt: number;
};

export type TownRadarRuntimeState = {
  actors: Record<string, TownRadarActorState>;
  lastEventAt: number;
  lastRawLocationId: string;
};

export const EMPTY_TOWN_RADAR_RUNTIME: TownRadarRuntimeState = {
  actors: {},
  lastEventAt: 0,
  lastRawLocationId: '',
};

type RuntimeAction =
  | { type: 'map-event'; payload: Record<string, unknown>; fallbackStageCode: string }
  | { type: 'clear-moving'; actorId: string };

export function useTownRadarRuntime(scene: DialogueScene): TownRadarRuntimeState & { visibleActors: RadarActor[] } {
  const [state, dispatch] = useReducer(townRadarRuntimeReducer, EMPTY_TOWN_RADAR_RUNTIME);

  useEffect(() => {
    const eventBus = getEventBus();
    const handleMapEvent = (payload?: Record<string, unknown>) => {
      dispatch({ type: 'map-event', payload: payload || {}, fallbackStageCode: scene.stageCode });
    };
    eventBus.on('ws:map-event', handleMapEvent);
    return () => {
      eventBus.off('ws:map-event', handleMapEvent);
    };
  }, [scene.stageCode]);

  useEffect(() => {
    const movingActorIds = Object.values(state.actors)
      .filter((actor) => actor.moving)
      .map((actor) => actor.id);
    if (movingActorIds.length === 0) return;
    const timeoutId = window.setTimeout(() => {
      movingActorIds.forEach((actorId) => dispatch({ type: 'clear-moving', actorId }));
    }, 1200);
    return () => window.clearTimeout(timeoutId);
  }, [state.lastEventAt, state.actors]);

  const visibleActors = useMemo(() => {
    const stageActors = createStageRadarActors(scene);
    const runtimeActors = Object.values(state.actors);
    return getPriorityRadarActors(mergeRadarActorsByLabel([...runtimeActors, ...stageActors]), 4);
  }, [scene, state.actors]);

  return { ...state, visibleActors };
}

export function townRadarRuntimeReducer(
  state: TownRadarRuntimeState,
  action: RuntimeAction,
): TownRadarRuntimeState {
  if (action.type === 'clear-moving') {
    const actor = state.actors[action.actorId];
    if (!actor?.moving) return state;
    return {
      ...state,
      actors: {
        ...state.actors,
        [action.actorId]: {
          ...actor,
          locationId: actor.targetLocationId || actor.locationId,
          moving: false,
          nodeId: actor.targetNodeId,
        },
      },
    };
  }
  return reduceTownRadarMapEvent(state, action.payload, action.fallbackStageCode);
}

export function reduceTownRadarMapEvent(
  state: TownRadarRuntimeState,
  payload: Record<string, unknown>,
  fallbackStageCode: string,
): TownRadarRuntimeState {
  const type = String(payload.type || '');
  const agentId = String(payload.agent_id || payload.speaker_id || '').trim();
  if (!agentId) return state;

  switch (type) {
    case 'agent_despawn': {
      const nextActors = { ...state.actors };
      delete nextActors[agentId];
      return { ...state, actors: nextActors, lastEventAt: Date.now() };
    }
    case 'agent_move': {
      const normalized = normalizeRadarLocationId(payload.dest_loc_id, fallbackStageCode);
      return upsertRadarActor(state, payload, agentId, normalized, { moving: true });
    }
    case 'agent_goto_front_desk': {
      const normalized = normalizeRadarLocationId(`${payload.lawfirm || ''}_front_desk`, fallbackStageCode);
      return upsertRadarActor(state, payload, agentId, normalized, { moving: false });
    }
    case 'agent_update_dialogue': {
      const current = state.actors[agentId];
      if (!current) return state;
      return upsertRadarActor(state, payload, agentId, {
        locationId: current.locationId,
        nodeId: current.nodeId,
        rawLocationId: current.rawLocationId || '',
      }, { moving: false });
    }
    case 'agent_spawn':
    case 'agent_sit':
    case 'agent_stand': {
      const fallback = getStageRadarDestination(fallbackStageCode);
      const normalized = {
        locationId: state.actors[agentId]?.locationId || fallback.locationId,
        nodeId: state.actors[agentId]?.nodeId || fallback.nodeId,
        rawLocationId: String(payload.dest_loc_id || state.actors[agentId]?.rawLocationId || ''),
      };
      return upsertRadarActor(state, payload, agentId, normalized, { moving: false });
    }
    default:
      return state;
  }
}

function upsertRadarActor(
  state: TownRadarRuntimeState,
  payload: Record<string, unknown>,
  agentId: string,
  normalized: {
    locationId: TownRadarLocationId;
    nodeId?: LawfirmInternalNodeId;
    rawLocationId: string;
  },
  options: { moving: boolean },
): TownRadarRuntimeState {
  const current = state.actors[agentId];
  const updatedAt = Date.now();
  const label = getActorDisplayLabel(payload, current?.label, agentId);
  const moving = options.moving;
  const actor: TownRadarActorState = {
    id: agentId,
    kind: getRadarActorKind(`${agentId} ${label} ${payload.role || ''}`),
    label,
    locationId: moving ? current?.locationId || normalized.locationId : normalized.locationId,
    moving,
    nodeId: moving ? current?.nodeId || normalized.nodeId : normalized.nodeId,
    rawLocationId: normalized.rawLocationId,
    targetLocationId: normalized.locationId,
    targetNodeId: normalized.nodeId,
    updatedAt,
  };
  return {
    ...state,
    actors: {
      ...state.actors,
      [agentId]: actor,
    },
    lastEventAt: updatedAt,
    lastRawLocationId: normalized.rawLocationId,
  };
}

function getActorDisplayLabel(payload: Record<string, unknown>, currentLabel = '', agentId = ''): string {
  const businessName = firstNonEmpty([
    payload.name,
    payload.speaker_name,
    payload.display_name,
    payload.profile_name,
  ]);
  if (businessName) return businessName;

  const characterName = firstNonEmpty([payload.character_name]);
  const roleLabel = getRoleDisplayLabel(payload.role);
  if (roleLabel && (!characterName || isCharacterAssetName(characterName))) return roleLabel;
  if (characterName && !isCharacterAssetName(characterName)) return characterName;

  if (currentLabel && !isCharacterAssetName(currentLabel)) return currentLabel;
  return agentId || '未知角色';
}

function mergeRadarActorsByLabel(actors: RadarActor[]): RadarActor[] {
  const byLabel = new Map<string, RadarActor>();
  for (const actor of actors) {
    const key = normalizeActorLabelKey(actor.label);
    if (!key) continue;
    const current = byLabel.get(key);
    byLabel.set(key, current ? mergeRadarActor(current, actor) : actor);
  }
  return [...byLabel.values()];
}

function normalizeActorLabelKey(label: string): string {
  return String(label || '').trim().replace(/\s+/g, '').toLowerCase();
}

function mergeRadarActor(current: RadarActor, candidate: RadarActor): RadarActor {
  if (shouldPreserveRuntimeLocation(current, candidate)) {
    return {
      ...candidate,
      locationId: current.locationId,
      nodeId: current.nodeId,
      moving: current.moving,
      active: current.active || candidate.active,
    };
  }
  if (shouldPreserveRuntimeLocation(candidate, current)) {
    return {
      ...current,
      active: current.active || candidate.active,
    };
  }
  return shouldReplaceRadarActor(current, candidate) ? candidate : current;
}

function shouldPreserveRuntimeLocation(current: RadarActor, candidate: RadarActor): boolean {
  return current.id !== candidate.id
    && Boolean((current as TownRadarActorState).updatedAt)
    && !Boolean((candidate as TownRadarActorState).updatedAt);
}

function shouldReplaceRadarActor(current: RadarActor, candidate: RadarActor): boolean {
  if (current.moving !== candidate.moving) return Boolean(candidate.moving);
  if (current.active !== candidate.active) return Boolean(candidate.active);
  if (current.id === candidate.id) return true;
  return Boolean(candidate.nodeId && !current.nodeId);
}

function firstNonEmpty(values: unknown[]): string {
  for (const value of values) {
    const text = String(value || '').trim();
    if (text) return text;
  }
  return '';
}

function isCharacterAssetName(value: string): boolean {
  return /^(Adam|Alex|Amelia|Ash|Bob|Bruce|Conference_man|Conference_woman|Dan|Edward|Lucy|Molly|Pier|Rob|Roki|Samuel)$/i
    .test(value.trim());
}

function getRoleDisplayLabel(value: unknown): string {
  const role = String(value || '').trim().toLowerCase();
  if (/judge|法官/.test(role)) return '法官';
  if (/plaintiff_lawyer|player|原告律师/.test(role)) return '原告律师';
  if (/defendant_lawyer|opponent|被告律师/.test(role)) return '被告律师';
  if (/lawyer|律师/.test(role)) return '律师';
  if (/plaintiff|原告/.test(role)) return '原告';
  if (/defendant|被告/.test(role)) return '被告';
  if (/reception|front_desk|前台|接待/.test(role)) return '前台';
  if (/clerk|assistant|书记员|法官助理/.test(role)) return '法庭工作人员';
  return '';
}
