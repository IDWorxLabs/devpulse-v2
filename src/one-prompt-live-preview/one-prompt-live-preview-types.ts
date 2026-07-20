/**
 * One-Prompt Live Preview — types.
 */

import type { GeneratedAppProfile } from '../code-generation-engine/code-generation-engine-types.js';

export type OnePromptBuildStatus = 'IDLE' | 'BUILDING' | 'READY' | 'FAILED';

export interface OnePromptLivePreviewBuildInput {
  rawPrompt: string;
  projectRootDir: string;
  source?: 'api' | 'chat' | 'validator';
  projectId?: string;
  projectName?: string;
  projectKind?: 'USER' | 'AUDIT' | 'SYSTEM_TEST';
  resumeExistingProject?: boolean;
  /** Validator-only: force ASE materialization denial to exercise continuation override branch */
  simulateAseMaterializationDenial?: boolean;
  /** Validator-only: exercise preview recovery repair resolution */
  simulatePreviewRecoveryRepair?: boolean;
  /** Validator-only: inject compile fault before npm build to exercise build AutoFix loop */
  simulateBuildAutofixFailure?: boolean;
  /** Validator-only: suppress repair resolution to exercise exhausted build repair budget */
  simulateBuildAutofixExhausted?: boolean;
  /** When true, skip the end-to-end build reality gate (caller runs E2E authority separately). */
  deferEndToEndBuildRealityGate?: boolean;
  /**
   * Build decision already resolved upstream (e.g. by the chat-to-build bridge's New Build
   * Decision Authority). When omitted, the orchestrator classifies the decision itself from
   * rawPrompt/projectId. See src/project-context-isolation-v4/.
   */
  buildDecisionKind?: 'NEW_BUILD' | 'CONTINUE_EXISTING_PROJECT' | 'AMBIGUOUS_REQUIRES_CONFIRMATION';
  /**
   * NEW_BUILD_CONFIRMATION_REQUIRED UX V4 — explicit build intent choice the caller resolved
   * upstream (chat-to-build bridge) in response to a prior confirmation panel. Carried through so
   * the context isolation report can show that confirmation was required and what was selected.
   */
  buildIntentOverride?: 'START_NEW_BUILD' | 'CONTINUE_EXISTING_PROJECT' | null;
  /**
   * Trusted server-side evidence that projectId was created for this exact request before the
   * orchestrator started. Never set this from an untrusted browser projectId.
   */
  freshProjectContextCreated?: boolean;
}

export interface OnePromptLivePreviewBuildResult {
  readOnly: true;
  buildId: string;
  projectId: string;
  projectName: string;
  status: OnePromptBuildStatus;
  prompt: string;
  requestType: 'BUILD_FROM_PROMPT' | 'CHAT_BUILD';
  workspaceId: string | null;
  workspacePath: string | null;
  generatedProfile: GeneratedAppProfile | null;
  planningProofLevel: string | null;
  materializationProofLevel: string | null;
  buildResult: 'PASS' | 'FAIL' | null;
  npmInstallOk: boolean;
  npmBuildOk: boolean;
  previewUrl: string | null;
  /** Dev server URL when gate locked — diagnostic only, not launch-ready preview */
  diagnosticPreviewUrl: string | null;
  limitedPreviewUrl: string | null;
  devServerRunning: boolean;
  livePreviewAvailable: boolean;
  /** Separated preview gate outcome — build may PASS while preview is DEGRADED */
  previewStatus?: 'UNLOCKED' | 'DEGRADED' | 'UNAVAILABLE' | 'NOT_ATTEMPTED';
  previewRecoveryAttempts?: number;
  buildAutofixAttempts?: number;
  buildAutofixLoop?: import('../autonomous-engineering-executive/aee-build-autofix-loop-types.js').AeeBuildAutofixLoopResult | null;
  previewContract?: import('../autonomous-engineering-executive/aee-preview-contract-types.js').AeePreviewContractResult | null;
  failureReason: string | null;
  featureSignals: {
    addTask: boolean;
    markComplete: boolean;
    deleteTask: boolean;
    filter: boolean;
    activeCount: boolean;
    reactMount: boolean;
  } | null;
  materializationManifest: import('../universal-prompt-to-app-materialization/generated-app-manifest.js').GeneratedAppManifest | null;
  /** Workspace Materialization Stabilizer report — audited/repaired before npm install ever runs. */
  workspaceStabilizerReport?: import('../workspace-materialization-stabilizer-v1/workspace-materialization-types.js').WorkspaceMaterializationReport | null;
  /** Build Execution Stabilizer — observable/bounded/recoverable execution across every stage. */
  buildExecutionStatus?: import('../build-execution-stabilizer-v1/build-execution-types.js').BuildExecutionState;
  executionTimeline?: import('../build-execution-stabilizer-v1/build-execution-types.js').BuildExecutionTimelineEntry[];
  executionRecovery?: import('../build-execution-stabilizer-v1/build-execution-types.js').BuildExecutionRecoveryAttempt[];
  executionReport?: import('../build-execution-stabilizer-v1/build-execution-types.js').BuildExecutionReport | null;
  livePreviewGate: import('../live-preview-gate/live-preview-gate-types.js').LivePreviewGateResult | null;
  autonomousSoftwareEngineering: import('../autonomous-software-engineering-engine/ase-types.js').AutonomousSoftwareEngineeringResult | null;
  aeeExecutiveDecision?: import('../autonomous-engineering-executive/aee-types.js').AeeExecutiveDecisionResult | null;
  aeeFinalReport?: import('../autonomous-engineering-executive/aee-types.js').AeeFinalReport | null;
  aelReport?: import('../autonomous-engineering-loop/ael-types.js').AelFinalReport | null;
  aelFinalOutcome?: import('../autonomous-engineering-loop/ael-types.js').AelFinalOutcome | null;
  aelEvidence?: import('../autonomous-engineering-loop/ael-types.js').AelEvidenceBundle | null;
  /** Project Context Isolation V4 report — makes stale-context prevention visible on every build. */
  contextIsolation?: import('../project-context-isolation-v4/index.js').ContextIsolationReportSection | null;
  /**
   * Identity Computation Collapse V1 (PPC-1207 No Parallel Truth) — the single approved,
   * CBGA-repaired product identity this build's generation stages consumed. `null` only for builds
   * that failed before Contract-Bound Generation Authority V4 ran.
   */
  approvedProductIdentity?: import('../contract-bound-generation-authority-v4/index.js').ApprovedProductIdentity | null;
  /**
   * Navigation Computation Collapse V1 (PPC-1207 No Parallel Truth) — the single approved,
   * CBGA-repaired navigation plan every production generator this build consumed instead of
   * independently deriving/inferring/merging navigation of its own. `null` only for build paths
   * that failed before Contract-Bound Generation Authority V4 ran.
   */
  approvedNavigationPlan?: import('../contract-bound-generation-authority-v4/index.js').ApprovedNavigationPlan | null;
  /**
   * Module Computation Collapse V1 (PPC-1207 No Parallel Truth) — the single approved,
   * CBGA-repaired module plan every production generator this build consumed instead of
   * independently deriving/inferring/merging/inventing a module list of its own. `null` only for
   * build paths that failed before Contract-Bound Generation Authority V4 ran.
   */
  approvedModulePlan?: import('../contract-bound-generation-authority-v4/index.js').ApprovedModulePlan | null;
  /**
   * Metadata Computation Collapse V1 (PPC-1207 No Parallel Truth) — the single, composed metadata
   * plan (title, subtitle, description, module/navigation/route counts, summary strings) every
   * downstream stage this build's generation consumed instead of independently parsing/inferring/
   * counting/summarizing metadata of its own. `null` only for build paths that failed before
   * Contract-Bound Generation Authority V4 ran.
   */
  approvedMetadataPlan?: import('../contract-bound-generation-authority-v4/index.js').ApprovedMetadataPlan | null;
  /**
   * Sample Data Computation Collapse V1 (PPC-1207 No Parallel Truth) — the single, composed sample
   * data plan every downstream stage this build's generation consumed instead of independently
   * inventing sample/demo/preview/seed data of its own. `null` only for build paths that failed
   * before Contract-Bound Generation Authority V4 ran.
   */
  approvedSampleDataPlan?: import('../contract-bound-generation-authority-v4/index.js').ApprovedSampleDataPlan | null;
  /**
   * Provenance Computation Collapse V1 (PPC-1207 No Parallel Truth) — the single, composed
   * provenance/ancestry plan every downstream stage this build's generation consumed instead of
   * independently reconstructing/inferring artifact provenance of its own. `null` only for build
   * paths that failed before Contract-Bound Generation Authority V4 ran.
   */
  approvedProvenancePlan?: import('../contract-bound-generation-authority-v4/index.js').ApprovedProvenancePlan | null;
  /**
   * Repair Reality Alignment V1 (PPC-1207 No Parallel Truth) — the single classified repair record
   * every downstream stage consumed instead of inferring repair type or claiming false mutations.
   */
  approvedRepairRealityPlan?: import('../contract-bound-generation-authority-v4/index.js').ApprovedRepairRealityPlan | null;
  /**
   * Final Immutable Production Pipeline V1 (PPC-1207 No Parallel Truth) — the single immutable
   * ApprovedProductionBuildEnvelope every downstream production stage consumed instead of reading
   * individual constitutional handoffs in parallel. `null` only when CBGA never ran.
   */
  approvedProductionBuildEnvelope?: import('../contract-bound-generation-authority-v4/index.js').ApprovedProductionBuildEnvelope | null;
  /**
   * Fresh Build Artifact Isolation V4 — the runtime evidence scope minted for this build (ids,
   * allowed/blocked evidence namespaces, purge actions performed, stale evidence detections).
   * Every downstream consumer (product faithfulness, live preview proof, report rendering, UI)
   * should validate evidence against this scope before using/displaying it.
   */
  runtimeEvidenceScope?: import('../fresh-build-artifact-isolation-v4/index.js').RuntimeEvidenceScope | null;
  /**
   * Autonomous Engineering Orchestrator V1 — when a build stopped with a failed result, this is
   * AEO's diagnosis of why, which existing repair capability it checked, whether that repair was
   * production-wired/safe, and (when no safe repair exists) the missing capability required to
   * continue automatically. Null when AEO was not invoked for this build.
   */
  aeoReport?: import('../autonomous-engineering-orchestrator-v1/index.js').AeoOrchestratorReport | null;
  /**
   * Generation Pipeline Compliance Authority V1 — proof (or disproof) that every real generation
   * stage for this build actually consumed Contract-Bound Generation Authority's approved plans
   * instead of a legacy template or generic blueprint default. Null when GPCA was not run.
   */
  gpcaComplianceReport?: import('../generation-pipeline-compliance-authority-v1/index.js').GpcaComplianceReport | null;
  /**
   * GPCA Production Enforcement Fix V1 — set true the moment GPCA's gate is the reason this
   * build terminated. When true, `status` is always 'FAILED', `previewUrl`/`livePreviewAvailable`
   * are always false, and no workspace-generation/npm-build/dev-server/live-preview-proof stage
   * downstream of the gate is ever allowed to run for this build — the gate result is terminal,
   * never something Autonomous Software/Engineering continuation logic may override.
   */
  gpcaHardStop?: boolean;
  /** True whenever a GPCA hard-stop occurred — the build was never allowed to reach a servable/promoted workspace. */
  gpcaBlockedMaterialization?: boolean;
  /** True whenever a GPCA hard-stop occurred — the dev server / live preview proof were never started for this build. */
  gpcaBlockedPreviewActivation?: boolean;
  /**
   * Production Pipeline Constitution Adoption Phase 1 — the permanent constitutional rule IDs
   * (docs/production-pipeline-constitution-v1.md) violated when this build's GPCA report was
   * invalidated by a post-audit workspace mutation (or was blocking at the pre-preview final
   * gate). Present only when a GPCA hard-stop tied to this milestone's re-audit wiring occurred.
   */
  gpcaViolatedConstitutionRuleIds?: readonly string[];
  updatedAt: string;
}

export interface OnePromptLivePreviewPublicState {
  status: OnePromptBuildStatus;
  projectId: string | null;
  projectName: string | null;
  workspaceId: string | null;
  workspacePath: string | null;
  generatedProfile: GeneratedAppProfile | null;
  buildResult: 'PASS' | 'FAIL' | null;
  previewUrl: string | null;
  diagnosticPreviewUrl: string | null;
  devServerRunning: boolean;
  livePreviewAvailable: boolean;
  livePreviewGateState: string | null;
  gateBlockerSummary: string | null;
  limitedPreviewUrl: string | null;
  failureReason: string | null;
  buildStatusLabel: string;
  connected: boolean;
}
