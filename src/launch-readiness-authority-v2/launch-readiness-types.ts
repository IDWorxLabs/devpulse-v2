/**
 * Launch Readiness Authority V2 — Era 3 Phase 12 types.
 * Evidence-driven launch verdict authority — does not build, repair, or improve applications.
 */

import type { AutonomousDebuggingPipelineResult } from '../autonomous-debugging-engine/autonomous-debugging-types.js';
import type { BehaviorSimulationPipelineResult } from '../behavior-simulation-engine/behavior-simulation-types.js';
import type { CapabilityPlanningPipelineResult } from '../capability-planning-engine/capability-planning-types.js';
import type { ContinuousImprovementPipelineResult } from '../continuous-product-improvement-engine/continuous-improvement-types.js';
import type { IncrementalBuildPipelineResult } from '../incremental-autonomous-builder/incremental-builder-types.js';
import type { InteractionProofPipelineResult } from '../interaction-proof-engine/interaction-proof-types.js';
import type { ProductIntelligenceModel } from '../intent-understanding-engine/intent-understanding-types.js';
import type { MissingCapabilityEvolutionPipelineResult } from '../missing-capability-evolution-engine/missing-capability-evolution-types.js';
import type { PromptFaithfulnessV2Result } from '../prompt-faithfulness-engine-v2/prompt-faithfulness-v2-types.js';
import type { VirtualDevicePipelineResult } from '../virtual-device-laboratory/virtual-device-types.js';
import type { VirtualUserPipelineResult } from '../virtual-user-engine/virtual-user-types.js';

export const LAUNCH_READINESS_AUTHORITY_V2_PASS_TOKEN = 'LAUNCH_READINESS_AUTHORITY_V2_PASS';
export const LAUNCH_READINESS_AUTHORITY_V2_OWNER_MODULE =
  'devpulse_v2_launch_readiness_authority_v2';
export const DEFAULT_MAX_LAUNCH_READINESS_HISTORY = 128;
export const EVIDENCE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const EVIDENCE_SCHEMA_VERSION = 'launch-readiness-authority-v2.1';

export type LaunchReadinessVerdict =
  | 'LAUNCH_READY'
  | 'NOT_LAUNCH_READY'
  | 'NEEDS_AUTONOMOUS_REPAIR'
  | 'NEEDS_CAPABILITY_EVOLUTION'
  | 'NEEDS_HUMAN_REVIEW'
  | 'BLOCKED';

export type LaunchEvidenceStatus = 'PASS' | 'FAIL' | 'WARNING' | 'UNAVAILABLE' | 'INCOMPLETE';

export type LaunchEvidenceSourceId =
  | 'INTENT_UNDERSTANDING'
  | 'PROMPT_FAITHFULNESS'
  | 'CAPABILITY_PLANNING'
  | 'MISSING_CAPABILITY_EVOLUTION'
  | 'INCREMENTAL_BUILD'
  | 'BEHAVIOR_SIMULATION'
  | 'VIRTUAL_USER'
  | 'VIRTUAL_DEVICE'
  | 'INTERACTION_PROOF'
  | 'AUTONOMOUS_DEBUGGING'
  | 'CONTINUOUS_IMPROVEMENT'
  | 'FOUNDER_TEST'
  | 'UVL'
  | 'EXECUTION_TRACE'
  | 'WORKSPACE_REALITY'
  | 'MATERIALIZATION_REALITY'
  | 'FEATURE_REALITY'
  | 'BUILD_REALITY'
  | 'SECURITY_VALIDATION'
  | 'PERFORMANCE_VALIDATION'
  | 'ACCESSIBILITY_VALIDATION';

export const REQUIRED_LAUNCH_EVIDENCE_SOURCES: readonly LaunchEvidenceSourceId[] = [
  'INTENT_UNDERSTANDING',
  'PROMPT_FAITHFULNESS',
  'CAPABILITY_PLANNING',
  'MISSING_CAPABILITY_EVOLUTION',
  'INCREMENTAL_BUILD',
  'BEHAVIOR_SIMULATION',
  'VIRTUAL_USER',
  'VIRTUAL_DEVICE',
  'INTERACTION_PROOF',
  'AUTONOMOUS_DEBUGGING',
  'CONTINUOUS_IMPROVEMENT',
  'FOUNDER_TEST',
  'UVL',
  'EXECUTION_TRACE',
  'WORKSPACE_REALITY',
  'MATERIALIZATION_REALITY',
  'FEATURE_REALITY',
  'BUILD_REALITY',
  'SECURITY_VALIDATION',
  'PERFORMANCE_VALIDATION',
  'ACCESSIBILITY_VALIDATION',
];

export type LaunchBlockerKind =
  | 'PROMPT_DRIFT'
  | 'MISSING_REQUIRED_CAPABILITY'
  | 'UNRESOLVED_AUTONOMOUS_DEBUGGING_FAILURE'
  | 'FAILED_BEHAVIOR_SCENARIO'
  | 'FAILED_VIRTUAL_USER_JOURNEY'
  | 'FAILED_DEVICE_PROFILE'
  | 'FAILED_INTERACTION_PROOF'
  | 'CRITICAL_ACCESSIBILITY_ISSUE'
  | 'CRITICAL_SECURITY_ISSUE'
  | 'CRITICAL_PERFORMANCE_ISSUE'
  | 'MISSING_EXECUTION_PROOF'
  | 'WORKSPACE_INCONSISTENCY'
  | 'MATERIALIZATION_FAILURE'
  | 'UNRESOLVED_REGRESSION'
  | 'BLOCKED_CONTINUOUS_IMPROVEMENT'
  | 'HUMAN_REVIEW_REQUIRED'
  | 'EVIDENCE_INCOMPLETE'
  | 'RESIDUAL_HIGH_RISK';

export type LaunchRiskCategory =
  | 'SECURITY'
  | 'ACCESSIBILITY'
  | 'RELIABILITY'
  | 'PERFORMANCE'
  | 'SCALABILITY'
  | 'PROMPT_FAITHFULNESS'
  | 'ARCHITECTURE'
  | 'CAPABILITY'
  | 'BEHAVIOR'
  | 'USABILITY'
  | 'DEVICE_COMPATIBILITY'
  | 'INTERACTION_INTEGRITY'
  | 'DATA_INTEGRITY'
  | 'RECOVERY'
  | 'MAINTAINABILITY';

export type LaunchReadinessCategory =
  | 'INTENT_QUALITY'
  | 'PROMPT_FAITHFULNESS'
  | 'CAPABILITY_READINESS'
  | 'FEATURE_STABILITY'
  | 'BEHAVIOR_READINESS'
  | 'USER_READINESS'
  | 'DEVICE_READINESS'
  | 'INTERACTION_READINESS'
  | 'DEBUGGING_READINESS'
  | 'IMPROVEMENT_READINESS'
  | 'SECURITY_READINESS'
  | 'ACCESSIBILITY_READINESS'
  | 'PERFORMANCE_READINESS'
  | 'EXECUTION_READINESS'
  | 'MATERIALIZATION_READINESS';

export type LaunchRoutingTarget =
  | 'CAPABILITY_PLANNING'
  | 'MISSING_CAPABILITY_EVOLUTION'
  | 'INCREMENTAL_BUILDER'
  | 'BEHAVIOR_SIMULATION'
  | 'VIRTUAL_USER'
  | 'VIRTUAL_DEVICE'
  | 'INTERACTION_PROOF'
  | 'AUTONOMOUS_DEBUGGING'
  | 'CONTINUOUS_IMPROVEMENT'
  | 'HUMAN_REVIEW';

export interface LaunchEvidenceSourceRecord {
  readOnly: true;
  sourceId: LaunchEvidenceSourceId;
  sourceName: string;
  status: LaunchEvidenceStatus;
  evidenceId: string;
  confidence: number;
  validationTimestamp: number;
  schemaVersion: string;
  affectedRequirements: readonly string[];
  affectedFeatures: readonly string[];
  warnings: readonly string[];
  blockers: readonly string[];
  residualRisk: readonly string[];
  supportingArtifacts: readonly string[];
}

export interface LaunchEvidenceCollectionResult {
  readOnly: true;
  collectedAt: number;
  schemaVersion: string;
  sources: readonly LaunchEvidenceSourceRecord[];
  missingSources: readonly LaunchEvidenceSourceId[];
  omittedSources: readonly LaunchEvidenceSourceId[];
}

export interface LaunchEvidenceValidationIssue {
  readOnly: true;
  code:
    | 'EVIDENCE_INCOMPLETE'
    | 'EVIDENCE_STALE'
    | 'EVIDENCE_CONFLICT'
    | 'EVIDENCE_DUPLICATE'
    | 'EVIDENCE_INVALID_SIGNATURE'
    | 'EVIDENCE_VERSION_INCOMPATIBLE'
    | 'MISSING_EVIDENCE';
  severity: 'BLOCKING' | 'WARNING';
  sourceId: LaunchEvidenceSourceId | null;
  detail: string;
}

export interface LaunchEvidenceValidationResult {
  readOnly: true;
  valid: boolean;
  primaryBlockReason: string | null;
  issues: readonly LaunchEvidenceValidationIssue[];
  freshnessScore: number;
  completenessScore: number;
  consistencyScore: number;
}

export interface LaunchBlockerRecord {
  readOnly: true;
  blockerId: string;
  kind: LaunchBlockerKind;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  sourceId: LaunchEvidenceSourceId;
  evidenceId: string;
  summary: string;
  affectedRequirements: readonly string[];
  affectedFeatures: readonly string[];
  routingTarget: LaunchRoutingTarget;
}

export interface LaunchRiskRecord {
  readOnly: true;
  riskId: string;
  category: LaunchRiskCategory;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  likelihood: 'LOW' | 'MEDIUM' | 'HIGH';
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  evidence: readonly string[];
  mitigation: string | null;
  residualRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  sourceId: LaunchEvidenceSourceId;
}

export interface LaunchConfidenceResult {
  readOnly: true;
  overallConfidence: number;
  engineeringConfidence: number;
  userConfidence: number;
  launchConfidence: number;
  evidenceCompleteness: number;
  evidenceQuality: number;
  validationCoverage: number;
  blockerOverrideApplied: boolean;
}

export interface LaunchReadinessCategoryScore {
  readOnly: true;
  category: LaunchReadinessCategory;
  score: number;
  evidenceCount: number;
  warnings: readonly string[];
  residualRisk: readonly string[];
  blocking: boolean;
}

export interface LaunchReadinessScoreResult {
  readOnly: true;
  categories: readonly LaunchReadinessCategoryScore[];
  overallScore: number;
  blockingCategories: readonly LaunchReadinessCategory[];
}

export interface LaunchVerdictResult {
  readOnly: true;
  verdict: LaunchReadinessVerdict;
  primaryReason: string;
  supportingEvidence: readonly string[];
  blockingEvidence: readonly string[];
  confidence: LaunchConfidenceResult;
  requiredNextStep: string;
  routingTarget: LaunchRoutingTarget | null;
  affectedGates: readonly string[];
}

export interface LaunchDecisionAuditRecord {
  readOnly: true;
  decisionId: string;
  timestamp: number;
  schemaVersion: string;
  evidenceSources: readonly LaunchEvidenceSourceId[];
  evidenceVersions: readonly string[];
  warnings: readonly string[];
  blockers: readonly LaunchBlockerRecord[];
  confidence: LaunchConfidenceResult;
  scores: LaunchReadinessScoreResult;
  verdict: LaunchVerdictResult;
  decisionTrace: readonly string[];
}

export interface LaunchDecisionExplanation {
  readOnly: true;
  verdict: LaunchReadinessVerdict;
  summaryLines: readonly string[];
  blockingSections: readonly { heading: string; lines: readonly string[] }[];
  recommendedNextAction: string;
  routingTarget: LaunchRoutingTarget | null;
}

export interface LaunchEvidenceDashboard {
  readOnly: true;
  verdict: LaunchReadinessVerdict;
  confidence: LaunchConfidenceResult;
  blockers: readonly LaunchBlockerRecord[];
  residualRisk: readonly LaunchRiskRecord[];
  evidenceCoverage: {
    required: number;
    collected: number;
    missing: readonly LaunchEvidenceSourceId[];
  };
  gateStatus: readonly { gate: string; status: string; sourceEvidenceId: string | null }[];
  repairHistory: readonly string[];
  capabilityEvolution: readonly string[];
  continuousImprovement: readonly string[];
  auditTrail: readonly string[];
  sourceLinks: readonly { sourceId: LaunchEvidenceSourceId; evidenceId: string }[];
}

export interface LaunchReadinessPipelineInput {
  rawPrompt: string;
  productIntelligenceModel?: ProductIntelligenceModel;
  promptFaithfulness?: PromptFaithfulnessV2Result;
  capabilityPlanning?: CapabilityPlanningPipelineResult;
  missingCapabilityEvolution?: MissingCapabilityEvolutionPipelineResult;
  incrementalBuild?: IncrementalBuildPipelineResult;
  behaviorSimulation?: BehaviorSimulationPipelineResult;
  virtualUserSimulation?: VirtualUserPipelineResult;
  virtualDeviceLaboratory?: VirtualDevicePipelineResult;
  interactionProof?: InteractionProofPipelineResult;
  autonomousDebugging?: AutonomousDebuggingPipelineResult;
  continuousImprovement?: ContinuousImprovementPipelineResult;
  projectRootDir?: string | null;
  workspaceDir?: string | null;
  simulateMissingExecutionTraceEvidence?: boolean;
  simulateUnresolvedCapability?: boolean;
  simulateVirtualUserEmergencyFailure?: boolean;
  simulateInteractionProofEmergencyUnreachable?: boolean;
  simulateAutonomousDebuggingExhaustion?: boolean;
  simulateCriticalAccessibilityRisk?: boolean;
  simulateContinuousImprovementBlocked?: boolean;
  omitEvidenceSources?: readonly LaunchEvidenceSourceId[];
}

export interface LaunchReadinessPipelineResult {
  readOnly: true;
  pipelineId: string;
  collectedAt: number;
  evidence: LaunchEvidenceCollectionResult;
  evidenceValidation: LaunchEvidenceValidationResult;
  blockers: readonly LaunchBlockerRecord[];
  risks: readonly LaunchRiskRecord[];
  confidence: LaunchConfidenceResult;
  scores: LaunchReadinessScoreResult;
  verdict: LaunchVerdictResult;
  audit: LaunchDecisionAuditRecord;
  explanation: LaunchDecisionExplanation;
  dashboard: LaunchEvidenceDashboard;
  reportMarkdown: string;
}

export interface LivePreviewLaunchReadinessGateResult {
  readOnly: true;
  unlocked: boolean;
  blockedReason: string | null;
  verdict: LaunchReadinessVerdict;
  gateStatus: string;
  requiredGates: readonly { gate: string; passed: boolean; evidenceId: string | null }[];
}
