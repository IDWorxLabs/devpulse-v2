/**
 * ASE — unified status card.
 */

import type {
  AseGateResult,
  AseOverallStatus,
  AsePipelineState,
  AseStageId,
  AseStatusCard,
  AseTimelineEvent,
  AutonomousSoftwareEngineeringResult,
  AseEvidenceRecord,
} from './ase-types.js';
import { ASE_STAGE_ORDER } from './ase-types.js';

export function buildAseStatusCard(input: {
  pipelineState: AsePipelineState;
  overallStatus: AseOverallStatus;
  gateResults: readonly AseGateResult[];
  launchVerdict: string;
  previewState: string;
  nextAction: string;
  blockedGate: string | null;
  repairStatus: string | null;
  capabilityEvolutionStatus: string | null;
  improvementStatus: string | null;
  risk: AseStatusCard['risk'];
}): AseStatusCard {
  const passedGates = input.gateResults.filter((g) => g.passed).map((g) => g.gateId);
  const activeGate =
    input.gateResults.find((g) => !g.passed && g.gateId === input.pipelineState.currentGate)?.gateId ??
    input.pipelineState.currentGate;
  const completed = passedGates.length;
  const total = ASE_STAGE_ORDER.length;

  return {
    readOnly: true,
    currentStage: input.pipelineState.currentStage,
    currentGate: input.pipelineState.currentGate,
    overallProgress: Math.round((completed / total) * 100),
    passedGates,
    activeGate,
    blockedGate: input.blockedGate,
    repairStatus: input.repairStatus,
    capabilityEvolutionStatus: input.capabilityEvolutionStatus,
    improvementStatus: input.improvementStatus,
    launchVerdict: input.launchVerdict,
    previewState: input.previewState,
    nextAction: input.nextAction,
    risk: input.risk,
  };
}

export function toAutonomousSoftwareEngineeringResult(input: {
  runId: string;
  projectId: string | null;
  overallStatus: AseOverallStatus;
  currentStage: AseStageId;
  readyForPreview: boolean;
  previewUrl: string | null;
  launchVerdict: string;
  livePreviewState: string;
  statusCard: AseStatusCard;
  timeline: readonly AseTimelineEvent[];
  gates: readonly AseGateResult[];
  blockers: readonly string[];
  warnings: readonly string[];
  nextAction: string;
  evidenceSummary: readonly AseEvidenceRecord[];
}): AutonomousSoftwareEngineeringResult {
  return {
    readOnly: true,
    runId: input.runId,
    projectId: input.projectId,
    overallStatus: input.overallStatus,
    currentStage: input.currentStage,
    readyForPreview: input.readyForPreview,
    previewUrl: input.previewUrl,
    launchVerdict: input.launchVerdict,
    livePreviewState: input.livePreviewState,
    statusCard: input.statusCard,
    timeline: input.timeline,
    gates: input.gates,
    blockers: input.blockers,
    warnings: input.warnings,
    nextAction: input.nextAction,
    evidenceSummary: input.evidenceSummary,
  };
}
