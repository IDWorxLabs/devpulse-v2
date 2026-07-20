/**
 * Build Execution Stabilizer V1 — plain-English report.
 *
 * Turns the monitor's raw state (timeline, heartbeats, recovery attempts) into the report the UI
 * and API consume: a founder-facing summary plus the full evidence trail for Advanced Diagnostics.
 */

import {
  BUILD_EXECUTION_STABILIZER_V1_CONTRACT,
  type BuildExecutionPlainEnglishSummary,
  type BuildExecutionReport,
  type BuildExecutionState,
} from './build-execution-types.js';
import type { BuildExecutionMonitor } from './build-execution-monitor.js';
import { STAGE_LABELS } from './build-execution-timeouts.js';
import { formatElapsed } from './build-execution-heartbeat.js';

function currentStage(monitor: BuildExecutionMonitor): { stage: string; label: string } {
  const timeline = monitor.getTimeline();
  if (timeline.length === 0) return { stage: 'NONE', label: 'Not started' };
  const last = timeline[timeline.length - 1]!;
  return { stage: last.stage, label: STAGE_LABELS[last.stage] ?? last.stage };
}

function buildSummary(monitor: BuildExecutionMonitor, overallState: BuildExecutionState): BuildExecutionPlainEnglishSummary {
  const { label } = currentStage(monitor);
  const heartbeats = monitor.getHeartbeats();
  const lastHeartbeat = heartbeats.length > 0 ? heartbeats[heartbeats.length - 1]! : null;
  const recoveryAttempts = monitor.getRecoveryAttempts();
  const lastRecovery = recoveryAttempts.length > 0 ? recoveryAttempts[recoveryAttempts.length - 1]! : null;
  const elapsedLabel = `${formatElapsed(monitor.elapsedTotalMs())} elapsed`;
  const heartbeatLabel = lastHeartbeat ? lastHeartbeat.message : `${label}…`;

  let headline: string;
  let recoveryLabel: string | null = null;
  let nextStepLabel: string;

  switch (overallState) {
    case 'COMPLETED':
      headline = 'Build completed.';
      nextStepLabel = 'Your app is ready to preview.';
      break;
    case 'FAILED': {
      const failedEntry = [...monitor.getTimeline()].reverse().find((e) => e.state === 'FAILED');
      const stageLabel = failedEntry ? STAGE_LABELS[failedEntry.stage] ?? failedEntry.stage : label;
      headline = 'A build stage stopped responding.';
      recoveryLabel = lastRecovery
        ? `AiDevEngine attempted one restart of ${STAGE_LABELS[lastRecovery.stage] ?? lastRecovery.stage}, but it did not recover.`
        : null;
      nextStepLabel = `The ${stageLabel.toLowerCase()} stage stopped responding. Further progress requires investigation.`;
      break;
    }
    case 'BLOCKED':
      headline = 'Build blocked.';
      nextStepLabel = 'Resolve current build-context blockers before preview activation.';
      break;
    case 'STALL_DETECTED':
      headline = 'Build paused.';
      recoveryLabel = `AiDevEngine has not received any activity from ${label.toLowerCase()} recently. Attempting one automatic recovery…`;
      nextStepLabel = 'Waiting to see if the automatic recovery works.';
      break;
    case 'RECOVERING':
      headline = 'Build paused. Attempting recovery.';
      recoveryLabel = `AiDevEngine is attempting one automatic recovery of ${label.toLowerCase()}…`;
      nextStepLabel = 'Waiting to see if the automatic recovery works.';
      break;
    case 'RECOVERED':
      headline = 'Recovery succeeded. Continuing build…';
      recoveryLabel = lastRecovery ? `${STAGE_LABELS[lastRecovery.stage] ?? lastRecovery.stage} recovered and is continuing.` : null;
      nextStepLabel = 'Continuing to the next stage.';
      break;
    case 'WAITING':
      headline = 'Waiting to start.';
      nextStepLabel = 'The build has not started yet.';
      break;
    case 'RUNNING':
    default:
      headline = `Building… (${label})`;
      nextStepLabel = `Moving through ${label.toLowerCase()}.`;
      break;
  }

  return {
    readOnly: true,
    headline,
    currentStageLabel: label,
    elapsedLabel,
    heartbeatLabel,
    recoveryLabel,
    nextStepLabel,
  };
}

export function buildExecutionReport(monitor: BuildExecutionMonitor): BuildExecutionReport {
  const overallState = monitor.getOverallState();
  return {
    readOnly: true,
    contractVersion: BUILD_EXECUTION_STABILIZER_V1_CONTRACT,
    overallState,
    timeline: monitor.getTimeline(),
    heartbeats: monitor.getHeartbeats(),
    recoveryAttempts: monitor.getRecoveryAttempts(),
    summary: buildSummary(monitor, overallState),
    totalDurationMs: monitor.elapsedTotalMs(),
  };
}
