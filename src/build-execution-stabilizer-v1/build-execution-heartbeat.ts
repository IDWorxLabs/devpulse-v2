/**
 * Build Execution Stabilizer V1 — heartbeat message derivation.
 *
 * Turns real execution evidence (raw child-process output, or simply elapsed time since the
 * stage started) into a short, plain-English progress message. Never invents progress that
 * didn't happen — a heartbeat with no evidence just reports elapsed time honestly.
 */

import type { BuildExecutionStageName } from './build-execution-types.js';
import { STAGE_LABELS } from './build-execution-timeouts.js';

interface EvidencePattern {
  test: RegExp;
  message: string;
}

const NPM_INSTALL_PATTERNS: EvidencePattern[] = [
  { test: /\badded\s+\d+\s+package/i, message: 'npm install finishing up — packages added.' },
  { test: /\breify|fetch|http/i, message: 'npm install downloading and installing packages…' },
  { test: /\bnode_modules\b/i, message: 'npm install writing node_modules…' },
];

const NPM_BUILD_PATTERNS: EvidencePattern[] = [
  { test: /transform|modules transformed/i, message: 'npm build compiling modules…' },
  { test: /render(ing)? chunks?/i, message: 'npm build bundling output…' },
  { test: /built in|build complete/i, message: 'npm build finishing up…' },
];

const PREVIEW_PATTERNS: EvidencePattern[] = [
  { test: /ready in|local:|dev server running/i, message: 'Preview server responded — finishing startup…' },
  { test: /listening|port/i, message: 'Preview server is binding to a port…' },
];

function matchPattern(patterns: EvidencePattern[], chunk: string): string | null {
  for (const pattern of patterns) {
    if (pattern.test.test(chunk)) return pattern.message;
  }
  return null;
}

function formatElapsed(elapsedMs: number): string {
  const seconds = Math.max(0, Math.round(elapsedMs / 1000));
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

/**
 * Derives a plain-English heartbeat message from real evidence. `rawChunk` is genuine process
 * output when available; when it's null, the message is still honest — it reports elapsed time
 * rather than claiming a false sub-step.
 */
export function deriveHeartbeatMessage(
  stage: BuildExecutionStageName,
  rawChunk: string | null,
  elapsedMs: number,
): string {
  const label = STAGE_LABELS[stage] ?? stage;

  if (rawChunk) {
    const patterns =
      stage === 'NPM_INSTALL' ? NPM_INSTALL_PATTERNS : stage === 'NPM_BUILD' ? NPM_BUILD_PATTERNS : stage === 'PREVIEW_STARTUP' ? PREVIEW_PATTERNS : [];
    const matched = matchPattern(patterns, rawChunk);
    if (matched) return matched;
    return `${label}… (received output, ${formatElapsed(elapsedMs)} elapsed)`;
  }

  return `${label}… (${formatElapsed(elapsedMs)} elapsed)`;
}

export function deriveStageStartMessage(stage: BuildExecutionStageName): string {
  return `${STAGE_LABELS[stage] ?? stage} started.`;
}

export function deriveStageCompleteMessage(stage: BuildExecutionStageName, durationMs: number): string {
  return `${STAGE_LABELS[stage] ?? stage} finished in ${formatElapsed(durationMs)}.`;
}

export { formatElapsed };
