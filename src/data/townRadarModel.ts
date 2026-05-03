import type { DialogueScene } from './runtimeScene';

export type TownRadarLocationId = 'lawfirmA' | 'lawfirmB' | 'courtFirstInstance' | 'courtSecondInstance';
export type LawfirmInternalNodeId = 'frontDesk' | 'consultationRoom' | 'workstation';
export type RadarActorKind =
  | 'playerLawyer'
  | 'plaintiff'
  | 'defendant'
  | 'opponentLawyer'
  | 'judge'
  | 'courtStaff'
  | 'receptionist'
  | 'unknown';

export type TownRadarLocation = {
  id: TownRadarLocationId;
  label: string;
  x: number;
  y: number;
};

export type LawfirmInternalNode = {
  id: LawfirmInternalNodeId;
  label: string;
  x: number;
  y: number;
};

export type StageRadarDestination = {
  locationId: TownRadarLocationId;
  nodeId?: LawfirmInternalNodeId;
  action: string;
  resolveSide?: 'appellant' | 'appellee';
};

export type RadarActor = {
  id: string;
  label: string;
  kind: RadarActorKind;
  locationId: TownRadarLocationId;
  nodeId?: LawfirmInternalNodeId;
  active?: boolean;
  moving?: boolean;
};

export const TOWN_RADAR_LOCATIONS: TownRadarLocation[] = [
  { id: 'lawfirmA', label: '律所 A', x: 22, y: 25 },
  { id: 'lawfirmB', label: '律所 B', x: 78, y: 25 },
  { id: 'courtFirstInstance', label: '一审法院', x: 28, y: 78 },
  { id: 'courtSecondInstance', label: '二审法院', x: 72, y: 78 },
];

export const LAWFIRM_INTERNAL_NODES: LawfirmInternalNode[] = [
  { id: 'frontDesk', label: '前台', x: 20, y: 33 },
  { id: 'consultationRoom', label: '咨询室', x: 50, y: 33 },
  { id: 'workstation', label: '律师工位/文书起草', x: 50, y: 68 },
];

export const STAGE_RADAR_DESTINATIONS: Record<string, StageRadarDestination> = {
  PLC: { locationId: 'lawfirmA', nodeId: 'consultationRoom', action: '律所 A 内部 · 前台接待 / 咨询室沟通' },
  CD: { locationId: 'lawfirmA', nodeId: 'workstation', action: '律所 A 内部 · 律师工位起草起诉状' },
  DLC: { locationId: 'lawfirmB', nodeId: 'consultationRoom', action: '律所 B 内部 · 前台接待 / 咨询室沟通' },
  DD: { locationId: 'lawfirmB', nodeId: 'workstation', action: '律所 B 内部 · 律师工位起草答辩状' },
  CI: { locationId: 'courtFirstInstance', action: '一审法院 · 双方进入庭审' },
  AD: {
    locationId: 'lawfirmA',
    nodeId: 'workstation',
    resolveSide: 'appellant',
    action: '上诉方律所内部 · 起草上诉状',
  },
  AR: {
    locationId: 'lawfirmB',
    nodeId: 'workstation',
    resolveSide: 'appellee',
    action: '被上诉方律所内部 · 起草上诉答辩状',
  },
  CIA: { locationId: 'courtSecondInstance', action: '二审法院 · 上诉庭审推进' },
  FINAL_VERDICT: { locationId: 'courtSecondInstance', action: '二审法院 · 最终裁判生成' },
  SYSTEM: { locationId: 'lawfirmA', action: '等待案件同步' },
};

export function getStageRadarDestination(stageCode: string): StageRadarDestination {
  const normalized = String(stageCode || '').trim().toUpperCase();
  return STAGE_RADAR_DESTINATIONS[normalized] || STAGE_RADAR_DESTINATIONS.SYSTEM;
}

export function normalizeRadarLocationId(rawLocationId: unknown, fallbackStageCode: string): {
  locationId: TownRadarLocationId;
  nodeId?: LawfirmInternalNodeId;
  rawLocationId: string;
} {
  const raw = String(rawLocationId || '').trim();
  const normalized = raw.toLowerCase();
  if (/lawfirma|law_firm_a|firm_a|front_deska|consultationa|chaira|sofaa|wait_a/.test(normalized)) {
    return { locationId: 'lawfirmA', nodeId: normalizeLawfirmNode(normalized), rawLocationId: raw };
  }
  if (/lawfirmb|law_firm_b|firm_b|front_deskb|consultationb|chairb|sofab|wait_b/.test(normalized)) {
    return { locationId: 'lawfirmB', nodeId: normalizeLawfirmNode(normalized), rawLocationId: raw };
  }
  if (/courta|court_a|first|first_instance|一审/.test(normalized)) {
    return { locationId: 'courtFirstInstance', rawLocationId: raw };
  }
  if (/courtb|court_b|appeal|second|second_instance|二审/.test(normalized)) {
    return { locationId: 'courtSecondInstance', rawLocationId: raw };
  }
  const fallback = getStageRadarDestination(fallbackStageCode);
  return { locationId: fallback.locationId, nodeId: fallback.nodeId, rawLocationId: raw };
}

export function getRadarActorKind(value: unknown): RadarActorKind {
  const text = String(value || '').toLowerCase();
  if (/player|玩家|原告律师|plaintiff_lawyer/.test(text)) return 'playerLawyer';
  if (/plaintiff|client|原告|当事人/.test(text)) return 'plaintiff';
  if (/defendant|被告/.test(text)) return 'defendant';
  if (/opponent|对手|被告律师/.test(text)) return 'opponentLawyer';
  if (/judge|法官|海瑞|刘正/.test(text)) return 'judge';
  if (/clerk|assistant|书记员|法官助理/.test(text)) return 'courtStaff';
  if (/reception|front_desk|前台|接待/.test(text)) return 'receptionist';
  return 'unknown';
}

export function createStageRadarActors(scene: DialogueScene): RadarActor[] {
  if (!scene.speaker || String(scene.speaker) === 'system') return [];
  const destination = getStageRadarDestination(scene.stageCode);
  const speakerId = scene.speaker;
  return getPriorityRadarActors([
    {
      id: speakerId,
      label: scene.speakerLabel || speakerId,
      kind: getRadarActorKind(scene.speakerLabel || speakerId),
      locationId: destination.locationId,
      nodeId: destination.nodeId,
      active: scene.speaker !== 'system',
    },
  ]);
}

export function getPriorityRadarActors(actors: RadarActor[], limit = 4): RadarActor[] {
  const scoreByKind: Record<RadarActorKind, number> = {
    playerLawyer: 90,
    plaintiff: 80,
    defendant: 75,
    opponentLawyer: 70,
    judge: 65,
    courtStaff: 55,
    receptionist: 45,
    unknown: 10,
  };
  return [...actors]
    .sort((left, right) => {
      if (left.active !== right.active) return left.active ? -1 : 1;
      return scoreByKind[right.kind] - scoreByKind[left.kind];
    })
    .slice(0, limit);
}

function normalizeLawfirmNode(raw: string): LawfirmInternalNodeId {
  if (/front|desk|前台|reception/.test(raw)) return 'frontDesk';
  if (/chair|consult|room|咨询/.test(raw)) return 'consultationRoom';
  return 'workstation';
}
