import type { FrontendDemoSceneId, FrontendDemoWorkbench } from './frontendDemoFixtures';

export type LiveSimulationStep = {
  durationMs: number;
  label: string;
  sceneId: FrontendDemoSceneId;
  workbench: FrontendDemoWorkbench['kind'] | 'auto';
};

export const LIVE_SIMULATION_STEPS: LiveSimulationStep[] = [
  {
    durationMs: 6500,
    label: '案件启动，进入原告咨询',
    sceneId: 'consult',
    workbench: 'none',
  },
  {
    durationMs: 8500,
    label: '轮到用户处理当前律师回复',
    sceneId: 'reply',
    workbench: 'reply',
  },
  {
    durationMs: 9500,
    label: '系统进入起诉状追问与起草',
    sceneId: 'document',
    workbench: 'document',
  },
  {
    durationMs: 8000,
    label: '一审庭审正在询问争议焦点',
    sceneId: 'court',
    workbench: 'court',
  },
  {
    durationMs: 9000,
    label: '结案评分与复盘材料生成',
    sceneId: 'closing',
    workbench: 'closing',
  },
];

export const LIVE_SIMULATION_TOTAL_MS = LIVE_SIMULATION_STEPS.reduce(
  (total, step) => total + step.durationMs,
  0,
);

export function getLiveSimulationStep(elapsedMs: number): {
  index: number;
  progress: number;
  step: LiveSimulationStep;
} {
  const loopedMs = ((elapsedMs % LIVE_SIMULATION_TOTAL_MS) + LIVE_SIMULATION_TOTAL_MS) % LIVE_SIMULATION_TOTAL_MS;
  let cursor = 0;
  for (let index = 0; index < LIVE_SIMULATION_STEPS.length; index += 1) {
    const step = LIVE_SIMULATION_STEPS[index];
    const nextCursor = cursor + step.durationMs;
    if (loopedMs < nextCursor) {
      return {
        index,
        progress: (loopedMs - cursor) / step.durationMs,
        step,
      };
    }
    cursor = nextCursor;
  }
  const index = LIVE_SIMULATION_STEPS.length - 1;
  return {
    index,
    progress: 1,
    step: LIVE_SIMULATION_STEPS[index],
  };
}
