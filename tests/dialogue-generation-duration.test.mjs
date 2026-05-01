import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const timelineSource = readFileSync(join(root, 'src', 'components', 'CaseTimeline.tsx'), 'utf8');
const dialogueSource = readFileSync(join(root, 'src', 'components', 'DialogueBox.tsx'), 'utf8');
const vnReducerSource = readFileSync(join(root, 'src', 'state', 'vnEventReducer.ts'), 'utf8');
const stylesSource = readFileSync(join(root, 'src', 'styles.css'), 'utf8');

assert.match(
  vnReducerSource,
  /generationDurationSeconds\?: number;/,
  'Dialogue history entries should preserve optional backend generation duration.',
);

assert.match(
  vnReducerSource,
  /generationTotalTokens\?: number;/,
  'Dialogue history entries should preserve optional backend generation token count.',
);

assert.match(
  vnReducerSource,
  /playerResponsibility\?: boolean;/,
  'Dialogue history entries should preserve optional player-responsibility markers.',
);

assert.match(
  vnReducerSource,
  /evaluationMarkerLabel\?: string;/,
  'Dialogue history entries should preserve optional evaluation marker labels.',
);

assert.match(
  vnReducerSource,
  /readGenerationDurationSeconds\(payload\.generation_duration_seconds\)/,
  'VN reducer should read generation_duration_seconds from dialogue_update payloads.',
);

assert.match(
  vnReducerSource,
  /readGenerationTotalTokens\(payload\.generation_total_tokens\)/,
  'VN reducer should read generation_total_tokens from dialogue_update payloads.',
);

assert.match(
  vnReducerSource,
  /readPlayerResponsibility\(payload\.player_responsibility\)/,
  'VN reducer should read player_responsibility from dialogue_update payloads.',
);

assert.match(
  vnReducerSource,
  /readEvaluationMarkerLabel\(payload\.evaluation_marker_label\)/,
  'VN reducer should read evaluation_marker_label from dialogue_update payloads.',
);

assert.match(
  dialogueSource,
  /function formatGenerationMeta\(entry: DialogueHistoryEntry\): string \{[\s\S]*formatGenerationDuration\(entry\.generationDurationSeconds\)[\s\S]*formatGenerationTokens\(entry\.generationTotalTokens\)[\s\S]*return parts\.join\(' · '\);/,
  'DialogueBox should build one compact generation metadata line from duration and token count.',
);

assert.match(
  dialogueSource,
  /function formatGenerationTokens\(tokens: number \| undefined\): string \{[\s\S]*return `\$\{safeTokens\.toLocaleString\('en-US'\)\} tokens`;/,
  'DialogueBox should format token counts as 6,370 tokens.',
);

assert.match(
  dialogueSource,
  /const generationMeta = displayEntry \? formatGenerationMeta\(displayEntry\) : '';[\s\S]*<span className="dialogue-generation-meta">\s*\{generationMeta\}\s*<\/span>/,
  'DialogueBox should render generation metadata under the current dialogue.',
);

assert.match(
  dialogueSource,
  /const evaluationMarker = displayEntry \? formatEvaluationMarker\(displayEntry\) : null;[\s\S]*<span className="dialogue-evaluation-marker"/,
  'DialogueBox should render a compact evaluation marker on marked player-responsibility dialogue.',
);

assert.match(
  timelineSource,
  /const generationMeta = formatTranscriptGenerationMeta\(item\.entry\);[\s\S]*<span className="stage-transcript-generation-meta">\{generationMeta\}<\/span>/,
  'Stage transcript records should render generation metadata for copied dialogue history.',
);

assert.match(
  timelineSource,
  /const evaluationMarker = formatTranscriptEvaluationMarker\(item\.entry\);[\s\S]*<span className="stage-transcript-evaluation-marker"/,
  'Stage transcript records should render evaluation markers for copied dialogue history.',
);

assert.match(
  stylesSource,
  /\.dialogue-generation-meta,\s*\.stage-transcript-generation-meta\s*\{[\s\S]*font-variant-numeric:\s*tabular-nums[\s\S]*font-size:\s*12px/,
  'Generation metadata should use quiet small text with stable numeric alignment in both dialogue views.',
);

assert.match(
  stylesSource,
  /\.dialogue-evaluation-marker,\s*\.stage-transcript-evaluation-marker\s*\{[\s\S]*font-size:\s*12px[\s\S]*border:/,
  'Evaluation markers should use compact, quiet badge styling in both dialogue views.',
);
