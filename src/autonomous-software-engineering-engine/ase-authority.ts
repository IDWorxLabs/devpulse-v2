/**
 * ASE — main authority and public entry point.
 */

import { resetAseAuditLogForTests } from './ase-audit-log.js';
import { resetAseEvidenceBusForTests } from './ase-evidence-bus.js';
import { resetAsePipelineStateForTests } from './ase-pipeline-state.js';
import { runAseStageOrchestrator } from './ase-stage-orchestrator.js';
import { resetAseTimelineForTests, mergeAseTimeline } from './ase-timeline-builder.js';
import { toAutonomousSoftwareEngineeringResult } from './ase-status-card.js';
import type {
  AutonomousSoftwareEngineeringPipelineInput,
  AutonomousSoftwareEngineeringPipelineResult,
  AutonomousSoftwareEngineeringResult,
} from './ase-types.js';
import { AUTONOMOUS_SOFTWARE_ENGINEERING_ENGINE_V1_PASS_TOKEN } from './ase-types.js';

let lastPipelineResult: AutonomousSoftwareEngineeringPipelineResult | null = null;

export function resetAutonomousSoftwareEngineeringEngineForTests(): void {
  lastPipelineResult = null;
  resetAseEvidenceBusForTests();
  resetAseTimelineForTests();
  resetAseAuditLogForTests();
  resetAsePipelineStateForTests();
}

export function getLastAutonomousSoftwareEngineeringPipelineResult(): AutonomousSoftwareEngineeringPipelineResult | null {
  return lastPipelineResult;
}

export function getAutonomousSoftwareEngineeringPassToken(): string {
  return AUTONOMOUS_SOFTWARE_ENGINEERING_ENGINE_V1_PASS_TOKEN;
}

export function runAutonomousSoftwareEngineeringPipeline(
  input: AutonomousSoftwareEngineeringPipelineInput,
): AutonomousSoftwareEngineeringPipelineResult {
  if (input.resumeState?.runId) {
    mergeAseTimeline([]);
  }
  const result = runAseStageOrchestrator(input);
  lastPipelineResult = result;
  return result;
}

export function toAutonomousSoftwareEngineeringApiResult(
  result: AutonomousSoftwareEngineeringPipelineResult,
): AutonomousSoftwareEngineeringResult {
  return toAutonomousSoftwareEngineeringResult({
    runId: result.runId,
    projectId: result.projectId,
    overallStatus: result.overallStatus,
    currentStage: result.currentStage,
    readyForPreview: result.readyForPreview,
    previewUrl: result.previewUrl,
    launchVerdict: result.launchReadiness.verdict.verdict,
    livePreviewState: result.livePreviewGate.state,
    statusCard: result.statusCard,
    timeline: result.timeline,
    gates: result.gates,
    blockers: result.blockers,
    warnings: result.warnings,
    nextAction: result.nextAction,
    evidenceSummary: result.evidenceSummary,
  });
}

export function registerAutonomousSoftwareEngineeringEngineWithOnePromptOrchestrator(): {
  connected: true;
  readOnly: true;
} {
  return { connected: true, readOnly: true };
}
