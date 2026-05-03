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
    return getPriorityRadarActors([...runtimeActors, ...stageActors], 4);
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
  const label = String(payload.character_name || payload.name || payload.speaker_name || current?.label || agentId);
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
