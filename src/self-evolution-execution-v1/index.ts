/**
 * Self-Evolution Execution V1 — public API.
 */

export {
  SELF_EVOLUTION_EXECUTION_V1_PASS_TOKEN,
  SELF_EVOLUTION_EXECUTION_V1_FAIL_TOKEN,
  SELF_EVOLUTION_EXECUTION_V1_REPORT_TITLE,
  SELF_EVOLUTION_EXECUTION_V1_ARTIFACT_DIR,
  MAX_EVOLUTION_REGISTRY_SIZE,
  MIN_EVOLUTION_EXPERIMENTS,
  MIN_EVOLUTION_PROPOSALS,
  MIN_GAP_DETECTION_COUNT,
  EVOLUTION_EXPERIMENT_PROFILES,
  EVOLUTION_PIPELINE_STAGES,
  PRIOR_PASS_TOKENS,
} from './self-evolution-execution-v1-bounds.js';

export type {
  EvolutionGapClass,
  EvolutionRiskLevel,
  EvolutionPipelineStage,
  EvolutionGapEntry,
  EvolutionGapAssessment,
  EvolutionProposal,
  EvolutionExperimentResult,
  EvolutionImpactAssessment,
  EvolutionApprovalDecision,
  EvolutionRegistryEntry,
  EvolutionRegistry,
  ProductionProtectionProof,
  SelfEvolutionExecutionAssessment,
} from './self-evolution-execution-v1-types.js';

export { runSelfEvolutionExecutionV1 } from './self-evolution-execution-assessor.js';
export { buildSelfEvolutionExecutionV1ReportMarkdown } from './self-evolution-execution-report-builder.js';
export { writeSelfEvolutionExecutionArtifacts } from './self-evolution-artifact-writer.js';
export {
  isSelfEvolutionExecutionProven,
  loadSelfEvolutionExecutionAssessmentFromDisk,
} from './self-evolution-evidence-loader.js';
export { buildEvolutionGapAssessment } from './evolution-gap-detector.js';
export { generateEvolutionProposal, generateEvolutionProposals } from './evolution-proposal-engine.js';
export { runEvolutionWorld2Experiment } from './evolution-world2-experiment-runner.js';
export { measureEvolutionImpact } from './evolution-impact-measurer.js';
export { evaluateEvolutionApproval } from './evolution-approval-gate.js';
export {
  resetEvolutionRegistryForTests,
  buildEvolutionRegistrySnapshot,
  recordEvolutionRegistryEntry,
} from './evolution-registry.js';
