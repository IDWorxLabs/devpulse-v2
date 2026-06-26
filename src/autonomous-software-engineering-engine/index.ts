/**
 * Autonomous Software Engineering Engine — Era 3 Phase 14.
 * Final unification layer coordinating all Era 3 phases through one autonomous pipeline.
 */

export {
  AUTONOMOUS_SOFTWARE_ENGINEERING_ENGINE_OWNER_MODULE,
  AUTONOMOUS_SOFTWARE_ENGINEERING_ENGINE_V1_PASS_TOKEN,
  ASE_STAGE_ORDER,
} from './ase-types.js';
export type {
  AseAuditEntry,
  AseEvidenceRecord,
  AseGateResult,
  AseOverallStatus,
  AsePipelineState,
  AseResumeBoundary,
  AseRouteDecision,
  AseRouteTarget,
  AseStageDefinition,
  AseStageId,
  AseStageResult,
  AseStageStatus,
  AseStatusCard,
  AseTimelineEvent,
  AutonomousSoftwareEngineeringPipelineArtifacts,
  AutonomousSoftwareEngineeringPipelineInput,
  AutonomousSoftwareEngineeringPipelineResult,
  AutonomousSoftwareEngineeringResult,
} from './ase-types.js';

export { getDevPulseV2AutonomousSoftwareEngineeringEngine, registerAseWithOnePromptOrchestrator } from './ase-registry.js';
export { resetAseEvidenceBusForTests, publishAseEvidence, getAseEvidenceBus, getLatestAseEvidence } from './ase-evidence-bus.js';
export { canProceedToStage, buildAseGateResults, getStageDefinition } from './ase-gate-controller.js';
export { routeAseFailure } from './ase-failure-router.js';
export { planAseRoute, resolveNextStageAfterRoute, shouldContinuePipeline } from './ase-route-planner.js';
export { routeAseRepair } from './ase-repair-router.js';
export { routeAseCapabilityEvolution } from './ase-capability-evolution-router.js';
export { routeAseQualityLoop } from './ase-quality-loop-router.js';
export { routeAseLaunch } from './ase-launch-router.js';
export { routeAseLivePreview } from './ase-live-preview-router.js';
export { getResumeStartStage, shouldSkipStageForResume, getResumePointLabel } from './ase-resume-controller.js';
export {
  createAsePipelineState,
  updateAsePipelineState,
  markAseStageStatus,
  deriveAseOverallStatus,
  hashAsePrompt,
  resetAsePipelineStateForTests,
} from './ase-pipeline-state.js';
export { runAseStageOrchestrator } from './ase-stage-orchestrator.js';
export { buildAseStatusCard, toAutonomousSoftwareEngineeringResult } from './ase-status-card.js';
export { appendAseTimelineEvent, getAseTimeline, resetAseTimelineForTests, ASE_TIMELINE_LABELS } from './ase-timeline-builder.js';
export { recordAseAuditDecision, getAseAuditLog, resetAseAuditLogForTests } from './ase-audit-log.js';
export { buildAseReport } from './ase-report-builder.js';
import {
  runAutonomousSoftwareEngineeringPipeline,
  toAutonomousSoftwareEngineeringApiResult,
  getLastAutonomousSoftwareEngineeringPipelineResult,
  getAutonomousSoftwareEngineeringPassToken,
  resetAutonomousSoftwareEngineeringEngineForTests,
  registerAutonomousSoftwareEngineeringEngineWithOnePromptOrchestrator,
} from './ase-authority.js';

export {
  runAutonomousSoftwareEngineeringPipeline,
  toAutonomousSoftwareEngineeringApiResult,
  getLastAutonomousSoftwareEngineeringPipelineResult,
  getAutonomousSoftwareEngineeringPassToken,
  resetAutonomousSoftwareEngineeringEngineForTests,
  registerAutonomousSoftwareEngineeringEngineWithOnePromptOrchestrator,
};

export function resetAutonomousSoftwareEngineeringEngineModuleForTests(): void {
  resetAutonomousSoftwareEngineeringEngineForTests();
}
