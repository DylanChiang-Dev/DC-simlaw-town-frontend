import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const repoRoot = dirname(root);

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

function readRepo(relativePath) {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

const mainSource = read("src/main.tsx");
const liveAppPath = join(root, "src", "recording", "LiveSimulationDemoApp.tsx");
const timelinePath = join(root, "src", "recording", "liveSimulationTimeline.ts");
const stylesSource = read("src/styles.css");
const packageSource = read("package.json");
const remotionPackageSource = readRepo("video-remotion/package.json");
const recordScriptPath = join(repoRoot, "video-remotion", "scripts", "record-live-simulation-demo.ts");

assert.equal(existsSync(liveAppPath), true, "LiveSimulationDemoApp should exist.");
assert.equal(existsSync(timelinePath), true, "liveSimulationTimeline should exist.");
assert.equal(existsSync(recordScriptPath), true, "The Playwright recording script should exist.");

const liveAppSource = read("src/recording/LiveSimulationDemoApp.tsx");
const timelineSource = read("src/recording/liveSimulationTimeline.ts");
const recordScriptSource = readRepo("video-remotion/scripts/record-live-simulation-demo.ts");

assert.match(
  mainSource,
  /recordingMode === 'live-simulation'[\s\S]*LiveSimulationDemoApp/,
  "main.tsx should route ?recording=live-simulation to the live demo app.",
);

assert.match(
  mainSource,
  /recording-live-simulation/,
  "main.tsx should add a dedicated body class for live recording CSS.",
);

assert.match(
  timelineSource,
  /consult[\s\S]*reply[\s\S]*document[\s\S]*court[\s\S]*closing/s,
  "The live timeline should cover consultation, reply, document, court, and closing scenes.",
);

assert.match(
  liveAppSource,
  /data-recording-scene="live-simulation"/,
  "The live demo should expose a stable selector for the recorder.",
);

assert.match(
  liveAppSource,
  /DemoWorkbench workbench=\{workbench\}/,
  "The live demo should reuse the real demo workbench components.",
);

assert.match(
  stylesSource,
  /\.live-simulation-strip[\s\S]*grid-template-columns/,
  "The live demo should render a visible real-time progress strip.",
);

assert.match(
  recordScriptSource,
  /http:\/\/localhost:5174\/\?recording=live-simulation/,
  "The recorder should target the local live simulation entry by default.",
);

assert.match(
  remotionPackageSource,
  /"record:live-simulation":\s*"tsx scripts\/record-live-simulation-demo\.ts"/,
  "video-remotion should expose a record:live-simulation script.",
);

assert.match(
  packageSource,
  /"test:recording-live-simulation":\s*"node tests\/recording-live-simulation\.test\.mjs"/,
  "frontend-v2 should expose a focused live simulation recording test.",
);
