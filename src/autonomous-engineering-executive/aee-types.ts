/**
 * Autonomous Engineering Executive V1 — types.
 * AEE is the sole build-spine authority for execution continuation decisions.
 */

import type { ResolvedPromptFaithfulBuildPlan } from '../prompt-faithful-generation/index.js';

export const AUTONOMOUS_ENGINEERING_EXECUTIVE_V1_PASS_TOKEN =
  'AUTONOMOUS_ENGINEERING_EXECUTIVE_V1_PASS' as const;

export const AEE_OWNER_MODULE = 'devpulse_v2_autonomous_engineering_executive' as const;

export const AEE_OVERRIDE_ASE_DENIAL_EVENT = 'AEE_OVERRIDE_ASE_DENIAL' as const;

export const AEE_CONTINUATION_OVERRIDE_MESSAGE =
  'AEE overrides authority denial — build spine continues forward.' as const;

export type AeeStage =
  | 'PROMPT_RECEIVED'
  | 'UNDERSTOOD'
  | 'PLANNING'
  | 'GENERATING'
  | 'WORKSPACE_READY'
  | 'INSTALLING'
  | 'BUILDING'
  | 'AUTO_REPAIRING'
  | 'PREVIEWING'
  | 'VERIFYING'
  | 'FINAL_REPORT'
  | 'STOPPED';

export type AeeDecision = 'CONTINUE' | 'REPAIR' | 'RETRY' | 'ROLLBACK' | 'PREVIEW' | 'STOP';

export type AeeEvidenceSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export type AeeEvidenceRecommendation = AeeDecision;

export type AeeBuildOutcome =
  | 'BUILD_COMPLETED_WITH_PREVIEW'
  | 'BUILD_COMPLETED_WITH_DEGRADED_PREVIEW'
  | 'BUILD_COMPLETED_WITH_FEATURE_GAPS'
  | 'BUILD_COMPLETED_WITH_BUILD_ERRORS'
  | 'BUILD_STOPPED_BEFORE_WORKSPACE'
  | 'BUILD_STOPPED_AFTER_REPAIR_EXHAUSTED'
  | 'BUILD_STOPPED_FOR_CONCRETE_BLOCKER';

export interface AeeEvidenceResult {
  readOnly: true;
  authority: string;
  stage: AeeStage;
  severity: AeeEvidenceSeverity;
  recommendation: AeeEvidenceRecommendation;
  confidence: number;
  reason: string;
  evidenceAvailable: readonly string[];
  evidenceMissing: readonly string[];
  canBlockContinuation: boolean;
  concreteBlocker: boolean;
  source: string;
}

export interface AeeExecutiveDecisionInput {
  workspaceDir: string;
  buildPlan: ResolvedPromptFaithfulBuildPlan;
  rawPrompt: string;
  projectId: string;
  projectName: string;
  aseBlockers: readonly string[];
  aseMaterializationAuthorized: boolean;
  /** False when ASE authorized materialization but the host action did not complete. */
  aseMaterializationExecuted?: boolean;
  featureRealityStatus?: string | null;
  manifestFaithfulness?: { status: string; score: number };
  generatedFileCount?: number;
  npmInstallOk?: boolean;
  npmBuildOk?: boolean;
  previewOk?: boolean;
  previewDegraded?: boolean;
  repairAttempts?: number;
  retryAttempts?: number;
  previewRecoveryAttempts?: number;
  engineeringIntelligenceReport?: import('../engineering-intelligence-runtime/index.js').EngineeringIntelligenceReport | null;
  engineeringIntelligenceFidelityPassed?: boolean;
}

export interface AeeExecutiveDecisionResult {
  readOnly: true;
  decision: AeeDecision;
  stage: AeeStage;
  outcome: AeeBuildOutcome | null;
  shouldContinueToBuild: boolean;
  shouldMaterializeFirst: boolean;
  overrideEvent: string | null;
  overriddenBlockers: readonly string[];
  respectedBlockers: readonly string[];
  evidence: readonly AeeEvidenceResult[];
  reasoning: string;
  furthestStageReached: AeeStage;
  repairAttempts: number;
  retryAttempts: number;
  previewRecoveryAttempts: number;
}

export interface AeeFinalReport {
  readOnly: true;
  projectName: string;
  selectedProfile: string;
  generatedModules: readonly string[];
  workspacePath: string;
  buildSpineStageReached: AeeStage;
  finalDecision: AeeDecision;
  finalOutcome: AeeBuildOutcome | null;
  evidenceProvidersConsulted: readonly string[];
  blockersOverridden: readonly string[];
  blockersRespected: readonly string[];
  repairAttempts: number;
  retryAttempts: number;
  previewRecoveryAttempts?: number;
  buildAutofixReport?: import('./aee-build-autofix-loop-types.js').AeeBuildAutofixReport | null;
  previewContractSummary?: string | null;
  engineeringIntelligenceReport?: import('../engineering-intelligence-runtime/index.js').EngineeringIntelligenceReport | null;
  npmInstallResult: 'PASS' | 'FAIL' | 'PENDING';
  npmBuildResult: 'PASS' | 'FAIL' | 'PENDING';
  previewResult: 'PASS' | 'DEGRADED' | 'FAIL' | 'PENDING';
  livePreviewUrl: string | null;
  remainingGaps: readonly string[];
  overrideEvents: readonly string[];
  recordedAt: string;
}

export interface AeeRuntimeRecord {
  readOnly: true;
  runId: string;
  projectId: string;
  stage: AeeStage;
  decision: AeeDecision;
  event: string | null;
  reasoning: string;
  timestamp: string;
}
