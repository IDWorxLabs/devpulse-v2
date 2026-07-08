/**
 * Autonomous Engineering Loop V1 — types.
 * AEL wraps AEE with iterative product reality, founder simulation, and capability evolution.
 */

import type { AeeFinalReport, AeeStage } from '../autonomous-engineering-executive/aee-types.js';
import type { ResolvedPromptFaithfulBuildPlan } from '../prompt-faithful-generation/index.js';

export const AUTONOMOUS_ENGINEERING_LOOP_V1_PASS_TOKEN =
  'AUTONOMOUS_ENGINEERING_LOOP_V1_PASS' as const;

export const AEL_OWNER_MODULE = 'devpulse_v2_autonomous_engineering_loop' as const;

export const AEL_MAX_CAPABILITY_EVOLUTION_ATTEMPTS = 2;
export const AEL_MAX_FOUNDER_LOOP_CYCLES = 3;
export const AEL_MAX_AUTOFIX_ATTEMPTS = 3;
export const AEL_MAX_PREVIEW_RECOVERY_ATTEMPTS = 2;
export const AEL_PRODUCT_REALITY_PASS_THRESHOLD = 70;

export type AelState =
  | 'AEL_NOT_STARTED'
  | 'AEL_INITIAL_BUILD'
  | 'AEL_PRODUCT_REALITY_CHECK'
  | 'AEL_FOUNDER_SIMULATION'
  | 'AEL_CAPABILITY_GAP_ANALYSIS'
  | 'AEL_CAPABILITY_EVOLUTION'
  | 'AEL_AUTOFIX_REPAIR'
  | 'AEL_PREVIEW_RETRY'
  | 'AEL_REVALIDATION'
  | 'AEL_LAUNCH_READY'
  | 'AEL_HUMAN_REVIEW_REQUIRED'
  | 'AEL_ENGINEERING_LIMIT_REACHED';

export type AelFinalOutcome =
  | 'LAUNCH_READY'
  | 'BUILD_READY_WITH_DEGRADED_PREVIEW'
  | 'BUILD_READY_WITH_FEATURE_GAPS'
  | 'HUMAN_REVIEW_REQUIRED'
  | 'ENGINEERING_LIMIT_REACHED'
  | 'CAPABILITY_BEYOND_CURRENT_SYSTEM'
  | 'SAFETY_REVIEW_REQUIRED';

export type AelDecision =
  | 'CONTINUE_LOOP'
  | 'RUN_AUTOFIX'
  | 'RUN_CAPABILITY_EVOLUTION'
  | 'RUN_PREVIEW_RECOVERY'
  | 'REQUEST_HUMAN_REVIEW'
  | 'DECLARE_LAUNCH_READY'
  | 'STOP_AT_ENGINEERING_LIMIT';

export type CapabilityType =
  | 'PRODUCT_FEATURE'
  | 'INTERACTION'
  | 'VALIDATION'
  | 'PREVIEW_VERIFICATION'
  | 'DATA_MODEL'
  | 'ROUTING'
  | 'ACCESSIBILITY'
  | 'SAFETY_POLICY'
  | 'INTEGRATION_PLACEHOLDER';

export interface ProductRealityReport {
  readOnly: true;
  productDomain: string;
  productRealityScore: number;
  requiredCapabilities: readonly string[];
  coveredCapabilities: readonly string[];
  missingCapabilities: readonly string[];
  genericFallbackDetected: boolean;
  coreWorkflowCoverage: number;
  interactionCoverage: number;
  routeCoverage: number;
  dataModelCoverage: number;
  launchReadinessBlockers: readonly string[];
  repairRecommendations: readonly string[];
}

export interface FounderLoopCycleReport {
  readOnly: true;
  cycle: number;
  verdict: 'LAUNCH_READY' | 'NEEDS_REPAIR' | 'NEEDS_CAPABILITY' | 'NEEDS_PREVIEW' | 'HUMAN_REVIEW' | 'SAFETY_REVIEW';
  launchBlockers: readonly string[];
  missingWorkflows: readonly string[];
  trustIssues: readonly string[];
  safetyGaps: readonly string[];
  routedTo: AelDecision | null;
}

export interface CapabilityEvolutionAttempt {
  readOnly: true;
  attempt: number;
  capabilityId: string;
  capabilityType: CapabilityType;
  safeToGenerate: boolean;
  generated: boolean;
  placeholderOnly: boolean;
  safetyGateBypassed: false;
  humanReviewRequired: boolean;
  evidence: readonly string[];
}

export interface AelCycleRecord {
  readOnly: true;
  cycle: number;
  state: AelState;
  productRealityScore: number;
  founderVerdict: string;
  decision: AelDecision;
  repairAction: string | null;
}

export interface AelEvidenceBundle {
  readOnly: true;
  npmBuildOk: boolean;
  npmInstallOk: boolean;
  previewOk: boolean;
  previewDegraded: boolean;
  productRealityReport: ProductRealityReport;
  founderLoopReport: FounderLoopCycleReport | null;
  autofixAttempts: number;
  capabilityEvolutionAttempts: number;
  previewRecoveryAttempts: number;
  aeeFurthestStage: AeeStage | null;
  aeeFinalReport: AeeFinalReport | null;
  engineeringIntelligenceScore: number | null;
  safetyReviewRequired: boolean;
  remainingGaps: readonly string[];
}

export interface AelFinalReport {
  readOnly: true;
  enabled: boolean;
  initialPrompt: string;
  domain: string;
  cyclesExecuted: number;
  aeeFurthestStage: AeeStage | null;
  productRealityScore: number;
  founderLoopResult: string;
  capabilitiesEvolved: readonly string[];
  autofixAttempts: number;
  previewRecoveryAttempts: number;
  capabilityEvolutionAttempts: number;
  finalOutcome: AelFinalOutcome;
  remainingGaps: readonly string[];
  humanReviewRequired: boolean;
  cycleHistory: readonly AelCycleRecord[];
  recordedAt: string;
}

export interface AelOrchestratorInput {
  rawPrompt: string;
  workspaceDir: string;
  projectRootDir: string;
  projectId: string;
  workspaceId: string;
  buildPlan: ResolvedPromptFaithfulBuildPlan;
  buildRunId: string;
  npmInstallOk: boolean;
  npmBuildOk: boolean;
  previewOk: boolean;
  previewDegraded: boolean;
  previewUrl: string | null;
  devServerUrl: string | null;
  generatedModules: readonly string[];
  aeeFinalReport: AeeFinalReport | null;
  aeeFurthestStage: AeeStage | null;
  autofixAttempts: number;
  previewRecoveryAttempts: number;
  engineeringIntelligenceScore?: number | null;
  rerunNpmBuild?: () => Promise<boolean>;
  runAutofix?: () => Promise<{ resolved: boolean; attempts: number }>;
  runPreviewRecovery?: () => Promise<{ resolved: boolean; attempts: number }>;
}

export interface AelOrchestratorResult {
  readOnly: true;
  enabled: boolean;
  finalState: AelState;
  finalOutcome: AelFinalOutcome;
  cyclesExecuted: number;
  report: AelFinalReport;
  evidence: AelEvidenceBundle;
  reportPaths: { json: string | null; markdown: string | null };
}

export interface AelValidationCheck {
  name: string;
  passed: boolean;
  detail: string;
}
