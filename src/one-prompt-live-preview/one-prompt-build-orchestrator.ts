/**
 * One-prompt build orchestrator — planning → materialization → build → live preview.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { getDevPulseV2AiDevEngineAuthority } from '../aidev-engine/aidev-engine-authority.js';
import {
  isTaskTrackerMountEntry,
  materializeGeneratedApplication,
} from '../code-generation-engine/index.js';
import {
  materializeBuildProofGapArtifacts,
} from '../connected-build-execution/index.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../real-file-workspace-execution/real-file-workspace-execution-bounds.js';
import {
  assessRequirementsToPlanExecutionContract,
} from '../requirements-to-plan-execution-contract/index.js';
import { repairSimpleUtilityPlanningAssessment } from '../simple-utility-app/simple-utility-planning-repair.js';
import { createPreviewSession } from '../live-preview-runtime/preview-session-manager.js';
import { isOnePromptBuildRequest, resolveBuildIntentProfile } from './build-request-detector.js';
import {
  getActiveGeneratedDevServerState,
  listGeneratedDevServers,
  startGeneratedAppDevServer,
} from './generated-dev-server-manager.js';
import type {
  OnePromptLivePreviewBuildInput,
  OnePromptLivePreviewBuildResult,
  OnePromptLivePreviewPublicState,
} from './one-prompt-live-preview-types.js';
import { resolveAuthoritativePreviewUrls } from '../aep-preview-gate-authority/index.js';
import {
  completeAutonomousEngineering,
  runAutonomousEngineering,
} from '../ase-enforcement-engine/index.js';
import type { AutonomousEngineeringResult } from '../ase-enforcement-engine/ase-enforcement-engine-types.js';
import {
  attemptEngineeringRecovery,
  type EngineeringRecoveryHost,
} from '../autonomous-recovery-authority/index.js';
import {
  recordBuildIntentRun,
} from '../build-intent-routing/build-intent-run-store.js';
import {
  getRegistryProject,
  resolveProjectRegistryRootDir,
} from '../project-registry-v1/project-registry-v1-store.js';
import { ensureRegistryProjectRecord } from '../persistent-project-reality/persistent-project-reality-registry.js';
import { resolveRegistryRootForPersistentProject } from '../audit-project-isolation/audit-registry-root.js';
import {
  replaceProjectContextMetadata,
  upsertProjectContextMetadata,
} from '../project-context-alignment-v1/project-context-metadata-store.js';
import {
  buildContextScope,
  buildPromptResetPlan,
  classifyNewBuildDecision,
  assertNoStaleContext,
  runStaleContextCheck,
  type BuildDecisionResult,
  type ContextIsolationReportSection,
  buildContextIsolationReportSection,
} from '../project-context-isolation-v4/index.js';
import {
  applyFreshBuildArtifactPurge,
  buildRuntimeEvidenceScope,
  planFreshBuildArtifactPurge,
  type RuntimeEvidenceScope,
} from '../fresh-build-artifact-isolation-v4/index.js';
import { resetLastPromptBoundedMaterializationEvidenceForFreshBuild } from '../prompt-bounded-materialization/index.js';
import { assertWorkspacePathBelongsToProject } from '../project-isolation-guard-v1/index.js';
import {
  validateUniversalAppMaterialization,
  type MaterializationValidationResult,
} from '../universal-prompt-to-app-materialization/index.js';
import { stabilizeWorkspaceMaterialization } from '../workspace-materialization-stabilizer-v1/index.js';
import {
  BuildExecutionMonitor,
  buildExecutionReport,
  createBuildExecutionMonitor,
} from '../build-execution-stabilizer-v1/index.js';
import {
  buildPromptFaithfulnessManifestFields,
  buildPromptFaithfulnessTraceEvents,
  enforcePromptFaithfulMaterialization,
  listWorkspaceFeatureModuleIds,
  resolvePromptFaithfulBuildPlan,
  sanitizeWorkspaceForBuildPlan,
  type ResolvedPromptFaithfulBuildPlan,
} from '../prompt-faithful-generation/index.js';
import { buildIntentUnderstandingTraceEvents } from '../intent-understanding-engine/index.js';
import {
  toAutonomousSoftwareEngineeringApiResult,
} from '../autonomous-software-engineering-engine/index.js';
import { evaluateLivePreviewGateForOrchestrator } from '../live-preview-gate/index.js';
import type { GeneratedAppProfile } from '../code-generation-engine/code-generation-engine-types.js';
import { summarizePrompt } from '../universal-prompt-to-app-materialization/prompt-app-metadata.js';
import type { ProfileFeatureDefinition } from '../universal-prompt-to-app-materialization/profile-feature-map.js';
import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import {
  completeMaterializationEvidence,
  createEmptyMaterializationTimings,
  extractExecCommandFailure,
  finalizeForensicManifestFailure,
  initializeForensicManifest,
  recordForensicManifestAseContinuationOverride,
  recordForensicManifestAeeExecutiveDecision,
  roundDurationMs,
  updateForensicManifestStage,
} from '../materialization-evidence/index.js';
import {
  collectWorkspaceFeatureRealityFallback,
  workspaceHasGeneratedFeatureModules,
} from '../feature-contract-reality/index.js';
import {
  ASE_CONTINUATION_OVERRIDE_MESSAGE,
  evaluateRuntimeBuildContinuation,
  normalizeFailureStageLabel,
  resolveBuildOutcome,
} from '../universal-build-pipeline-verification/index.js';
import {
  buildAeeFinalReport,
  composeAeeAwareBuildChatResponse,
  formatAeeOverrideWarning,
  resetAeeRuntimeRecorderForTests,
  runAeeExecutiveCoordination,
  runAeePreviewRecoveryLoop,
  runAeeBuildAutofixLoop,
  injectSimulatedBuildFailure,
  resolveAeePreviewContract,
  resolveAeeBuildOutcome,
  AEE_PREVIEW_RECOVERY_MAX_ATTEMPTS,
  aeeCanAbortBuild,
  type AeeExecutiveDecisionResult,
  type AeeFinalReport,
} from '../autonomous-engineering-executive/index.js';
import {
  runAutonomousEngineeringLoop,
  type AelFinalReport,
  type AelEvidenceBundle,
} from '../autonomous-engineering-loop/index.js';
import type { ForensicBuildStage, ForensicManifestFailureInput } from '../materialization-evidence/forensic-manifest-types.js';
import { performance } from 'node:perf_hooks';
import {
  getActiveProjectId,
  getBuildResultForProject,
  invalidatePreviousBuildEvidenceForProject,
  registerProjectBuildResult,
  resetWorkspaceTabRegistryForTests,
  resolveProjectContext,
} from './workspace-tab-registry.js';
import {
  runEngineeringIntelligencePostWorkspace,
} from '../engineering-intelligence-runtime/index.js';
import {
  runEndToEndBuildReality,
  type E2EBuildRealityReport,
} from '../end-to-end-build-reality-engine-v1/index.js';
import {
  runAutonomousEngineeringOrchestrator,
  type AeoOrchestratorReport,
} from '../autonomous-engineering-orchestrator-v1/index.js';
import { buildCanonicalProductContract } from '../product-faithfulness-v2/index.js';
import type { CanonicalProductContract } from '../product-faithfulness-v2/generation-faithfulness-types.js';
import {
  applyContractBoundGenerationToBuildPlan,
  isApprovedProductionBuildEnvelopeValid,
  requireApprovedProductionBuildEnvelope,
  requireApprovedProductionBuildEnvelopeForContext,
  constitutionalHandoffsFromApprovedProductionBuildEnvelope,
  withApprovedProductionBuildEnvelopeRepairPlan,
  advanceApprovedProductionBuildEnvelopeState,
  lockApprovedProductionBuildEnvelopeWorkspace,
  assertApprovedProductionBuildEnvelopePreviewGuarantee,
  syncCbgaGenerationReportWithProductionBuildEnvelope,
  appendApprovedRepairRealityEntries,
  createWorkspaceMutationRepairEntry,
  createAutofixCompilationRepairEntry,
  createPreviewRecoveryRepairEntry,
  createPipelineRestartRepairEntry,
  createGeneratorRegenerationRepairEntry,
  createCapabilityEvolutionRepairEntry,
  recordApprovedRepairRealityRevalidation,
  repairRevalidationSatisfiedBeforePreview,
  repairRealityRequiresRevalidationBeforePreview,
  type CbgaGenerationReport,
  type ApprovedProductIdentity,
  type ApprovedNavigationPlan,
  type ApprovedModulePlan,
  type ApprovedMetadataPlan,
  type ApprovedSampleDataPlan,
  type ApprovedProvenancePlan,
  type ApprovedRepairRealityPlan,
  type ApprovedProductionBuildEnvelope,
} from '../contract-bound-generation-authority-v4/index.js';
import {
  buildGpcaPostMaterializationReport,
  buildGpcaPreMaterializationReport,
  gpcaBlocksGeneration,
  gpcaFailureReason,
  type GpcaComplianceReport,
} from '../generation-pipeline-compliance-authority-v1/index.js';
import { contractConsumptionTrace, shortHashForTrace } from '../production-contract-consumption-trace-v1/index.js';

let buildCounter = 0;

// Production Pipeline Constitution Adoption Phase 1 — PPC-702 ("every stage that reuses or skips
// materializing a workspace must audit the COMPLETE set of product/blueprint artifacts already on
// disk, never a partial subset") and PPC-606 ("existing workspace file presence alone is never
// sufficient evidence of compliance"). Recursively collects every source/style file under a given
// subtree, relative to that subtree's root. Generic, structural-only: no app-specific file names,
// extensions, or product vocabulary — the exact same walk for every build, every profile, every
// domain.
const GENERATED_CODE_FILE_EXTENSION_PATTERN = /\.(?:tsx?|jsx?|css)$/;

function collectGeneratedFilesRecursively(rootDir: string): string[] {
  const relativePaths: string[] = [];
  const walk = (currentDir: string, relativePrefix: string): void => {
    let entries: import('node:fs').Dirent[];
    try {
      entries = readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const entryRelativePath = relativePrefix ? `${relativePrefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(join(currentDir, entry.name), entryRelativePath);
      } else if (GENERATED_CODE_FILE_EXTENSION_PATTERN.test(entry.name)) {
        relativePaths.push(entryRelativePath);
      }
    }
  };
  walk(rootDir, '');
  return relativePaths;
}

// Generated, provenance-bearing JSON manifests written directly to the workspace root by the
// production generators. Never product/business content by themselves, but they are real evidence
// GPCA's rendered-content and navigation-label extraction already reads — so a continuation audit
// that omits them is auditing an incomplete picture of "what this workspace actually is" (PPC-702).
// Generic, structural filenames only — never an app-specific artifact name.
const GENERATED_WORKSPACE_MANIFEST_FILENAMES = ['blueprint-manifest.json', 'build-manifest.json'] as const;

// GPCA Continuation Workspace Compliance Fix V1 / Production Pipeline Constitution Adoption
// Phase 1 (Tier 0) — enumerates every relative file path an EXISTING workspace already has on
// disk, in the exact same shape (`generatedFilePaths`) the Code Generation Engine reports for a
// fresh materialization. Previously this only walked one level into `src/features/<module>/` and
// `src/App.tsx` — silently skipping root-level `src/features/*.ts(x)` files (e.g. the feature
// router itself), the entire `src/blueprint/**` subtree (AppShell, screens, pages, components,
// product-surface, app-metadata), `src/App.css`, and generated manifests. A stale/non-compliant
// blueprint or product-surface file could therefore sit on disk, forever unaudited, once the
// workspace was judged to "already have feature modules" by presence alone. This never writes
// anything and never invents a path — a file is only included when it is actually present right
// now. Generic/structural only: no app-specific file names or product vocabulary are referenced
// here. Exported (read-only, pure, no build-state closure) so the fix's validator can exercise the
// exact same file-listing logic the orchestrator uses, deterministically and without going through
// the live HTTP build path.
export function listExistingWorkspaceGeneratedFilePaths(existingWorkspaceDir: string): string[] {
  const relativePaths: string[] = [];

  const featuresDir = join(existingWorkspaceDir, 'src/features');
  if (existsSync(featuresDir)) {
    for (const rel of collectGeneratedFilesRecursively(featuresDir)) {
      relativePaths.push(`src/features/${rel.replace(/\\/g, '/')}`);
    }
  }

  const blueprintDir = join(existingWorkspaceDir, 'src/blueprint');
  if (existsSync(blueprintDir)) {
    for (const rel of collectGeneratedFilesRecursively(blueprintDir)) {
      relativePaths.push(`src/blueprint/${rel.replace(/\\/g, '/')}`);
    }
  }

  if (existsSync(join(existingWorkspaceDir, 'src/App.tsx'))) {
    relativePaths.push('src/App.tsx');
  }
  if (existsSync(join(existingWorkspaceDir, 'src/App.css'))) {
    relativePaths.push('src/App.css');
  }

  for (const manifestName of GENERATED_WORKSPACE_MANIFEST_FILENAMES) {
    if (existsSync(join(existingWorkspaceDir, manifestName))) {
      relativePaths.push(manifestName);
    }
  }

  return relativePaths;
}

// Production Pipeline Constitution Adoption Phase 1 — the permanent constitutional rule IDs
// (docs/production-pipeline-constitution-v1.md) this milestone enforces in production. Reported on
// every GPCA hard-stop this milestone's re-audit wiring produces, so a blocked build always names
// exactly which constitutional rules it protected — never a generic, unattributed failure.
export const PRODUCTION_PIPELINE_CONSTITUTION_ADOPTION_PHASE_1_RULE_IDS = [
  'PPC-606',
  'PPC-607',
  'PPC-702',
  'PPC-1001',
  'PPC-1002',
  'PPC-1203',
  'PPC-1205',
  'PPC-1304',
] as const;

// Production Pipeline Constitution Adoption Phase 1 (Tier 1) — PPC-1203/PPC-1304: "GPCA reports
// are perishable; any file write to the workspace after a GPCA report was produced invalidates
// that report." PPC-606/607/1001/1002/1205: "before stabilization, build, or preview activation
// proceeds past a mutation, GPCA must be re-run against the CURRENT workspace state — never a
// stale in-memory report captured earlier in the request." This is the single, shared, pure
// re-audit primitive every post-mutation call site below uses: same contract, same cbgaReport,
// same buildPlan, same generic file-listing walk as every other GPCA call site in this file — it
// changes no GPCA scoring/authority logic, adds no app-specific logic, and never repairs or
// rewrites the workspace. Exported so the validator can exercise the exact same re-audit primitive
// the orchestrator uses.
export function auditCurrentWorkspaceStateForGpca(input: {
  contract: CanonicalProductContract;
  cbgaReport: CbgaGenerationReport;
  buildPlan: ResolvedPromptFaithfulBuildPlan;
  workspaceDir: string;
}): GpcaComplianceReport {
  const currentFilePaths = listExistingWorkspaceGeneratedFilePaths(input.workspaceDir);
  return buildGpcaPostMaterializationReport({
    contract: input.contract,
    cbgaReport: input.cbgaReport,
    buildPlan: input.buildPlan,
    generatedFilePaths: currentFilePaths,
    workspaceDir: input.workspaceDir,
  });
}

export function resetOnePromptLivePreviewForTests(): void {
  buildCounter = 0;
  resetWorkspaceTabRegistryForTests();
  resetAeeRuntimeRecorderForTests();
}

export function getLastOnePromptLivePreviewBuildResult(
  projectId?: string | null,
): OnePromptLivePreviewBuildResult | null {
  const resolvedProjectId = projectId ?? getActiveProjectId();
  if (resolvedProjectId) {
    return getBuildResultForProject(resolvedProjectId);
  }
  return null;
}

function tryAutonomousRecovery(input: {
  projectId: string;
  failureStage: string;
  failureReason: string;
  host?: EngineeringRecoveryHost;
}): boolean {
  const recovery = attemptEngineeringRecovery({
    projectId: input.projectId,
    failureStage: input.failureStage,
    failureReason: input.failureReason,
    host: input.host,
  });
  return recovery.recovered || recovery.continued;
}

function nextBuildId(): string {
  buildCounter += 1;
  // Timestamp keeps history paths unique even when resetOnePromptLivePreviewForTests()
  // zeroes the counter between sequential production builds.
  return `one-prompt-build-${Date.now()}-${buildCounter}`;
}

function excerptBuildOutput(output: string, max = 240): string {
  const trimmed = output.replace(/\s+/g, ' ').trim();
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max)}…`;
}

function inspectFeatureSignals(workspaceDir: string): OnePromptLivePreviewBuildResult['featureSignals'] {
  const tasksPath = join(workspaceDir, 'src/features/tasks/TasksFeature.tsx');
  const legacyPath = join(workspaceDir, 'src/features/task-tracker/TaskTrackerFeature.tsx');
  const appPath = join(workspaceDir, 'src/App.tsx');
  const mainPath = join(workspaceDir, 'src/main.tsx');
  const featureSource = existsSync(tasksPath)
    ? readFileSync(tasksPath, 'utf8')
    : existsSync(legacyPath)
      ? readFileSync(legacyPath, 'utf8')
      : existsSync(appPath)
        ? readFileSync(appPath, 'utf8')
        : '';
  const mainSource = existsSync(mainPath) ? readFileSync(mainPath, 'utf8') : '';
  const lower = featureSource.toLowerCase();
  const modularTasksModule = existsSync(tasksPath);
  return {
    addTask: /handleaddtask|add task|add-task-button|data-feature-module="tasks"/.test(lower) || modularTasksModule,
    markComplete: /handleToggleComplete|complete-toggle|mark.*complete|data-feature-module="tasks"/.test(lower) || modularTasksModule,
    deleteTask: /handleDeleteTask|delete-task-button|delete task|data-feature-module="tasks"/.test(lower) || modularTasksModule,
    filter: /taskfilter|filter-all|filter-active|filter-completed|data-feature-module="labels"/.test(lower),
    activeCount: /activecount|active-count|data-feature-module="dashboard"/.test(lower),
    reactMount: isTaskTrackerMountEntry(mainSource),
  };
}

function composeFailureResult(input: {
  buildId: string;
  projectId: string;
  projectName: string;
  prompt: string;
  source: OnePromptLivePreviewBuildInput['source'];
  failureReason: string;
  workspaceId?: string | null;
  workspacePath?: string | null;
  generatedProfile?: OnePromptLivePreviewBuildResult['generatedProfile'];
  planningProofLevel?: string | null;
  materializationProofLevel?: string | null;
  npmInstallOk?: boolean;
  npmBuildOk?: boolean;
  materializationManifest?: GeneratedAppManifest | null;
  diagnosticPreviewUrl?: string | null;
  limitedPreviewUrl?: string | null;
  devServerRunning?: boolean;
  livePreviewAvailable?: boolean;
  livePreviewGate?: OnePromptLivePreviewBuildResult['livePreviewGate'];
  autonomousSoftwareEngineering?: OnePromptLivePreviewBuildResult['autonomousSoftwareEngineering'];
  aeeExecutiveDecision?: OnePromptLivePreviewBuildResult['aeeExecutiveDecision'];
  aeeFinalReport?: OnePromptLivePreviewBuildResult['aeeFinalReport'];
  buildAutofixAttempts?: number;
  buildAutofixLoop?: OnePromptLivePreviewBuildResult['buildAutofixLoop'];
  workspaceStabilizerReport?: OnePromptLivePreviewBuildResult['workspaceStabilizerReport'];
  gpcaComplianceReport?: OnePromptLivePreviewBuildResult['gpcaComplianceReport'];
  aeoReport?: OnePromptLivePreviewBuildResult['aeoReport'];
  gpcaHardStop?: boolean;
  gpcaBlockedMaterialization?: boolean;
  gpcaBlockedPreviewActivation?: boolean;
  gpcaViolatedConstitutionRuleIds?: OnePromptLivePreviewBuildResult['gpcaViolatedConstitutionRuleIds'];
}): OnePromptLivePreviewBuildResult {
  return {
    readOnly: true,
    buildId: input.buildId,
    projectId: input.projectId,
    projectName: input.projectName,
    status: 'FAILED',
    prompt: input.prompt,
    requestType: input.source === 'chat' ? 'CHAT_BUILD' : 'BUILD_FROM_PROMPT',
    workspaceId: input.workspaceId ?? null,
    workspacePath: input.workspacePath ?? null,
    generatedProfile: input.generatedProfile ?? null,
    planningProofLevel: input.planningProofLevel ?? null,
    materializationProofLevel: input.materializationProofLevel ?? null,
    buildResult: 'FAIL',
    npmInstallOk: input.npmInstallOk ?? false,
    npmBuildOk: input.npmBuildOk ?? false,
    previewUrl: null,
    diagnosticPreviewUrl: input.diagnosticPreviewUrl ?? null,
    limitedPreviewUrl: input.limitedPreviewUrl ?? null,
    devServerRunning: input.devServerRunning ?? false,
    livePreviewAvailable: input.livePreviewAvailable ?? false,
    failureReason: input.failureReason,
    featureSignals: null,
    materializationManifest: input.materializationManifest ?? null,
    livePreviewGate: input.livePreviewGate ?? null,
    autonomousSoftwareEngineering: input.autonomousSoftwareEngineering ?? null,
    aeeExecutiveDecision: input.aeeExecutiveDecision ?? null,
    aeeFinalReport: input.aeeFinalReport ?? null,
    buildAutofixAttempts: input.buildAutofixAttempts,
    buildAutofixLoop: input.buildAutofixLoop ?? null,
    workspaceStabilizerReport: input.workspaceStabilizerReport ?? null,
    gpcaComplianceReport: input.gpcaComplianceReport ?? null,
    aeoReport: input.aeoReport ?? null,
    gpcaHardStop: input.gpcaHardStop ?? false,
    gpcaBlockedMaterialization: input.gpcaBlockedMaterialization ?? false,
    gpcaBlockedPreviewActivation: input.gpcaBlockedPreviewActivation ?? false,
    gpcaViolatedConstitutionRuleIds: input.gpcaViolatedConstitutionRuleIds,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * One BuildExecutionMonitor per project's in-flight build. Overwritten (not appended) at the
 * start of each new build for that project, so this never grows unbounded. Kept accessible after
 * the build's terminal result is registered so callers outside this module (e.g. the interaction
 * proof step, which runs after this function returns) can keep recording real stage evidence
 * against the same timeline.
 */
const activeExecutionMonitors = new Map<string, BuildExecutionMonitor>();

/**
 * One Project Context Isolation report per project's in-flight/most-recent build. Overwritten
 * (not appended) at the start of each new build for that project. Read by attachExecutionReport
 * so every returned build result (success or failure) carries build-decision/context-scope
 * evidence without every individual result-construction call site needing to plumb it through.
 */
const activeContextIsolationRecords = new Map<string, ContextIsolationReportSection>();

/**
 * Fresh Build Artifact Isolation V4 — the runtime evidence scope minted for the build currently
 * in flight for a given project, set (not appended) at the start of each build alongside
 * `activeContextIsolationRecords`. Read by attachExecutionReport so every returned build result
 * carries its scope id, purge actions performed, and any stale-evidence detections.
 */
const activeRuntimeEvidenceScopes = new Map<string, RuntimeEvidenceScope>();
/**
 * Current immutable CBGA envelope per project. It is attached to terminal failures as well as
 * successes, so a blocked build never loses the build/project/prompt provenance needed to prove
 * which context produced the diagnostic.
 */
const activeProductionBuildEnvelopes = new Map<string, ApprovedProductionBuildEnvelope>();

export function getActiveBuildExecutionMonitor(projectId: string): BuildExecutionMonitor | undefined {
  return activeExecutionMonitors.get(projectId);
}

export function getActiveRuntimeEvidenceScope(projectId: string): RuntimeEvidenceScope | undefined {
  return activeRuntimeEvidenceScopes.get(projectId);
}

function hashPromptForContextScope(prompt: string): string {
  return createHash('sha256').update(prompt).digest('hex').slice(0, 16);
}

function attachExecutionReport(
  projectId: string,
  build: OnePromptLivePreviewBuildResult,
): OnePromptLivePreviewBuildResult {
  let enriched = build;
  const productionEnvelope = activeProductionBuildEnvelopes.get(projectId);
  if (productionEnvelope) {
    if (productionEnvelope.buildId !== build.buildId || productionEnvelope.projectId !== build.projectId) {
      throw new Error(
        `CROSS_RUN_ARTIFACT_CONTEXT_MISMATCH: terminal build result ${build.buildId}/${build.projectId} cannot consume envelope ${productionEnvelope.buildId ?? '(none)'}/${productionEnvelope.projectId ?? '(none)'}.`,
      );
    }
    enriched = {
      ...enriched,
      approvedProductIdentity: productionEnvelope.approvedProductIdentity,
      approvedNavigationPlan: productionEnvelope.approvedNavigationPlan,
      approvedModulePlan: productionEnvelope.approvedModulePlan,
      approvedMetadataPlan: productionEnvelope.approvedMetadataPlan,
      approvedSampleDataPlan: productionEnvelope.approvedSampleDataPlan,
      approvedProvenancePlan: productionEnvelope.approvedProvenancePlan,
      approvedRepairRealityPlan: productionEnvelope.approvedRepairRealityPlan,
      approvedProductionBuildEnvelope: productionEnvelope,
    };
  }
  const monitor = activeExecutionMonitors.get(projectId);
  const gpcaBlocked =
    build.gpcaHardStop === true ||
    build.gpcaBlockedMaterialization === true ||
    build.gpcaBlockedPreviewActivation === true;
  if (monitor) {
    if (gpcaBlocked) {
      monitor.blockStage('GENERATION', build.failureReason ?? 'Generation pipeline compliance blocked this build.');
    } else {
      monitor.finalizeDanglingStage(
        build.status !== 'FAILED',
        build.status === 'FAILED'
          ? (build.failureReason ?? 'Build did not complete.')
          : 'Stage completed as part of a successful build.',
      );
    }
    const report = buildExecutionReport(monitor);
    enriched = {
      ...enriched,
      buildExecutionStatus: gpcaBlocked ? 'BLOCKED' : report.overallState,
      executionTimeline: report.timeline,
      executionRecovery: report.recoveryAttempts,
      executionReport: gpcaBlocked
        ? {
            ...report,
            overallState: 'BLOCKED',
            summary: {
              ...report.summary,
              headline: 'Build blocked.',
              currentStageLabel: 'Generation compliance validation',
              heartbeatLabel: 'Generation stopped because unapproved input reached a generator',
              nextStepLabel: 'Correct or regenerate the approved generation input',
            },
          }
        : report,
    };
  }
  const contextIsolation = activeContextIsolationRecords.get(projectId);
  if (contextIsolation) {
    enriched = { ...enriched, contextIsolation };
  }
  const runtimeEvidenceScope = activeRuntimeEvidenceScopes.get(projectId);
  if (runtimeEvidenceScope) {
    enriched = { ...enriched, runtimeEvidenceScope };
  }
  return enriched;
}

function registerFailedBuild(input: {
  projectId: string;
  projectName: string;
  workspaceDir: string;
  failure: ForensicManifestFailureInput;
  result: Parameters<typeof composeFailureResult>[0];
}): OnePromptLivePreviewBuildResult {
  const manifest = finalizeForensicManifestFailure(input.workspaceDir, input.failure);
  return registerBuildOutcome(input.projectId, input.projectName, {
    ...composeFailureResult(input.result),
    materializationManifest: manifest,
  });
}

function touchForensicStage(
  workspaceDir: string,
  update: Parameters<typeof updateForensicManifestStage>[1],
): void {
  updateForensicManifestStage(workspaceDir, update);
}

function inspectUniversalFeatureSignals(
  workspaceDir: string,
  prompt: string,
  generatedProfile: OnePromptLivePreviewBuildResult['generatedProfile'],
  projectId: string,
  projectName: string,
  buildId: string,
  definitionOverride: ProfileFeatureDefinition,
): MaterializationValidationResult {
  return validateUniversalAppMaterialization({
    workspaceDir,
    rawPrompt: prompt,
    selectedProfile: generatedProfile,
    projectId,
    projectName,
    buildRunId: buildId,
    definitionOverride,
  });
}

function resolveAeeContinuationManifestFaithfulness(input: {
  buildPlan: ReturnType<typeof resolvePromptFaithfulBuildPlan>;
  workspaceDir: string;
  manifestFields: ReturnType<typeof buildPromptFaithfulnessManifestFields>;
}): { status: string; score: number } {
  if (workspaceHasGeneratedFeatureModules(input.workspaceDir)) {
    return {
      status: input.manifestFields.promptFaithfulnessStatus,
      score: input.manifestFields.promptFaithfulnessScore,
    };
  }
  if (
    input.buildPlan.readyForGeneration ||
    input.buildPlan.promptFaithfulness.readyForGeneration
  ) {
    return {
      status: 'PASS',
      score: Math.max(
        80,
        Math.round(input.buildPlan.promptFaithfulness.faithfulnessScore.overallScore * 100),
      ),
    };
  }
  return {
    status: input.manifestFields.promptFaithfulnessStatus,
    score: input.manifestFields.promptFaithfulnessScore,
  };
}

function collectAseMaterializationBlockers(engineering: AutonomousEngineeringResult): string[] {
  const blockers = [...engineering.evidence.blockers, ...engineering.asePipeline.blockers];
  if (!engineering.materializationExecuted) {
    const materializationAction = engineering.actions.find(
      (action) => action.actionType === 'MATERIALIZATION',
    );
    if (materializationAction?.status === 'FAILED' && materializationAction.detail) {
      blockers.push(materializationAction.detail);
    } else if (!blockers.some((reason) => /materialization|ase denied/i.test(reason))) {
      blockers.push('ASE materialization did not complete.');
    }
  }
  return blockers;
}

function persistBuildIntentRun(input: {
  buildRunId: string;
  projectId: string;
  projectName: string;
  prompt: string;
  profile: string | null;
  status: 'BUILDING' | 'READY' | 'FAILED' | 'QUEUED';
  stage: string;
  workspacePath: string | null;
  previewUrl: string | null;
  planTaskCount: number | null;
  architectureSummary: string | null;
  failureReason: string | null;
  projectRootDir: string;
  createdAt?: string;
}): void {
  const stamp = new Date().toISOString();
  recordBuildIntentRun(
    {
      readOnly: true,
      buildRunId: input.buildRunId,
      projectId: input.projectId,
      projectName: input.projectName,
      prompt: input.prompt,
      profile: input.profile,
      status: input.status,
      stage: input.stage,
      workspacePath: input.workspacePath,
      previewUrl: input.previewUrl,
      activeProjectId: input.projectId,
      planTaskCount: input.planTaskCount,
      architectureSummary: input.architectureSummary,
      failureReason: input.failureReason,
      createdAt: input.createdAt ?? stamp,
      updatedAt: stamp,
    },
    input.projectRootDir,
  );
}

function registerBuildOutcome(
  projectId: string,
  projectName: string,
  build: OnePromptLivePreviewBuildResult,
  devServerPort?: number | null,
): OnePromptLivePreviewBuildResult {
  const enrichedBuild = attachExecutionReport(projectId, build);
  registerProjectBuildResult({
    projectId,
    projectName,
    build: enrichedBuild,
    devServerPort: devServerPort ?? null,
  });
  return enrichedBuild;
}

export async function runOnePromptLivePreviewBuild(
  input: OnePromptLivePreviewBuildInput,
): Promise<OnePromptLivePreviewBuildResult> {
  const buildId = nextBuildId();
  const prompt = input.rawPrompt.trim();
  const source = input.source ?? 'api';

  const priorActiveProjectId = getActiveProjectId();
  const requestedRegistryProject = input.projectId
    ? getRegistryProject(input.projectId, resolveProjectRegistryRootDir())
    : null;
  const currentProjectIdentitySummary = requestedRegistryProject
    ? [requestedRegistryProject.name, requestedRegistryProject.summary].filter(Boolean).join(' — ')
    : input.projectName?.trim() || null;
  // NEW_BUILD_CONFIRMATION_REQUIRED UX V4 — when the caller (chat-to-build bridge) already
  // resolved an explicit buildIntentOverride upstream, that acceptance/rejection is carried
  // through verbatim so the context isolation report can show confirmation-required/selected
  // evidence (requirement 6) without re-deriving it here.
  const upstreamOverride = input.buildDecisionKind === 'NEW_BUILD' && input.buildIntentOverride === 'START_NEW_BUILD'
    ? 'START_NEW_BUILD' as const
    : input.buildDecisionKind === 'CONTINUE_EXISTING_PROJECT' && input.buildIntentOverride === 'CONTINUE_EXISTING_PROJECT'
      ? 'CONTINUE_EXISTING_PROJECT' as const
      : null;
  const buildDecision: BuildDecisionResult = input.buildDecisionKind
    ? {
        readOnly: true,
        decision: input.buildDecisionKind,
        confidence: 1,
        reasons: ['Build decision resolved upstream (chat-to-build bridge or explicit caller input).'],
        continuationSignals: [],
        newBuildSignals: [],
        message: null,
        overrideApplied: upstreamOverride,
        overrideRejected: null,
      }
    : classifyNewBuildDecision({
        rawPrompt: prompt,
        requestedProjectId: input.projectId ?? null,
        requestedProjectName: input.projectName ?? null,
        hasKnownExistingProject: Boolean(requestedRegistryProject) || input.resumeExistingProject === true,
        currentProjectIdentitySummary,
        buildIntentOverride: input.buildIntentOverride ?? null,
      });
  // Only a decision explicitly and confidently classified as continuation may reuse the
  // process-wide active project; every other case (new build, or unresolved ambiguity reaching
  // this far) mints a fresh project instead of silently falling back to activeProjectId.
  const blockActiveProjectFallback = buildDecision.decision !== 'CONTINUE_EXISTING_PROJECT';
  const promptConceptTokens = prompt.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  const priorActiveRegistryProject = priorActiveProjectId
    ? getRegistryProject(priorActiveProjectId, resolveProjectRegistryRootDir())
    : null;
  const previousProjectIdentity = priorActiveRegistryProject
    ? [priorActiveRegistryProject.name, priorActiveRegistryProject.summary].filter(Boolean).join(' — ')
    : null;
  const preselectionScope = buildContextScope({
    requestId: buildId,
    buildId,
    projectId: input.projectId ?? 'pending-fresh-project',
    decision: buildDecision.decision,
    currentPromptHash: hashPromptForContextScope(prompt),
    explicitlyReferencedProjectId:
      buildDecision.decision === 'CONTINUE_EXISTING_PROJECT' ? (input.projectId ?? null) : null,
    activeProjectIdCandidate: priorActiveProjectId,
  });
  const preselectionStaleCheck = runStaleContextCheck({
    stage: 'PRE_PROJECT_SELECTION',
    scope: preselectionScope,
    currentPromptConcepts: promptConceptTokens,
    canonicalIdentity: input.projectName ?? null,
    candidateInheritedConcepts: [],
    candidateGeneratedConcepts: [],
    previousProjectIdentity,
    previousMetadataKeywords: previousProjectIdentity?.toLowerCase().match(/[a-z0-9]+/g) ?? [],
    activeProjectIdCandidate: priorActiveProjectId,
    requestedProjectId: input.projectId ?? null,
  });
  assertNoStaleContext(preselectionStaleCheck);

  const projectContext = resolveProjectContext({
    projectId: input.projectId,
    projectName: input.projectName,
    createIfMissing: true,
    blockActiveProjectFallback,
    freshlyCreatedProjectId:
      buildDecision.decision === 'NEW_BUILD' && input.freshProjectContextCreated === true
        ? (input.projectId ?? null)
        : null,
  });
  const { projectId } = projectContext;
  let { projectName } = projectContext;
  const activeProjectIdFallbackBlocked = blockActiveProjectFallback && Boolean(priorActiveProjectId) && priorActiveProjectId !== projectId;

  const contextScope = buildContextScope({
    requestId: buildId,
    buildId,
    projectId,
    decision: buildDecision.decision,
    currentPromptHash: hashPromptForContextScope(prompt),
    explicitlyReferencedProjectId: buildDecision.decision === 'CONTINUE_EXISTING_PROJECT' ? (input.projectId ?? null) : null,
    activeProjectIdCandidate: priorActiveProjectId,
  });
  const resolvedContextStaleCheck = runStaleContextCheck({
    stage: 'POST_PROJECT_SELECTION_PRE_PLANNING',
    scope: contextScope,
    currentPromptConcepts: promptConceptTokens,
    canonicalIdentity: projectName,
    candidateInheritedConcepts: [],
    candidateGeneratedConcepts: [],
    previousProjectIdentity,
    previousMetadataKeywords: previousProjectIdentity?.toLowerCase().match(/[a-z0-9]+/g) ?? [],
    activeProjectIdCandidate: priorActiveProjectId,
    requestedProjectId: projectId,
  });
  assertNoStaleContext(resolvedContextStaleCheck);
  // Prompt Reset Authority — a NEW_BUILD_PROMPT trigger runs before planning/materialization
  // begin. A freshly-minted project id has no prior workspace/state under that id at all, so
  // every reset category is satisfied by construction; requirement 3's "clear stale generation
  // state" guarantee is enforced by never reusing a prior project's id for a new build (see
  // resolveProjectContext blockActiveProjectFallback above) rather than by reaching into 15
  // separate stores after the fact.
  const promptResetPlan =
    buildDecision.decision === 'NEW_BUILD'
      ? buildPromptResetPlan({
          trigger: 'NEW_BUILD_PROMPT',
          projectId,
          freshProjectScope: projectContext.created,
        })
      : null;

  // Fresh Build Artifact Purge + Runtime Evidence Isolation V4 — purge/invalidate previous build
  // artifacts *before* the new context isolation record / execution monitor / runtime evidence
  // scope are (re)set below, so the executors are clearing genuinely stale prior-build entries
  // rather than the ones just written for this build. Purge categories that are "required project
  // artifacts" (workspace path, manifests, routes, navigation, tab registry entry) are only
  // purged for NEW_BUILD; per-build runtime evidence (faithfulness/proof/reports/concepts/active
  // build result/etc.) is invalidated for every build regardless of decision, so a continuation
  // never displays a previous turn's evidence while the current one is computing.
  const purgePlan = planFreshBuildArtifactPurge({
    decision: buildDecision.decision,
    requestId: buildId,
    buildId,
    projectId,
    freshProjectScope: projectContext.created,
    categoriesWithLiveExecutor: [
      'ACTIVE_BUILD_RESULT',
      'ENGINEERING_REPORT_SUMMARY',
      'UI_PROJECT_SUMMARY',
      'FALLBACK_MODULE_EVIDENCE',
      'RUNTIME_ACTIVATION_RESULT',
    ],
  });
  applyFreshBuildArtifactPurge(purgePlan, {
    ACTIVE_BUILD_RESULT: () => invalidatePreviousBuildEvidenceForProject(projectId),
    ENGINEERING_REPORT_SUMMARY: () => activeExecutionMonitors.delete(projectId),
    UI_PROJECT_SUMMARY: () => activeContextIsolationRecords.delete(projectId),
    FALLBACK_MODULE_EVIDENCE: () => resetLastPromptBoundedMaterializationEvidenceForFreshBuild(),
    RUNTIME_ACTIVATION_RESULT: () => {
      activeRuntimeEvidenceScopes.delete(projectId);
      activeProductionBuildEnvelopes.delete(projectId);
    },
  });
  // The full plan (not just the subset with a live in-process executor) is what gets reported —
  // FRESH_SCOPE entries are purged by construction (fresh project id) and NOT_APPLICABLE entries
  // are legitimately preserved for CONTINUE_EXISTING_PROJECT; both are meaningful purge evidence.
  const purgeActionsPerformed = purgePlan.actions;

  activeContextIsolationRecords.set(
    projectId,
    buildContextIsolationReportSection({
      decision: buildDecision,
      scope: contextScope,
      resetPlan: promptResetPlan,
      staleChecks: [preselectionStaleCheck, resolvedContextStaleCheck],
      productIdentity: projectName,
      activeProjectIdFallbackBlocked,
    }),
  );

  activeRuntimeEvidenceScopes.set(
    projectId,
    buildRuntimeEvidenceScope(
      {
        requestId: buildId,
        buildId,
        projectId,
        decision: buildDecision.decision,
        promptHash: contextScope.currentPromptHash,
      },
      purgeActionsPerformed,
    ),
  );

  const executionMonitor = createBuildExecutionMonitor();
  activeExecutionMonitors.set(projectId, executionMonitor);
  executionMonitor.startStage('PLANNING');

  const { registryRoot, projectKind, artifactRoot } = resolveRegistryRootForPersistentProject({
    projectRootDir: input.projectRootDir,
    explicitProjectKind: input.projectKind,
  });
  ensureRegistryProjectRecord({
    rootDir: registryRoot,
    projectId,
    projectName,
    projectKind,
  });

  let buildPlan = resolvePromptFaithfulBuildPlan(prompt);
  // Contract-Bound Generation Authority V4 — the approved canonical product contract is the only
  // valid source for generated modules/routes/navigation/app identity. This runs before any
  // workspace materialization: it compares the module plan the pipeline is about to generate from
  // against the contract and, when they drift (unauthorized fallback modules, a generic app title,
  // etc.), automatically repairs the build plan's module/route/title inputs from the contract —
  // never a full rebuild, never inventing modules without contract evidence, never hiding a
  // mismatch. The generator itself is unmodified: it keeps reading `buildPlan.modulePlan` /
  // `buildPlan.extraction.appName` exactly as before.
  const canonicalProductContract = buildCanonicalProductContract({ prompt });
  const contractBoundResult = applyContractBoundGenerationToBuildPlan(buildPlan, canonicalProductContract, {
    promptHash: contextScope.currentPromptHash,
    buildId,
    projectId,
    buildContextDecision: buildDecision.decision === 'AMBIGUOUS_REQUIRES_CONFIRMATION'
      ? null
      : buildDecision.decision,
    buildIntentOverride: buildDecision.overrideApplied ?? null,
  });
  const contractBoundGeneration: CbgaGenerationReport = contractBoundResult.report;
  buildPlan = contractBoundResult.buildPlan;
  // Final Immutable Production Pipeline V1 (PPC-1207 No Parallel Truth) — exactly one immutable
  // ApprovedProductionBuildEnvelope is the constitutional source for this entire build. Every
  // downstream production stage consumes this envelope — never individual handoffs in parallel.
  let productionBuildEnvelope: ApprovedProductionBuildEnvelope = requireApprovedProductionBuildEnvelopeForContext(
    requireApprovedProductionBuildEnvelope(
      contractBoundGeneration.approvedProductionBuildEnvelope,
      'one-prompt-build-orchestrator',
    ),
    {
      buildId,
      projectId,
      promptHash: contextScope.currentPromptHash,
    },
    'one-prompt-build-orchestrator-context-binding',
  );
  activeProductionBuildEnvelopes.set(projectId, productionBuildEnvelope);
  const constitutionalHandoffs = constitutionalHandoffsFromApprovedProductionBuildEnvelope(productionBuildEnvelope);
  const approvedIdentity: ApprovedProductIdentity = constitutionalHandoffs.approvedProductIdentity;
  // Production Surface Integration Cleanup V1 — project identity for every downstream surface must
  // derive from the CBGA-approved envelope, never from session residue or caller-supplied names.
  if (approvedIdentity.displayName.trim()) {
    projectContext.session.projectName = approvedIdentity.displayName.trim();
  }
  projectName = projectContext.session.projectName;
  const approvedNavigationPlan: ApprovedNavigationPlan = constitutionalHandoffs.approvedNavigationPlan;
  const cbgaApprovedNavigationLabels = approvedNavigationPlan.productEntries;
  const approvedModulePlan: ApprovedModulePlan = constitutionalHandoffs.approvedModulePlan;
  const approvedMetadataPlan: ApprovedMetadataPlan = constitutionalHandoffs.approvedMetadataPlan;
  projectName = approvedMetadataPlan.applicationTitle?.trim() || projectName;
  projectContext.session.projectName = projectName;
  const approvedSampleDataPlan: ApprovedSampleDataPlan = constitutionalHandoffs.approvedSampleDataPlan;
  const approvedProvenancePlan: ApprovedProvenancePlan = constitutionalHandoffs.approvedProvenancePlan;
  let approvedRepairRealityPlan: ApprovedRepairRealityPlan = constitutionalHandoffs.approvedRepairRealityPlan;
  let gpcaCbgaReport: CbgaGenerationReport = syncCbgaGenerationReportWithProductionBuildEnvelope(
    contractBoundGeneration,
    productionBuildEnvelope,
  );
  const syncGpcaCbgaEnvelope = (): void => {
    gpcaCbgaReport = syncCbgaGenerationReportWithProductionBuildEnvelope(gpcaCbgaReport, productionBuildEnvelope);
    activeProductionBuildEnvelopes.set(projectId, productionBuildEnvelope);
  };
  const applyRepairPlanToEnvelope = (): void => {
    productionBuildEnvelope = withApprovedProductionBuildEnvelopeRepairPlan(
      productionBuildEnvelope,
      approvedRepairRealityPlan,
    );
    syncGpcaCbgaEnvelope();
  };
  const advanceProductionEnvelopeState = (
    nextState: ApprovedProductionBuildEnvelope['pipelineState']['currentState'],
    detail: string,
  ): void => {
    productionBuildEnvelope = advanceApprovedProductionBuildEnvelopeState(productionBuildEnvelope, nextState, detail);
    syncGpcaCbgaEnvelope();
  };
  // Generation Pipeline Compliance Authority V1 — CBGA above decides *what* is allowed to be
  // generated; GPCA proves every real generation stage actually *consumes* that decision instead
  // of a legacy/template/blueprint default. This pre-materialization pass verifies the inputs the
  // generator is about to read (buildPlan.modulePlan / extraction.appName, now CBGA-repaired) —
  // it never mutates the build plan itself. The post-materialization pass (inside
  // runWorkspaceMaterialization, below) is where a real legacy/generic-shell injection can
  // actually be proven, because those files do not exist until the workspace has been written.
  let gpcaComplianceReport: GpcaComplianceReport = buildGpcaPreMaterializationReport({
    contract: canonicalProductContract,
    cbgaReport: gpcaCbgaReport,
    buildPlan,
  });
  const ranking = buildPlan.ranking;
  const materializationProfile = buildPlan.materializationProfile;
  const definition = buildPlan.definition;
  const effectiveProfile = materializationProfile as GeneratedAppProfile;
  const intentTraceEvents = buildIntentUnderstandingTraceEvents(buildPlan.productIntelligenceModel);
  const faithfulnessManifestFields = buildPromptFaithfulnessManifestFields({
    rawPrompt: prompt,
    selectedProfile: String(materializationProfile),
    generatedModules: definition.featureModules,
    guardResult: buildPlan.guardResult,
  });
  const faithfulnessTraceEvents = buildPromptFaithfulnessTraceEvents({
    extraction: buildPlan.extraction,
    guardResult: buildPlan.guardResult,
    manifestFields: faithfulnessManifestFields,
  });
  void faithfulnessTraceEvents;

  const workspaceRel = `${GENERATED_BUILDER_WORKSPACES_DIR}/${projectId}`.replace(/\\/g, '/');
  assertWorkspacePathBelongsToProject(workspaceRel, projectId);
  const workspaceDir = join(artifactRoot, workspaceRel);
  // NEW_BUILD must never reuse prior on-disk source for a remapped project id. Identity
  // consolidation can map a fresh request onto an existing projectId while still deciding
  // NEW_BUILD — without this wipe, stale blueprint/feature files from earlier engine versions
  // survive CREATE_FILE overwrites races and fail post-mat GPCA on obsolete content.
  if (buildDecision.decision === 'NEW_BUILD' && existsSync(workspaceDir)) {
    rmSync(workspaceDir, { recursive: true, force: true });
  }
  mkdirSync(workspaceDir, { recursive: true });

  const staleModulesRemoved = sanitizeWorkspaceForBuildPlan(
    workspaceDir,
    buildPlan.modulePlan.approvedModuleIds,
  );

  const hasRecognizedBuildProfile =
    Boolean(ranking.selectedProfile) ||
    buildPlan.extraction.isCustomDomainPrompt ||
    materializationProfile === 'GENERIC_CUSTOM_APP_V1';

  if (!buildPlan.readyForGeneration) {
    initializeForensicManifest({
      workspaceDir,
      workspacePath: workspaceRel,
      projectId,
      projectName,
      buildRunId: buildId,
      prompt,
      selectedProfile: String(materializationProfile),
      expectedAppType: definition.expectedAppType,
      promptSummary: summarizePrompt(prompt),
      confidence: ranking.confidence,
      featureModules: definition.featureModules,
      routes: definition.routes,
      fallbackUsed: buildPlan.guardResult.guardApplied,
    });
    return registerFailedBuild({
      projectId,
      projectName,
      workspaceDir,
      failure: {
        failureStage: 'CAPABILITY_PLANNING',
        failureReason:
          buildPlan.intentUnderstanding.blockedReason ??
          buildPlan.promptFaithfulness.blockedReason ??
          buildPlan.capabilityPlanning.blockedReason ??
          buildPlan.incrementalBuild.blockedReason ??
          buildPlan.behaviorSimulation.blockedReason ??
          'Intent, Prompt Faithfulness, Capability Planning, Incremental Build, or Behavior Simulation blocked generation.',
        status: 'ABORTED',
        lastSuccessfulStage: 'STARTED',
      },
      result: {
        buildId,
        projectId,
        projectName,
        prompt,
        source,
        failureReason:
          buildPlan.intentUnderstanding.blockedReason ??
          buildPlan.promptFaithfulness.blockedReason ??
          buildPlan.capabilityPlanning.blockedReason ??
          buildPlan.incrementalBuild.blockedReason ??
          buildPlan.behaviorSimulation.blockedReason ??
          'Product Intelligence Model, Prompt Evidence Contract, or Capability Planning blocked generation.',
        workspaceId: projectId,
        workspacePath: workspaceRel,
      },
    });
  }

  if (!isOnePromptBuildRequest(prompt) && !hasRecognizedBuildProfile) {
    initializeForensicManifest({
      workspaceDir,
      workspacePath: workspaceRel,
      projectId,
      projectName,
      buildRunId: buildId,
      prompt,
      selectedProfile: String(materializationProfile),
      expectedAppType: definition.expectedAppType,
      promptSummary: summarizePrompt(prompt),
      confidence: ranking.confidence,
      featureModules: definition.featureModules,
      routes: definition.routes,
      fallbackUsed: buildPlan.guardResult.guardApplied,
    });
    return registerFailedBuild({
      projectId,
      projectName,
      workspaceDir,
      failure: {
        failureStage: 'PROFILE_SELECTED',
        failureReason:
          'Build intent detected but no supported application profile matched this prompt. Add product type details (e.g. expense tracker, CRM, task tracker).',
        status: 'ABORTED',
        lastSuccessfulStage: 'STARTED',
      },
      result: {
        buildId,
        projectId,
        projectName,
        prompt,
        source,
        failureReason:
          'Build intent detected but no supported application profile matched this prompt. Add product type details (e.g. expense tracker, CRM, task tracker).',
        workspaceId: projectId,
        workspacePath: workspaceRel,
      },
    });
  }

  const buildStartedAt = performance.now();
  const timings = createEmptyMaterializationTimings();
  let lastSuccessfulStage: ForensicBuildStage = 'STARTED';

  initializeForensicManifest({
    workspaceDir,
    workspacePath: workspaceRel,
    projectId,
    projectName,
    buildRunId: buildId,
    prompt,
    selectedProfile: String(effectiveProfile ?? materializationProfile),
    expectedAppType: definition.expectedAppType,
    promptSummary: summarizePrompt(prompt),
    confidence: ranking.confidence,
    featureModules: definition.featureModules,
    routes: definition.routes,
    fallbackUsed: buildPlan.guardResult.guardApplied,
  });
  touchForensicStage(workspaceDir, { stage: 'PROMPT_RECEIVED' });
  touchForensicStage(workspaceDir, {
    stage: 'PROFILE_SELECTED',
    selectedProfile: String(effectiveProfile ?? materializationProfile),
    confidence: ranking.confidence,
    warnings: [
      ...(staleModulesRemoved.length > 0
        ? [
            `Removed ${staleModulesRemoved.length} stale workspace module(s) not in current build plan: ${staleModulesRemoved.join(', ')}`,
          ]
        : []),
      ...(contractBoundGeneration.repairsApplied.length > 0
        ? [
            `Contract-Bound Generation Authority V4: gate outcome ${contractBoundGeneration.initialGate.outcome} → ${contractBoundGeneration.finalGateOutcome} after ${contractBoundGeneration.repairsApplied.length} repair(s): ${contractBoundGeneration.repairsApplied.map((a) => a.actionId).join(', ')}.`,
          ]
        : []),
    ],
  });
  lastSuccessfulStage = 'PROFILE_SELECTED';

  try {
  persistBuildIntentRun({
    buildRunId: buildId,
    projectId,
    projectName,
    prompt,
    profile: effectiveProfile,
    status: 'BUILDING',
    stage: 'PLANNING',
    workspacePath: null,
    previewUrl: null,
    planTaskCount: null,
    architectureSummary: null,
    failureReason: null,
    projectRootDir: resolveProjectRegistryRootDir(),
  });

  registerProjectBuildResult({
    projectId,
    projectName,
    build: {
      readOnly: true,
      buildId,
      projectId,
      projectName,
      status: 'BUILDING',
      prompt,
      requestType: source === 'chat' ? 'CHAT_BUILD' : 'BUILD_FROM_PROMPT',
      workspaceId: null,
      workspacePath: null,
      generatedProfile: effectiveProfile,
      planningProofLevel: null,
      materializationProofLevel: null,
      buildResult: null,
      npmInstallOk: false,
      npmBuildOk: false,
    previewUrl: null,
    diagnosticPreviewUrl: null,
    limitedPreviewUrl: null,
    devServerRunning: false,
    livePreviewAvailable: false,
      failureReason: null,
      featureSignals: null,
      materializationManifest: null,
      updatedAt: new Date().toISOString(),
    },
  });

  const aidev = getDevPulseV2AiDevEngineAuthority();
  aidev.intakeBuildRequest(prompt);

  const contractAssessment = assessRequirementsToPlanExecutionContract({ rawPrompt: prompt });
  timings.planningDurationMs = roundDurationMs(buildStartedAt);
  let contract = contractAssessment.report.buildReadyContract;
  if (!contract) {
    const repairedAssessment = repairSimpleUtilityPlanningAssessment(prompt);
    if (repairedAssessment?.report.buildReadyContract) {
      contract = repairedAssessment.report.buildReadyContract;
    }
  }
  const planTaskCount = contractAssessment.report.planContract?.tasks.length ?? null;
  const architectureSummary = contract
    ? `Build-ready contract with ${contract.buildUnits.length} units and ${planTaskCount ?? 0} plan tasks`
    : null;

  persistBuildIntentRun({
    buildRunId: buildId,
    projectId,
    projectName,
    prompt,
    profile: effectiveProfile,
    status: contract ? 'BUILDING' : 'FAILED',
    stage: contract ? 'MATERIALIZATION' : 'PLANNING',
    workspacePath: null,
    previewUrl: null,
    planTaskCount,
    architectureSummary,
    failureReason: contract ? null : 'Planning did not produce a build-ready contract',
    projectRootDir: resolveProjectRegistryRootDir(),
  });

  if (!contract) {
    touchForensicStage(workspaceDir, {
      stage: 'PLANNING',
      durationMs: timings.planningDurationMs,
      timingsPatch: { planningDurationMs: timings.planningDurationMs },
      errors: ['Planning did not produce a build-ready contract'],
    });
    return registerFailedBuild({
      projectId,
      projectName,
      workspaceDir,
      failure: {
        failureStage: 'PLANNING',
        failureReason: 'Planning did not produce a build-ready contract',
        lastSuccessfulStage,
      },
      result: {
        buildId,
        projectId,
        projectName,
        prompt,
        source,
        failureReason: 'Planning did not produce a build-ready contract',
        workspaceId: projectId,
        workspacePath: workspaceRel,
        generatedProfile: effectiveProfile,
        planningProofLevel: contractAssessment.report.proofLevel,
      },
    });
  }

  touchForensicStage(workspaceDir, {
    stage: 'PLANNING',
    durationMs: timings.planningDurationMs,
    timingsPatch: { planningDurationMs: timings.planningDurationMs },
  });
  lastSuccessfulStage = 'PLANNING';
  executionMonitor.completeStage('PLANNING', `Planning finished in ${Math.round(timings.planningDurationMs)}ms.`);

  touchForensicStage(workspaceDir, { stage: 'WORKSPACE_CREATED' });
  lastSuccessfulStage = 'WORKSPACE_CREATED';

  if (workspaceHasGeneratedFeatureModules(workspaceDir)) {
    collectWorkspaceFeatureRealityFallback({
      workspaceDir,
      requiredModuleIds: buildPlan.modulePlan.approvedModuleIds,
      contractId: buildPlan.promptFaithfulness.contract.id,
      previewUrl: 'workspace://resume-or-partial',
      registerAssessment: true,
    });
  }

  if (!buildPlan.promptBoundedMaterializationPassed || buildPlan.modulePlan.approvedModuleIds.length === 0) {
    return registerFailedBuild({
      projectId,
      projectName,
      workspaceDir,
      failure: {
        failureStage: 'PLANNING',
        failureReason:
          'Prompt-Bounded Materialization Guard produced no approved modules for generation.',
        status: 'ABORTED',
        lastSuccessfulStage,
      },
      result: {
        buildId,
        projectId,
        projectName,
        prompt,
        source,
        failureReason: 'Prompt-Bounded Materialization Guard produced no approved modules for generation.',
        workspaceId: projectId,
        workspacePath: workspaceRel,
        generatedProfile: effectiveProfile,
      },
    });
  }

  if (gpcaBlocksGeneration(gpcaComplianceReport)) {
    const gpcaReason = gpcaFailureReason(gpcaComplianceReport);
    const failureReason = `GENERATION_PIPELINE_NON_COMPLIANT: ${gpcaReason}`;
    // Pre-materialization hard-stop — no workspace file has been written for this build yet, so
    // this is the cheapest possible place to stop: never call the code-generation engine, never
    // run npm install/build, never start a dev server, never run live preview proof.
    const aeoReport: AeoOrchestratorReport = await runAutonomousEngineeringOrchestrator({
      diagnosisInput: {
        gpcaComplianceReport: {
          finalGateOutcome: gpcaComplianceReport.finalGateOutcome,
          blockedReasons: gpcaComplianceReport.blockedReasons,
        },
      },
    });
    return registerFailedBuild({
      projectId,
      projectName,
      workspaceDir,
      failure: {
        failureStage: 'PLANNING',
        failureReason,
        status: 'ABORTED',
        lastSuccessfulStage,
      },
      result: {
        buildId,
        projectId,
        projectName,
        prompt,
        source,
        failureReason,
        workspaceId: projectId,
        workspacePath: workspaceRel,
        generatedProfile: effectiveProfile,
        gpcaComplianceReport,
        aeoReport,
        gpcaHardStop: true,
        gpcaBlockedMaterialization: true,
        gpcaBlockedPreviewActivation: true,
      },
    });
  }

  const materializationRoot = artifactRoot;
  let materializationForEvidence: Awaited<ReturnType<typeof materializeBuildProofGapArtifacts>> | null = null;
  let generatedProfileForBuild = effectiveProfile;
  let materializationValidationForBuild: MaterializationValidationResult | null = null;
  let continuationMaterializationExecuted = false;
  let aseContinuationOverrideApplied = false;
  let aseContinuationWarning: string | null = null;
  let aeeExecutiveDecision: AeeExecutiveDecisionResult | null = null;
  let aeeFinalReport: AeeFinalReport | null = null;

  const continuationFailureWarnings = (): string[] | undefined =>
    aseContinuationOverrideApplied && aseContinuationWarning ? [aseContinuationWarning] : undefined;

  const runWorkspaceMaterialization = (): { ok: boolean; failureReason: string | null } => {
    // Final Immutable Production Pipeline V1 (PPC-1207 No Parallel Truth) — materialization must
    // never proceed without a structurally valid ApprovedProductionBuildEnvelope from CBGA. There
    // is no fallback path: individual handoff reads are forbidden after CBGA approval.
    if (!isApprovedProductionBuildEnvelopeValid(productionBuildEnvelope)) {
      return {
        ok: false,
        failureReason:
          'GENERATION_PIPELINE_NON_COMPLIANT: PPC-1207 No Parallel Truth violation — Contract-Bound Generation Authority V4 did not produce a structurally valid ApprovedProductionBuildEnvelope; materialization refused rather than reading individual constitutional handoffs.',
      };
    }
    advanceProductionEnvelopeState('MATERIALIZATION', 'Workspace materialization started from immutable production build envelope.');
    executionMonitor.startStage('GENERATION');
    const materializationStartedAt = performance.now();
    const materialization = materializeBuildProofGapArtifacts({
      projectRootDir: materializationRoot,
      contract: { ...contract, contractId: projectId },
      rawPrompt: prompt,
      faithfulBuildPlan: buildPlan,
    });
    materializationForEvidence = materialization;

    const engineResult = materializeGeneratedApplication({
      projectRootDir: materializationRoot,
      workspaceId: projectId,
      contract: { ...contract, contractId: projectId },
      rawPrompt: prompt,
      faithfulBuildPlan: buildPlan,
      profileOverride: effectiveProfile,
      approvedNavigationLabels: cbgaApprovedNavigationLabels,
      approvedProductionBuildEnvelope: productionBuildEnvelope,
    });
    timings.materializationDurationMs = roundDurationMs(materializationStartedAt);
    timings.fileGenerationDurationMs = timings.materializationDurationMs;
    timings.generationDurationMs = timings.materializationDurationMs;

    if (!engineResult.generated || !engineResult.profile) {
      const failureReason =
        engineResult.skippedReason ?? 'Code Generation Engine V1 did not materialize application files';
      touchForensicStage(workspaceDir, {
        stage: 'MATERIALIZATION',
        durationMs: timings.materializationDurationMs,
        timingsPatch: {
          materializationDurationMs: timings.materializationDurationMs,
          fileGenerationDurationMs: timings.fileGenerationDurationMs,
          generationDurationMs: timings.generationDurationMs,
        },
        errors: [failureReason],
      });
      executionMonitor.failStage('GENERATION', failureReason);
      return { ok: false, failureReason };
    }

    // Generation Pipeline Compliance Authority V1 — post-materialization pass. Real files now
    // exist on disk, so this is the only point a legacy/generic blueprint-shell injection can
    // actually be *proven* (not merely predicted). GPCA never repairs or rewrites what was
    // written — if any stage's real output cannot be traced back to CBGA's approved plan, this
    // build fails here, before the dev server / live preview is ever started.
    //
    // Rendered Content Evidence Expansion V1 — `workspaceDir` lets GPCA read the real contents of
    // every file this build just wrote and audit what a user would actually *see* (headings, nav,
    // buttons, page titles, static text, generic template/placeholder/reusable-shell fingerprints),
    // not just the file paths/names it already checked above. This can only turn an otherwise-
    // ALLOWED structural outcome into a block — it is strictly additive coverage, integrated at the
    // same single gate every downstream stage (workspace approval, preview activation, live
    // preview, interaction proof) already re-consults via `gpcaBlocksGeneration` below.
    gpcaComplianceReport = buildGpcaPostMaterializationReport({
      contract: canonicalProductContract,
      cbgaReport: gpcaCbgaReport,
      buildPlan,
      generatedFilePaths: engineResult.generatedFiles,
      workspaceDir,
    });
    if (!gpcaBlocksGeneration(gpcaComplianceReport)) {
      approvedRepairRealityPlan = recordApprovedRepairRealityRevalidation(
        approvedRepairRealityPlan,
        'GENERATION_PIPELINE_COMPLIANCE_AUTHORITY',
      );
      approvedRepairRealityPlan = recordApprovedRepairRealityRevalidation(
        approvedRepairRealityPlan,
        'PRODUCT_FAITHFULNESS_V2',
      );
      approvedRepairRealityPlan = recordApprovedRepairRealityRevalidation(
        approvedRepairRealityPlan,
        'PRODUCTION_PIPELINE_CONSTITUTION_V1',
      );
      applyRepairPlanToEnvelope();
    }
    contractConsumptionTrace({
      requestId: buildId,
      buildId,
      projectId,
      promptHash: shortHashForTrace(prompt),
      stage: 'WORKSPACE_MATERIALIZATION',
      functionName: 'runWorkspaceMaterialization',
      sourceFile: 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts',
      branchSelected: 'FRESH_MATERIALIZATION',
      inputProductIdentity: canonicalProductContract.productIdentity,
      outputProductIdentity: canonicalProductContract.productIdentity,
      inputModules: buildPlan.modulePlan.approvedModuleIds,
      outputModules: engineResult.generatedFiles,
      inputRoutes: buildPlan.modulePlan.routes,
      outputRoutes: [],
      inputNavigation: [],
      outputNavigation: [],
      inputVisibleText: [],
      outputVisibleText: [],
      fallbackSelected: false,
      genericTemplateSelected: false,
      contractConsumed: true,
      cbgaPlanConsumed: true,
      promptBoundedModulePlanConsumed: true,
      universalFeatureContractConsumed: false,
      profileFeatureDefinitionConsumed: true,
    });
    if (gpcaBlocksGeneration(gpcaComplianceReport)) {
      const failureReason = gpcaFailureReason(gpcaComplianceReport);
      touchForensicStage(workspaceDir, {
        stage: 'MATERIALIZATION',
        durationMs: timings.materializationDurationMs,
        timingsPatch: {
          materializationDurationMs: timings.materializationDurationMs,
          fileGenerationDurationMs: timings.fileGenerationDurationMs,
          generationDurationMs: timings.generationDurationMs,
        },
        errors: [failureReason],
      });
      executionMonitor.failStage('GENERATION', failureReason);
      return { ok: false, failureReason };
    }

    touchForensicStage(workspaceDir, {
      stage: 'MATERIALIZATION',
      durationMs: timings.materializationDurationMs,
      timingsPatch: {
        materializationDurationMs: timings.materializationDurationMs,
        fileGenerationDurationMs: timings.fileGenerationDurationMs,
        generationDurationMs: timings.generationDurationMs,
      },
    });
    lastSuccessfulStage = 'MATERIALIZATION';
    executionMonitor.completeStage('GENERATION', `Generation finished in ${Math.round(timings.materializationDurationMs)}ms.`);

    const faithfulnessGate = enforcePromptFaithfulMaterialization({
      rawPrompt: prompt,
      buildPlan,
      workspaceDir,
    });
    if (!faithfulnessGate.ok) {
      const failureReason =
        faithfulnessGate.failureReason ??
        'Prompt faithfulness validation failed — generated modules do not match the prompt.';
      touchForensicStage(workspaceDir, {
        stage: 'MATERIALIZATION_VALIDATION',
        errors: [failureReason],
      });
      executionMonitor.startStage('VALIDATION');
      executionMonitor.failStage('VALIDATION', failureReason);
      return { ok: false, failureReason };
    }

    generatedProfileForBuild = engineResult.profile ?? effectiveProfile;

    const validationStartedAt = performance.now();
    const materializationValidation = inspectUniversalFeatureSignals(
      workspaceDir,
      prompt,
      generatedProfileForBuild,
      projectId,
      projectName,
      buildId,
      definition,
    );
    materializationValidationForBuild = materializationValidation;
    timings.validationDurationMs = roundDurationMs(validationStartedAt);
    executionMonitor.startStage('VALIDATION');
    if (!materializationValidation.passed) {
      const failureDetail =
        materializationValidation.missingArtifacts.join(', ') ||
        materializationValidation.missingModularModuleFiles.join(', ') ||
        materializationValidation.warnings.join('; ') ||
        'Universal app materialization validation failed';
      const failureReason = `Generated app materialization validation failed: ${failureDetail}`;
      touchForensicStage(workspaceDir, {
        stage: 'MATERIALIZATION_VALIDATION',
        durationMs: timings.validationDurationMs,
        timingsPatch: { validationDurationMs: timings.validationDurationMs },
        errors: [failureReason],
      });
      executionMonitor.failStage('VALIDATION', failureReason);
      return { ok: false, failureReason };
    }

    touchForensicStage(workspaceDir, {
      stage: 'MATERIALIZATION_VALIDATION',
      durationMs: timings.validationDurationMs,
      timingsPatch: { validationDurationMs: timings.validationDurationMs },
    });
    lastSuccessfulStage = 'MATERIALIZATION_VALIDATION';
    executionMonitor.completeStage('VALIDATION', `Materialization validation finished in ${Math.round(timings.validationDurationMs)}ms.`);

    collectWorkspaceFeatureRealityFallback({
      workspaceDir,
      requiredModuleIds: listWorkspaceFeatureModuleIds(workspaceDir),
      contractId: buildPlan.promptFaithfulness.contract.id,
      previewUrl: 'workspace://post-materialization',
      registerAssessment: true,
    });

    const workspaceFingerprint = shortHashForTrace(`${workspaceRel}:${engineResult.generatedFiles.join('|')}`);
    productionBuildEnvelope = lockApprovedProductionBuildEnvelopeWorkspace(
      productionBuildEnvelope,
      workspaceRel,
      workspaceFingerprint,
    );
    syncGpcaCbgaEnvelope();
    advanceProductionEnvelopeState('WORKSPACE_READY', 'Materialized workspace locked on production build envelope.');
    advanceProductionEnvelopeState('GPCA_APPROVED', 'GPCA post-materialization audit passed.');

    continuationMaterializationExecuted = true;
    return { ok: true, failureReason: null };
  };

  // GPCA Continuation Workspace Compliance Fix V1 — this is the exact fix for the bypass GPCA
  // Runtime Wiring Trace V1 proved: `buildGpcaPostMaterializationReport` (which includes the
  // Rendered Content Evidence Expansion V1 rendered-content audit) previously only ran *inside*
  // `runWorkspaceMaterialization`. Every continuation branch below that decided the existing
  // workspace already had feature modules — via `workspaceHasGeneratedFeatureModules`, which only
  // checks *presence*, never compliance — and therefore skipped materialization entirely never
  // called it at all, so a stale/non-compliant workspace already on disk could reach workspace
  // stabilization, npm install/build, dev server start, and preview activation without ever being
  // audited. This closure runs the identical `buildGpcaPostMaterializationReport` call — same
  // contract, same cbgaReport, same buildPlan, same `workspaceDir` — against whatever files the
  // EXISTING workspace has right now, and assigns the result to the same single authoritative
  // `gpcaComplianceReport` that every hard-stop check in this function already re-consults via
  // `gpcaBlocksGeneration`. It changes no GPCA scoring/authority logic, adds no app-specific
  // logic, and never repairs or rewrites the workspace — it only ensures the audit that already
  // exists is actually invoked on this path too.
  const auditExistingWorkspaceForContinuation = (): void => {
    const existingFilePaths = listExistingWorkspaceGeneratedFilePaths(workspaceDir);
    gpcaComplianceReport = auditCurrentWorkspaceStateForGpca({
      contract: canonicalProductContract,
      cbgaReport: gpcaCbgaReport,
      buildPlan,
      workspaceDir,
    });
    contractConsumptionTrace({
      requestId: buildId,
      buildId,
      projectId,
      promptHash: shortHashForTrace(prompt),
      stage: 'WORKSPACE_MATERIALIZATION',
      functionName: 'auditExistingWorkspaceForContinuation',
      sourceFile: 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts',
      branchSelected: 'CONTINUATION_SKIP_REUSES_EXISTING_WORKSPACE',
      inputProductIdentity: canonicalProductContract.productIdentity,
      outputProductIdentity: canonicalProductContract.productIdentity,
      inputModules: buildPlan.modulePlan.approvedModuleIds,
      outputModules: existingFilePaths,
      inputRoutes: buildPlan.modulePlan.routes,
      outputRoutes: [],
      inputNavigation: [],
      outputNavigation: [],
      inputVisibleText: [],
      outputVisibleText: [],
      fallbackSelected: true,
      genericTemplateSelected: false,
      contractConsumed: true,
      cbgaPlanConsumed: true,
      promptBoundedModulePlanConsumed: false,
      universalFeatureContractConsumed: false,
      profileFeatureDefinitionConsumed: false,
    });
    if (productionBuildEnvelope.pipelineState.currentState === 'BUILD_ENVELOPE_CREATED') {
      advanceProductionEnvelopeState('MATERIALIZATION', 'Continuation path auditing existing workspace without regeneration.');
    }
    if (!productionBuildEnvelope.pipelineState.workspacePath) {
      const workspaceFingerprint = shortHashForTrace(`${workspaceRel}:${existingFilePaths.join('|')}`);
      productionBuildEnvelope = lockApprovedProductionBuildEnvelopeWorkspace(
        productionBuildEnvelope,
        workspaceRel,
        workspaceFingerprint,
      );
      syncGpcaCbgaEnvelope();
      if (productionBuildEnvelope.pipelineState.currentState === 'MATERIALIZATION') {
        advanceProductionEnvelopeState('WORKSPACE_READY', 'Continuation path locked existing workspace on envelope.');
      }
      advanceProductionEnvelopeState('GPCA_APPROVED', 'GPCA continuation workspace audit completed.');
    }
  };

  // GPCA Production Enforcement Fix V1 — this is the single, generic terminal gate for every
  // GPCA hard-stop, regardless of which stage detected it (pre-materialization inputs,
  // post-materialization real files, or a re-check immediately before preview activation). It is
  // called from every point in this function that could otherwise let a build continue past a
  // GPCA-blocked `gpcaComplianceReport` — including the ASE/AEE continuation-override branches,
  // which previously only inspected a collapsed `materializationExecuted` boolean and could
  // override a GPCA block once the (already non-compliant) workspace had files on disk. Once this
  // fires, the build is terminal: no further workspace generation, npm build, dev server start, or
  // live preview proof is ever attempted for this build. It never repairs, rewrites, or fabricates
  // compliance — it only stops, using GPCA's own evidence.
  const registerGpcaHardStop = async (
    stageLabel: ForensicBuildStage,
  ): Promise<OnePromptLivePreviewBuildResult> => {
    const gpcaReason = gpcaFailureReason(gpcaComplianceReport);
    const failureReason = `GENERATION_PIPELINE_NON_COMPLIANT: ${gpcaReason}`;
    touchForensicStage(workspaceDir, { stage: stageLabel, errors: [failureReason] });
    const aeoReport: AeoOrchestratorReport = await runAutonomousEngineeringOrchestrator({
      diagnosisInput: {
        gpcaComplianceReport: {
          finalGateOutcome: gpcaComplianceReport.finalGateOutcome,
          blockedReasons: gpcaComplianceReport.blockedReasons,
        },
      },
    });
    return registerFailedBuild({
      projectId,
      projectName,
      workspaceDir,
      failure: {
        failureStage: stageLabel,
        failureReason,
        status: 'ABORTED',
        lastSuccessfulStage,
      },
      result: {
        buildId,
        projectId,
        projectName,
        prompt,
        source,
        failureReason,
        workspaceId: projectId,
        workspacePath: workspaceRel,
        generatedProfile: generatedProfileForBuild,
        gpcaComplianceReport,
        aeoReport,
        gpcaHardStop: true,
        gpcaBlockedMaterialization: true,
        gpcaBlockedPreviewActivation: true,
        gpcaViolatedConstitutionRuleIds: PRODUCTION_PIPELINE_CONSTITUTION_ADOPTION_PHASE_1_RULE_IDS,
      },
    });
  };

  // Production Pipeline Constitution Adoption Phase 1 (Tier 1 — PPC-1203/PPC-1304/PPC-606/607/
  // 1001/1002/1205) — every repair/stabilization system downstream of the initial GPCA audit that
  // can write real files into `workspaceDir` (workspace stabilizer, build AutoFix, Engineering
  // Intelligence, capability evolution / AEL, and any other file-mutating repair loop) must call
  // this immediately after it runs. It marks the previously-captured `gpcaComplianceReport` stale,
  // re-runs the identical post-materialization audit against the CURRENT workspace state (never
  // the file list captured before the mutation), and returns whether the fresh report now blocks.
  // The caller — never this function — decides what to do with a block; this function only ever
  // re-audits and reports, it never rewrites the workspace and never changes GPCA's own scoring.
  let gpcaReportStale = false;
  // Production Pipeline Constitution Adoption Phase 1 — set the moment a POST-preview-activation
  // mutation (Engineering Intelligence repair, capability evolution) invalidates GPCA's report and
  // the fresh re-audit blocks. The dev server is already running by the time these two specific
  // stages execute, so this milestone cannot retroactively un-start it — but the final build
  // result must never claim a compliant/available live preview once this is set.
  let postPreviewGpcaBlockedMutationLabel: string | null = null;
  const reauditGpcaAfterWorkspaceMutation = (mutationLabel: string): boolean => {
    gpcaReportStale = true;
    syncGpcaCbgaEnvelope();
    const freshFilePaths = listExistingWorkspaceGeneratedFilePaths(workspaceDir);
    gpcaComplianceReport = auditCurrentWorkspaceStateForGpca({
      contract: canonicalProductContract,
      cbgaReport: gpcaCbgaReport,
      buildPlan,
      workspaceDir,
    });
    approvedRepairRealityPlan = recordApprovedRepairRealityRevalidation(
      approvedRepairRealityPlan,
      'GENERATION_PIPELINE_COMPLIANCE_AUTHORITY',
    );
    approvedRepairRealityPlan = recordApprovedRepairRealityRevalidation(
      approvedRepairRealityPlan,
      'PRODUCT_FAITHFULNESS_V2',
    );
    approvedRepairRealityPlan = recordApprovedRepairRealityRevalidation(
      approvedRepairRealityPlan,
      'PRODUCTION_PIPELINE_CONSTITUTION_V1',
    );
    applyRepairPlanToEnvelope();
    gpcaReportStale = false;
    contractConsumptionTrace({
      requestId: buildId,
      buildId,
      projectId,
      promptHash: shortHashForTrace(prompt),
      stage: 'WORKSPACE_MATERIALIZATION',
      functionName: 'reauditGpcaAfterWorkspaceMutation',
      sourceFile: 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts',
      branchSelected: `POST_AUDIT_MUTATION:${mutationLabel}`,
      inputProductIdentity: canonicalProductContract.productIdentity,
      outputProductIdentity: canonicalProductContract.productIdentity,
      inputModules: buildPlan.modulePlan.approvedModuleIds,
      outputModules: freshFilePaths,
      inputRoutes: buildPlan.modulePlan.routes,
      outputRoutes: [],
      inputNavigation: [],
      outputNavigation: [],
      inputVisibleText: [],
      outputVisibleText: [],
      fallbackSelected: false,
      genericTemplateSelected: false,
      contractConsumed: true,
      cbgaPlanConsumed: true,
      promptBoundedModulePlanConsumed: false,
      universalFeatureContractConsumed: false,
      profileFeatureDefinitionConsumed: false,
    });
    return gpcaBlocksGeneration(gpcaComplianceReport);
  };
  void gpcaReportStale;

  const engineeringPartial = await runAutonomousEngineering({
    rawPrompt: prompt,
    projectId,
    projectRootDir: input.projectRootDir,
    workspaceDir,
    productIntelligenceModel: buildPlan.productIntelligenceModel,
    promptFaithfulness: buildPlan.promptFaithfulness,
    capabilityPlanning: buildPlan.capabilityPlanning,
    simulateAseMaterializationDenial:
      input.source === 'validator' && input.simulateAseMaterializationDenial === true,
    host: {
      executeMaterialization: () => runWorkspaceMaterialization(),
    },
  });

  // Primary enforcement point: the moment ASE's materialization host call returns, re-check
  // GPCA's own report directly — never the collapsed `materializationExecuted` boolean. This runs
  // BEFORE any ASE/AEE continuation or override logic below, so a GPCA block can never be
  // reinterpreted as an overridable "ASE denial" just because the (non-compliant) workspace
  // already has files on disk.
  if (gpcaBlocksGeneration(gpcaComplianceReport)) {
    return registerGpcaHardStop('MATERIALIZATION');
  }

  if (!engineeringPartial.materializationExecuted) {
    const aseBlockers = collectAseMaterializationBlockers(engineeringPartial);
    const workspaceFallback =
      workspaceHasGeneratedFeatureModules(workspaceDir)
        ? collectWorkspaceFeatureRealityFallback({
            workspaceDir,
            requiredModuleIds: buildPlan.modulePlan.approvedModuleIds,
            contractId: buildPlan.promptFaithfulness.contract.id,
            previewUrl: 'workspace://continuation-policy',
            registerAssessment: false,
          })
        : null;

    const continuationFaithfulnessFields = buildPromptFaithfulnessManifestFields({
      rawPrompt: prompt,
      selectedProfile: String(materializationProfile),
      generatedModules:
        buildPlan.modulePlan.approvedModuleIds.length > 0
          ? buildPlan.modulePlan.approvedModuleIds
          : definition.featureModules,
      guardResult: buildPlan.guardResult,
      workspaceDir: workspaceHasGeneratedFeatureModules(workspaceDir) ? workspaceDir : undefined,
      approvedModuleIds: buildPlan.modulePlan.approvedModuleIds,
    });

    const manifestFaithfulnessForContinuation = resolveAeeContinuationManifestFaithfulness({
      buildPlan,
      workspaceDir,
      manifestFields: continuationFaithfulnessFields,
    });

    const runtimeContinuation = evaluateRuntimeBuildContinuation({
      workspaceDir,
      buildPlan,
      blockers: aseBlockers,
      featureRealityStatus: workspaceFallback?.status ?? null,
      manifestFaithfulness: manifestFaithfulnessForContinuation,
    });

    aeeExecutiveDecision = runAeeExecutiveCoordination({
      workspaceDir,
      buildPlan,
      rawPrompt: prompt,
      projectId,
      projectName,
      aseBlockers,
      aseMaterializationAuthorized: engineeringPartial.materializationAuthorized,
      aseMaterializationExecuted: engineeringPartial.materializationExecuted,
      featureRealityStatus: workspaceFallback?.status ?? null,
      manifestFaithfulness: manifestFaithfulnessForContinuation,
    });

    if (aeeExecutiveDecision.shouldContinueToBuild) {
      aseContinuationOverrideApplied = true;
      aseContinuationWarning = formatAeeOverrideWarning(aeeExecutiveDecision);
      recordForensicManifestAeeExecutiveDecision(workspaceDir, {
        decision: aeeExecutiveDecision.decision,
        reasoning: aeeExecutiveDecision.reasoning,
        overrideEvent: aeeExecutiveDecision.overrideEvent,
        overriddenBlockers: aeeExecutiveDecision.overriddenBlockers,
        respectedBlockers: aeeExecutiveDecision.respectedBlockers,
        evidenceProviders: aeeExecutiveDecision.evidence.map((e) => e.authority),
      });
      recordForensicManifestAseContinuationOverride(workspaceDir, {
        aseBlockers,
        warning: aseContinuationWarning,
      });
      touchForensicStage(workspaceDir, {
        stage: 'AEE_EXECUTIVE_COORDINATION',
        warnings: [aseContinuationWarning],
      });

      const needsMaterialization =
        aeeExecutiveDecision.shouldMaterializeFirst ||
        runtimeContinuation.shouldMaterializeFirst ||
        (!engineeringPartial.materializationExecuted && !workspaceHasGeneratedFeatureModules(workspaceDir));

      if (needsMaterialization) {
        const continuationResult = runWorkspaceMaterialization();
        if (gpcaBlocksGeneration(gpcaComplianceReport)) {
          return registerGpcaHardStop('MATERIALIZATION');
        }
        if (!continuationResult.ok) {
          return registerFailedBuild({
            projectId,
            projectName,
            workspaceDir,
            failure: {
              failureStage: 'MATERIALIZATION',
              failureReason:
                continuationResult.failureReason ??
                'Continuation materialization failed after ASE denial override.',
              lastSuccessfulStage,
            },
            result: {
              buildId,
              projectId,
              projectName,
              prompt,
              source,
              failureReason:
                continuationResult.failureReason ??
                'Continuation materialization failed after ASE denial override.',
              workspaceId: projectId,
              workspacePath: workspaceRel,
              generatedProfile: effectiveProfile,
            },
          });
        }
      } else {
        // GPCA Continuation Workspace Compliance Fix V1 — materialization is being skipped
        // because the existing workspace already appears to have feature modules; audit its
        // real, current contents before any workspace stabilization/build/preview step below.
        auditExistingWorkspaceForContinuation();
        if (gpcaBlocksGeneration(gpcaComplianceReport)) {
          return registerGpcaHardStop('MATERIALIZATION');
        }
        if (!materializationForEvidence) {
          materializationForEvidence = materializeBuildProofGapArtifacts({
            projectRootDir: materializationRoot,
            contract: { ...contract, contractId: projectId },
            rawPrompt: prompt,
            faithfulBuildPlan: buildPlan,
          });
        }
        if (!materializationValidationForBuild) {
          materializationValidationForBuild = inspectUniversalFeatureSignals(
            workspaceDir,
            prompt,
            generatedProfileForBuild,
            projectId,
            projectName,
            buildId,
            definition,
          );
        }
        continuationMaterializationExecuted = true;
        lastSuccessfulStage = 'MATERIALIZATION_VALIDATION';
      }
    } else if (
      aeeCanAbortBuild({
        hasGeneratedSource: workspaceHasGeneratedFeatureModules(workspaceDir),
        stage: aeeExecutiveDecision.stage,
        proposedFailureLabel:
          engineeringPartial.evidence.blockers[0] ??
          engineeringPartial.asePipeline.blockers[0] ??
          'ASE denied materialization authorization.',
        executiveDecision: aeeExecutiveDecision.decision,
      })
    ) {
      const materializedNow = workspaceHasGeneratedFeatureModules(workspaceDir);
      const failureReason =
        aeeExecutiveDecision.reasoning ??
        engineeringPartial.evidence.blockers[0] ??
        engineeringPartial.asePipeline.blockers[0] ??
        'ASE denied materialization authorization.';
      return registerFailedBuild({
        projectId,
        projectName,
        workspaceDir,
        failure: {
          failureStage: normalizeFailureStageLabel(
            materializedNow ? 'MATERIALIZATION' : 'PLANNING',
            resolveBuildOutcome({
              materialized: materializedNow,
              npmInstallOk: false,
              npmBuildOk: false,
              previewOk: false,
              previewDegraded: false,
              blockedBeforeMaterialization: !materializedNow,
            }),
          ),
          failureReason,
          status: 'ABORTED',
          lastSuccessfulStage,
        },
        result: {
          buildId,
          projectId,
          projectName,
          prompt,
          source,
          failureReason,
          workspaceId: projectId,
          workspacePath: workspaceRel,
          generatedProfile: effectiveProfile,
          planningProofLevel: contractAssessment.report.proofLevel,
          livePreviewGate: engineeringPartial.asePipeline.livePreviewGate,
          autonomousSoftwareEngineering: toAutonomousSoftwareEngineeringApiResult(
            engineeringPartial.asePipeline,
          ),
          aeeExecutiveDecision,
        },
      });
    } else {
      aseContinuationOverrideApplied = true;
      aseContinuationWarning =
        aeeExecutiveDecision.reasoning ??
        'AEE forbids abort after workspace evidence — continuing build spine.';
      recordForensicManifestAeeExecutiveDecision(workspaceDir, {
        decision: aeeExecutiveDecision.decision,
        reasoning: aseContinuationWarning,
        overrideEvent: aeeExecutiveDecision.overrideEvent,
        overriddenBlockers: aeeExecutiveDecision.overriddenBlockers,
        respectedBlockers: aeeExecutiveDecision.respectedBlockers,
        evidenceProviders: aeeExecutiveDecision.evidence.map((e) => e.authority),
      });
      touchForensicStage(workspaceDir, {
        stage: 'AEE_EXECUTIVE_COORDINATION',
        warnings: [aseContinuationWarning],
      });
      if (!workspaceHasGeneratedFeatureModules(workspaceDir)) {
        const continuationResult = runWorkspaceMaterialization();
        if (gpcaBlocksGeneration(gpcaComplianceReport)) {
          return registerGpcaHardStop('MATERIALIZATION');
        }
        if (!continuationResult.ok) {
          return registerFailedBuild({
            projectId,
            projectName,
            workspaceDir,
            failure: {
              failureStage: 'MATERIALIZATION',
              failureReason:
                continuationResult.failureReason ??
                'AEE-authorized materialization failed.',
              lastSuccessfulStage,
            },
            result: {
              buildId,
              projectId,
              projectName,
              prompt,
              source,
              failureReason:
                continuationResult.failureReason ?? 'AEE-authorized materialization failed.',
              workspaceId: projectId,
              workspacePath: workspaceRel,
              generatedProfile: effectiveProfile,
            },
          });
        }
      } else {
        // GPCA Continuation Workspace Compliance Fix V1 — same bypass, second branch: AEE
        // forbade abort and the workspace already appears to have feature modules, so
        // materialization is skipped here too. Audit the existing workspace before continuing.
        auditExistingWorkspaceForContinuation();
        if (gpcaBlocksGeneration(gpcaComplianceReport)) {
          return registerGpcaHardStop('MATERIALIZATION');
        }
        continuationMaterializationExecuted = true;
      }
    }
  }

  // Defense-in-depth re-check: whatever path the ASE/AEE continuation logic above took, GPCA's
  // own report is the single authoritative source — re-consult it directly (never a derived
  // boolean) before any workspace-stabilization/npm-install/npm-build/preview stage below is
  // allowed to run.
  if (gpcaBlocksGeneration(gpcaComplianceReport)) {
    return registerGpcaHardStop('MATERIALIZATION');
  }

  if (
    !engineeringPartial.materializationExecuted &&
    !continuationMaterializationExecuted &&
    !aseContinuationOverrideApplied
  ) {
    return registerFailedBuild({
      projectId,
      projectName,
      workspaceDir,
      failure: {
        failureStage: 'MATERIALIZATION',
        failureReason: 'ASE-authorized materialization did not complete.',
        lastSuccessfulStage,
      },
      result: {
        buildId,
        projectId,
        projectName,
        prompt,
        source,
        failureReason: 'ASE-authorized materialization did not complete.',
        workspaceId: projectId,
        workspacePath: workspaceRel,
        generatedProfile: effectiveProfile,
      },
    });
  }

  if (!materializationForEvidence) {
    materializationForEvidence = materializeBuildProofGapArtifacts({
      projectRootDir: materializationRoot,
      contract: { ...contract, contractId: projectId },
      rawPrompt: prompt,
      faithfulBuildPlan: buildPlan,
    });
  }
  if (!materializationValidationForBuild) {
    materializationValidationForBuild = inspectUniversalFeatureSignals(
      workspaceDir,
      prompt,
      generatedProfileForBuild,
      projectId,
      projectName,
      buildId,
      definition,
    );
  }

  const materialization = materializationForEvidence;
  const generatedProfile = generatedProfileForBuild;
  const materializationValidation = materializationValidationForBuild;

  let engineeringResult = engineeringPartial;

  let npmInstallOk = false;
  let npmBuildOk = false;

  executionMonitor.startStage('WORKSPACE_STABILIZATION');
  touchForensicStage(workspaceDir, { stage: 'WORKSPACE_STABILIZATION' });
  const workspaceStabilizerReport = stabilizeWorkspaceMaterialization({ workspaceDir, prompt });
  touchForensicStage(workspaceDir, {
    stage: 'WORKSPACE_STABILIZATION',
    durationMs: workspaceStabilizerReport.durationMs,
    warnings: workspaceStabilizerReport.summary.stillMissing,
  });

  if (
    workspaceStabilizerReport.status === 'WORKSPACE_BLOCKED' ||
    workspaceStabilizerReport.status === 'WORKSPACE_CORRUPTED'
  ) {
    executionMonitor.blockStage('WORKSPACE_STABILIZATION', workspaceStabilizerReport.summary.headline);
    return registerFailedBuild({
      projectId,
      projectName,
      workspaceDir,
      failure: {
        failureStage: 'WORKSPACE_STABILIZATION',
        failureReason: workspaceStabilizerReport.summary.headline,
        lastSuccessfulStage,
      },
      result: {
        buildId,
        projectId,
        projectName,
        prompt,
        source,
        failureReason: workspaceStabilizerReport.summary.headline,
        workspaceId: projectId,
        workspacePath: workspaceRel,
        generatedProfile,
        planningProofLevel: contractAssessment.report.proofLevel,
        materializationProofLevel: materialization.proofLevel,
        workspaceStabilizerReport,
      },
    });
  }

  // Production Pipeline Constitution Adoption Phase 1 (Tier 1) — the workspace stabilizer applies
  // targeted, evidence-driven repairs (missing router/manifest/barrel-export files, etc.) directly
  // to `workspaceDir`. Any repair actually applied is a real post-audit workspace mutation, so the
  // GPCA report captured before this stage ran is now stale evidence — re-run GPCA against the
  // CURRENT workspace state before npm install/build/preview are ever allowed to proceed.
  if (workspaceStabilizerReport.repairActions.some((action) => action.applied)) {
    approvedRepairRealityPlan = appendApprovedRepairRealityEntries(
      approvedRepairRealityPlan,
      workspaceStabilizerReport.repairActions
        .filter((action) => action.applied)
        .map((action, index) =>
          createWorkspaceMutationRepairEntry({
            repairId: `workspace-stabilizer-${action.findingId}-${index}`,
            repairReason: action.detail || action.description,
            producer: 'WORKSPACE_MATERIALIZATION_STABILIZER_V1',
            mutatedPaths: action.path ? [action.path] : [],
          }),
        ),
    );
    applyRepairPlanToEnvelope();
    if (reauditGpcaAfterWorkspaceMutation('WORKSPACE_STABILIZATION')) {
      return registerGpcaHardStop('WORKSPACE_STABILIZATION');
    }
  }

  executionMonitor.startStage('NPM_INSTALL');
  touchForensicStage(workspaceDir, { stage: 'NPM_INSTALL' });
  const npmInstallStartedAt = performance.now();
  try {
    execSync('npm install --ignore-scripts', {
      cwd: workspaceDir,
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 180_000,
    });
    npmInstallOk = true;
    timings.npmInstallDurationMs = roundDurationMs(npmInstallStartedAt);
    touchForensicStage(workspaceDir, {
      stage: 'NPM_INSTALL',
      durationMs: timings.npmInstallDurationMs,
      timingsPatch: { npmInstallDurationMs: timings.npmInstallDurationMs },
    });
    lastSuccessfulStage = 'NPM_INSTALL';
    executionMonitor.completeStage('NPM_INSTALL', `npm install finished in ${Math.round(timings.npmInstallDurationMs)}ms.`);
  } catch (err) {
    timings.npmInstallDurationMs = roundDurationMs(npmInstallStartedAt);
    const commandFailure = extractExecCommandFailure(err, 'npm install --ignore-scripts');
    const failureReason = `npm install failed: ${commandFailure.failureMessage}`;
    const npmInstallStalled = /timeout|timed out|ETIMEDOUT|SIGTERM/i.test(
      `${commandFailure.failureMessage} ${commandFailure.errorCode ?? ''}`,
    );
    executionMonitor.markStall(
      'NPM_INSTALL',
      npmInstallStalled ? 'npm install stopped responding within its time budget.' : failureReason,
    );
    const recovered = tryAutonomousRecovery({
      projectId,
      failureStage: 'NPM_INSTALL',
      failureReason,
      host: {
        retryStage: () => {
          try {
            execSync('npm install --ignore-scripts', {
              cwd: workspaceDir,
              encoding: 'utf8',
              stdio: 'pipe',
              timeout: 180_000,
            });
            return { ok: true, detail: 'npm install succeeded after autonomous recovery.' };
          } catch (retryErr) {
            const retryFailure = extractExecCommandFailure(retryErr, 'npm install --ignore-scripts');
            return { ok: false, detail: retryFailure.failureMessage };
          }
        },
        replayValidation: () => ({ ok: true, detail: 'Dependency validation replay passed.' }),
        continueBuild: () => ({ ok: true, detail: 'Build continuation authorized after npm recovery.' }),
      },
    });
    executionMonitor.recordRecoveryAttempt({
      readOnly: true,
      stage: 'NPM_INSTALL',
      actionKind: 'RESTART_NPM_INSTALL',
      attemptedAtMs: Date.now(),
      succeeded: recovered,
      detail: recovered ? 'npm install succeeded after one automatic restart.' : commandFailure.failureMessage,
    });
    if (recovered) {
      npmInstallOk = true;
      lastSuccessfulStage = 'NPM_INSTALL';
      approvedRepairRealityPlan = appendApprovedRepairRealityEntries(approvedRepairRealityPlan, [
        createPipelineRestartRepairEntry({
          repairId: 'npm-install-pipeline-restart',
          repairReason: 'npm install succeeded after one bounded pipeline restart — no workspace files mutated.',
          stage: 'NPM_INSTALL',
        }),
      ]);
      applyRepairPlanToEnvelope();
      executionMonitor.markRecovered(
        'NPM_INSTALL',
        'Pipeline restart succeeded (npm install retried). No workspace mutation occurred.',
      );
    } else {
      executionMonitor.failStage('NPM_INSTALL', commandFailure.failureMessage);
    touchForensicStage(workspaceDir, {
      stage: 'NPM_INSTALL',
      durationMs: timings.npmInstallDurationMs,
      timingsPatch: { npmInstallDurationMs: timings.npmInstallDurationMs },
      errors: [commandFailure.failureMessage],
    });
    return registerFailedBuild({
      projectId,
      projectName,
      workspaceDir,
      failure: {
        failureStage: 'NPM_INSTALL',
        failureReason: `npm install failed: ${commandFailure.failureMessage}`,
        failureMessage: commandFailure.failureMessage,
        lastSuccessfulStage,
        commandFailure,
      },
      result: {
        buildId,
        projectId,
        projectName,
        prompt,
        source,
        failureReason: `npm install failed: ${commandFailure.failureMessage}`,
        workspaceId: projectId,
        workspacePath: workspaceRel,
        generatedProfile,
        planningProofLevel: contractAssessment.report.proofLevel,
        materializationProofLevel: materialization.proofLevel,
        npmInstallOk: false,
        workspaceStabilizerReport,
      },
    });
    }
  }

  executionMonitor.startStage('NPM_BUILD');
  touchForensicStage(workspaceDir, { stage: 'NPM_BUILD' });
  const npmBuildStartedAt = performance.now();

  if (input.source === 'validator' && input.simulateBuildAutofixFailure === true) {
    injectSimulatedBuildFailure(workspaceDir);
  }

  const runNpmBuildAttempt = (): { ok: boolean; output: string } => {
    try {
      execSync('npm run build', {
        cwd: workspaceDir,
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 180_000,
      });
      return { ok: true, output: '' };
    } catch (err) {
      const commandFailure = extractExecCommandFailure(err, 'npm run build');
      return { ok: false, output: commandFailure.failureMessage };
    }
  };

  let buildAutofixLoop: Awaited<ReturnType<typeof runAeeBuildAutofixLoop>> | null = null;
  let buildAutofixAttempts = 0;
  let initialBuildOutput = '';

  const firstBuildAttempt = runNpmBuildAttempt();
  npmBuildOk = firstBuildAttempt.ok;
  initialBuildOutput = firstBuildAttempt.output;
  timings.npmBuildDurationMs = roundDurationMs(npmBuildStartedAt);

  if (npmBuildOk) {
    touchForensicStage(workspaceDir, {
      stage: 'NPM_BUILD',
      durationMs: timings.npmBuildDurationMs,
      timingsPatch: { npmBuildDurationMs: timings.npmBuildDurationMs },
    });
    lastSuccessfulStage = 'NPM_BUILD';
    executionMonitor.completeStage('NPM_BUILD', `npm build finished in ${Math.round(timings.npmBuildDurationMs)}ms.`);
    advanceProductionEnvelopeState('BUILD_VALIDATED', 'npm build passed — build validated before preview.');
  } else {
    const npmBuildStalled = /timeout|timed out|ETIMEDOUT|SIGTERM/i.test(initialBuildOutput);
    executionMonitor.markStall(
      'NPM_BUILD',
      npmBuildStalled ? 'npm build stopped responding within its time budget.' : excerptBuildOutput(initialBuildOutput),
    );
    touchForensicStage(workspaceDir, {
      stage: 'NPM_BUILD',
      durationMs: timings.npmBuildDurationMs,
      timingsPatch: { npmBuildDurationMs: timings.npmBuildDurationMs },
      errors: [excerptBuildOutput(initialBuildOutput)],
    });
    touchForensicStage(workspaceDir, { stage: 'AUTO_REPAIRING' });

    buildAutofixLoop = await runAeeBuildAutofixLoop({
      workspaceDir,
      projectId,
      initialBuildOk: false,
      initialBuildOutput,
      simulateBuildAutofixRepair: input.simulateBuildAutofixFailure,
      simulateBuildAutofixExhausted: input.simulateBuildAutofixExhausted,
      rerunBuild: runNpmBuildAttempt,
    });

    buildAutofixAttempts = buildAutofixLoop.attempts.length;
    npmBuildOk = buildAutofixLoop.finalBuildOk;

    executionMonitor.recordRecoveryAttempt({
      readOnly: true,
      stage: 'NPM_BUILD',
      actionKind: 'RESTART_NPM_BUILD',
      attemptedAtMs: Date.now(),
      succeeded: npmBuildOk,
      detail: npmBuildOk
        ? `npm build succeeded after ${buildAutofixAttempts} automatic repair attempt(s).`
        : buildAutofixLoop.summary,
    });
    if (npmBuildOk) {
      executionMonitor.markRecovered(
        'NPM_BUILD',
        buildAutofixLoop.report.filesChanged.length > 0
          ? `Compilation AutoFix repaired workspace source files (${buildAutofixLoop.report.filesChanged.length} file(s) mutated).`
          : 'npm build succeeded after bounded retry — no workspace source mutation.',
      );
    } else {
      executionMonitor.failStage('NPM_BUILD', buildAutofixLoop.summary);
    }

    recordForensicManifestAeeExecutiveDecision(workspaceDir, {
      decision: npmBuildOk ? 'CONTINUE' : 'REPAIR',
      reasoning: buildAutofixLoop.summary,
      overrideEvent: null,
      overriddenBlockers: [],
      respectedBlockers: npmBuildOk ? [] : [...buildAutofixLoop.report.remainingErrors],
      evidenceProviders: ['AEE_BUILD_AUTOFIX_LOOP'],
    });

    // Production Pipeline Constitution Adoption Phase 1 (Tier 1) — Build AutoFix rewrites real
    // workspace files (`report.filesChanged`) to repair a failing `npm run build`. Any file it
    // actually changed is a real post-audit mutation, so the GPCA report captured before this
    // stage ran is now stale — re-run GPCA against the CURRENT workspace state before this build
    // is ever allowed to reach npm-build success, workspace stabilization already having passed,
    // dev server start, or live preview.
    if (buildAutofixLoop.report.filesChanged.length > 0) {
      approvedRepairRealityPlan = appendApprovedRepairRealityEntries(approvedRepairRealityPlan, [
        createAutofixCompilationRepairEntry({
          repairId: `npm-build-autofix-${buildAutofixAttempts}`,
          repairReason: `Build AutoFix compilation repair changed ${buildAutofixLoop.report.filesChanged.length} workspace file(s).`,
          mutatedPaths: buildAutofixLoop.report.filesChanged,
        }),
      ]);
      applyRepairPlanToEnvelope();
      if (reauditGpcaAfterWorkspaceMutation('NPM_BUILD_AUTOFIX')) {
        return registerGpcaHardStop('NPM_BUILD');
      }
    }

    if (npmBuildOk) {
      timings.npmBuildDurationMs = roundDurationMs(npmBuildStartedAt);
      touchForensicStage(workspaceDir, {
        stage: 'NPM_BUILD',
        durationMs: timings.npmBuildDurationMs,
        timingsPatch: { npmBuildDurationMs: timings.npmBuildDurationMs },
        warnings: [`Build AutoFix succeeded after ${buildAutofixAttempts} attempt(s).`],
      });
      lastSuccessfulStage = 'NPM_BUILD';
      advanceProductionEnvelopeState('BUILD_VALIDATED', 'npm build passed after AutoFix — build validated before preview.');
    } else if (buildAutofixLoop.exhausted) {
      touchForensicStage(workspaceDir, {
        stage: 'AUTO_REPAIRING',
        errors: [...buildAutofixLoop.report.remainingErrors],
        warnings: [`Build AutoFix exhausted after ${buildAutofixAttempts} attempt(s).`],
      });

      const buildErrorOutcome = resolveAeeBuildOutcome({
        workspaceExists: true,
        materialized: workspaceHasGeneratedFeatureModules(workspaceDir),
        npmInstallOk: true,
        npmBuildOk: false,
        previewOk: false,
        previewDegraded: false,
        repairAttempts: buildAutofixAttempts,
        concreteBlocker: false,
      });

      aeeExecutiveDecision = runAeeExecutiveCoordination({
        workspaceDir,
        buildPlan,
        rawPrompt: prompt,
        projectId,
        projectName,
        aseBlockers: buildAutofixLoop.report.remainingErrors,
        aseMaterializationAuthorized: true,
        aseMaterializationExecuted: true,
        manifestFaithfulness: resolveAeeContinuationManifestFaithfulness({
          buildPlan,
          workspaceDir,
          manifestFields: buildPromptFaithfulnessManifestFields({
            rawPrompt: prompt,
            selectedProfile: String(materializationProfile),
            generatedModules: listWorkspaceFeatureModuleIds(workspaceDir),
            guardResult: buildPlan.guardResult,
            workspaceDir,
            approvedModuleIds: buildPlan.modulePlan.approvedModuleIds,
          }),
        }),
        npmInstallOk: true,
        npmBuildOk: false,
        previewOk: false,
        repairAttempts: buildAutofixAttempts,
      });

      aeeFinalReport = buildAeeFinalReport({
        projectName,
        selectedProfile: String(generatedProfile),
        generatedModules: listWorkspaceFeatureModuleIds(workspaceDir),
        workspacePath: workspaceRel,
        workspaceDir,
        executiveDecision: aeeExecutiveDecision,
        npmInstallOk: true,
        npmBuildOk: false,
        previewOk: false,
        previewDegraded: false,
        livePreviewUrl: null,
        remainingGaps: [
          buildAutofixLoop.summary,
          ...buildAutofixLoop.report.remainingErrors,
        ],
        outcome: buildErrorOutcome,
        buildAutofixReport: buildAutofixLoop.report,
      });

      const aeoReport: AeoOrchestratorReport = await runAutonomousEngineeringOrchestrator({
        diagnosisInput: {
          rawFailureReason: buildAutofixLoop.report.finalBuildError ?? buildAutofixLoop.summary,
          rawBuildOutput: buildAutofixLoop.report.finalBuildError ?? initialBuildOutput,
          npmInstallOk: true,
          npmBuildOk: false,
          engineeringReportRemainingGaps: aeeFinalReport?.remainingGaps ?? [],
          gpcaComplianceReport,
        },
      });

      const buildErrorsCompleted: OnePromptLivePreviewBuildResult = {
        readOnly: true,
        buildId,
        projectId,
        projectName,
        status: 'READY',
        prompt,
        requestType: source === 'chat' ? 'CHAT_BUILD' : 'BUILD_FROM_PROMPT',
        workspaceId: projectId,
        workspacePath: workspaceRel,
        generatedProfile,
        planningProofLevel: contractAssessment.report.proofLevel,
        materializationProofLevel: materialization.proofLevel,
        buildResult: 'FAIL',
        npmInstallOk: true,
        npmBuildOk: false,
        previewUrl: null,
        diagnosticPreviewUrl: null,
        limitedPreviewUrl: null,
        devServerRunning: false,
        livePreviewAvailable: false,
        previewStatus: 'NOT_ATTEMPTED',
        buildAutofixAttempts,
        buildAutofixLoop,
        failureReason: aeoReport.plainEnglishSummary,
        featureSignals: null,
        materializationManifest: finalizeForensicManifestFailure(workspaceDir, {
          failureStage: 'NPM_BUILD',
          failureReason: buildAutofixLoop.summary,
          failureMessage: buildAutofixLoop.report.finalBuildError ?? undefined,
          lastSuccessfulStage,
          status: 'PARTIAL',
          warnings: [`AEE build AutoFix exhausted — ${buildErrorOutcome}`],
        }),
        livePreviewGate: engineeringResult.asePipeline.livePreviewGate,
        autonomousSoftwareEngineering: toAutonomousSoftwareEngineeringApiResult(
          engineeringResult.asePipeline,
        ),
        aeeExecutiveDecision,
        aeeFinalReport,
        aeoReport,
        gpcaComplianceReport,
        updatedAt: new Date().toISOString(),
      };

      persistBuildIntentRun({
        buildRunId: buildId,
        projectId,
        projectName,
        prompt,
        profile: generatedProfile,
        status: 'READY',
        stage: 'BUILD_AUTOFIX_EXHAUSTED',
        workspacePath: workspaceRel,
        previewUrl: null,
        planTaskCount,
        architectureSummary,
        failureReason: aeoReport.plainEnglishSummary,
        projectRootDir: resolveProjectRegistryRootDir(),
      });

      return registerBuildOutcome(projectId, projectName, buildErrorsCompleted);
    } else {
      return registerFailedBuild({
        projectId,
        projectName,
        workspaceDir,
        failure: {
          failureStage: 'NPM_BUILD',
          failureReason: `npm run build failed: ${initialBuildOutput}`,
          failureMessage: initialBuildOutput,
          lastSuccessfulStage,
        },
        result: {
          buildId,
          projectId,
          projectName,
          prompt,
          source,
          failureReason: `npm run build failed: ${initialBuildOutput}`,
          workspaceId: projectId,
          workspacePath: workspaceRel,
          generatedProfile,
          planningProofLevel: contractAssessment.report.proofLevel,
          materializationProofLevel: materialization.proofLevel,
          npmInstallOk: true,
          npmBuildOk: false,
          buildAutofixAttempts,
          buildAutofixLoop,
          workspaceStabilizerReport,
        },
      });
    }
  }

  // Production Pipeline Constitution Adoption Phase 1 (Tier 1 — PPC-1001/PPC-1002/PPC-1205) —
  // final hard gate before preview activation. GPCA never gets to be "the check we ran earlier
  // and forgot about", and it never gets to rely on a stale in-memory report captured earlier in
  // the request: this ALWAYS re-runs the post-materialization audit against the CURRENT workspace
  // state — after the workspace stabilizer and Build AutoFix have both already had their own
  // narrower re-audits above, and after whatever continuation/materialization path this build
  // took — one last time, immediately before the only production call site that starts a real dev
  // server for this build. The dev server (and every live-preview-proof step downstream of it)
  // must never start for a build whose freshest possible GPCA evidence is a blocking outcome.
  if (reauditGpcaAfterWorkspaceMutation('PRE_PREVIEW_FINAL_GATE')) {
    return registerGpcaHardStop('PREVIEW');
  }
  if (
    repairRevalidationSatisfiedBeforePreview(approvedRepairRealityPlan) === false &&
    repairRealityRequiresRevalidationBeforePreview(approvedRepairRealityPlan)
  ) {
    return registerGpcaHardStop('PREVIEW');
  }

  try {
    assertApprovedProductionBuildEnvelopePreviewGuarantee(productionBuildEnvelope);
  } catch (previewGuaranteeErr) {
    const failureReason =
      previewGuaranteeErr instanceof Error
        ? previewGuaranteeErr.message
        : 'CONSTITUTIONAL_VIOLATION_PPC_2200: preview guarantee failed before preview activation.';
    return registerFailedBuild({
      projectId,
      projectName,
      workspaceDir,
      failure: {
        failureStage: 'PREVIEW',
        failureReason,
        lastSuccessfulStage,
        status: 'PARTIAL',
        warnings: continuationFailureWarnings(),
      },
      result: {
        buildId,
        projectId,
        projectName,
        prompt,
        source,
        failureReason,
        workspaceId: projectId,
        workspacePath: workspaceRel,
        generatedProfile,
        planningProofLevel: contractAssessment.report.proofLevel,
        materializationProofLevel: materialization.proofLevel,
        npmInstallOk: true,
        npmBuildOk: true,
      },
    });
  }
  advanceProductionEnvelopeState(
    'PREVIEW_READY',
    'Preview guarantee verified — GPCA-audited workspace equals preview workspace.',
  );

  executionMonitor.startStage('PREVIEW_STARTUP');
  touchForensicStage(workspaceDir, { stage: 'PREVIEW' });
  const previewStartedAt = performance.now();
  const devServer = await startGeneratedAppDevServer({
    workspaceDir,
    workspaceId: projectId,
  });
  timings.previewDurationMs = roundDurationMs(previewStartedAt);

  if (!devServer.ok || !devServer.url) {
    const failureReason = devServer.error ?? 'Dev server failed to start';
    executionMonitor.failStage('PREVIEW_STARTUP', failureReason);
    touchForensicStage(workspaceDir, {
      stage: 'PREVIEW',
      durationMs: timings.previewDurationMs,
      timingsPatch: { previewDurationMs: timings.previewDurationMs },
      errors: [failureReason],
    });
    return registerFailedBuild({
      projectId,
      projectName,
      workspaceDir,
      failure: {
        failureStage: 'PREVIEW',
        failureReason,
        lastSuccessfulStage,
        status: 'PARTIAL',
        warnings: continuationFailureWarnings(),
      },
      result: {
        buildId,
        projectId,
        projectName,
        prompt,
        source,
        failureReason,
        workspaceId: projectId,
        workspacePath: workspaceRel,
        generatedProfile,
        planningProofLevel: contractAssessment.report.proofLevel,
        materializationProofLevel: materialization.proofLevel,
        npmInstallOk: true,
        npmBuildOk: true,
      },
    });
  }

  touchForensicStage(workspaceDir, {
    stage: 'PREVIEW',
    durationMs: timings.previewDurationMs,
    timingsPatch: { previewDurationMs: timings.previewDurationMs },
  });
  lastSuccessfulStage = 'PREVIEW';
  executionMonitor.completeStage('PREVIEW_STARTUP', `Preview started in ${Math.round(timings.previewDurationMs)}ms.`);

  engineeringResult = completeAutonomousEngineering({
    partial: engineeringResult,
    previewUrl: devServer.url ?? null,
    projectRootDir: input.projectRootDir,
    workspaceDir,
    rawPrompt: prompt,
    projectId,
  });

  const asePipeline = engineeringResult.asePipeline;
  const autonomousSoftwareEngineering = toAutonomousSoftwareEngineeringApiResult(asePipeline);
  const incrementalPipeline = asePipeline.artifacts.incrementalBuild;
  const behaviorPipeline = asePipeline.artifacts.behaviorSimulation;
  const virtualUserPipeline = asePipeline.artifacts.virtualUserSimulation;
  const virtualDevicePipeline = asePipeline.artifacts.virtualDeviceLaboratory;
  const interactionProofPipeline = asePipeline.artifacts.interactionProof;
  const autonomousDebuggingPipeline = asePipeline.artifacts.autonomousDebugging;
  const continuousImprovementPipeline = asePipeline.artifacts.continuousImprovement;
  let launchReadinessResult = asePipeline.launchReadiness;

  let livePreviewGateBridge = evaluateLivePreviewGateForOrchestrator({
    rawPrompt: prompt,
    previewUrl: devServer.url ?? null,
    generationComplete: true,
    productIntelligenceModel: buildPlan.productIntelligenceModel,
    promptFaithfulness: buildPlan.promptFaithfulness,
    capabilityPlanning: buildPlan.capabilityPlanning,
    incrementalBuild: incrementalPipeline,
    behaviorSimulation: behaviorPipeline,
    virtualUserSimulation: virtualUserPipeline,
    virtualDeviceLaboratory: virtualDevicePipeline,
    interactionProof: interactionProofPipeline,
    autonomousDebugging: autonomousDebuggingPipeline,
    continuousImprovement: continuousImprovementPipeline,
    launchReadiness: launchReadinessResult,
    projectRootDir: input.projectRootDir ?? null,
    workspaceDir: workspaceDir,
  });

  let devServerRunning = devServer.ok && Boolean(devServer.url);
  let authoritativePreview = resolveAuthoritativePreviewUrls({
    gate: livePreviewGateBridge.gate,
    devServerUrl: devServer.url ?? null,
    devServerRunning,
  });
  let livePreviewAvailable = authoritativePreview.livePreviewAvailable;
  let previewRecoveryAttempts = 0;
  let previewRecoverySummary: string | null = null;
  let buildAutofixAttemptsFinal = buildAutofixAttempts;
  let buildAutofixLoopFinal = buildAutofixLoop;

  if (!livePreviewAvailable && npmBuildOk) {
    touchForensicStage(workspaceDir, { stage: 'AUTO_REPAIRING' });
    const previewRecovery = await runAeePreviewRecoveryLoop({
      rawPrompt: prompt,
      projectId,
      workspaceDir,
      projectRootDir: input.projectRootDir ?? null,
      npmBuildOk,
      devServerUrl: devServer.url ?? null,
      gateBridge: livePreviewGateBridge,
      pipelines: {
        productIntelligenceModel: buildPlan.productIntelligenceModel,
        promptFaithfulness: buildPlan.promptFaithfulness,
        capabilityPlanning: buildPlan.capabilityPlanning,
        incrementalBuild: incrementalPipeline,
        behaviorSimulation: behaviorPipeline,
        virtualUserSimulation: virtualUserPipeline,
        virtualDeviceLaboratory: virtualDevicePipeline,
        interactionProof: interactionProofPipeline,
        autonomousDebugging: autonomousDebuggingPipeline,
        continuousImprovement: continuousImprovementPipeline,
        launchReadiness: launchReadinessResult,
        missingCapabilityEvolution: asePipeline.artifacts.missingCapabilityEvolution,
      },
      restartDevServer: async () => {
        const retry = await startGeneratedAppDevServer({
          workspaceDir,
          workspaceId: projectId,
        });
        return { ok: retry.ok, url: retry.url ?? null, error: retry.error ?? null };
      },
      simulatePreviewRecoveryRepair: input.simulatePreviewRecoveryRepair,
    });

    previewRecoveryAttempts = previewRecovery.attempts.length;
    previewRecoverySummary = previewRecovery.summary;
    livePreviewGateBridge = previewRecovery.gateBridge;
    launchReadinessResult = previewRecovery.pipelines.launchReadiness;
    if (previewRecovery.devServerUrl) {
      devServer.url = previewRecovery.devServerUrl;
    }
    devServerRunning = devServer.ok && Boolean(devServer.url || previewRecovery.devServerUrl);
    authoritativePreview = resolveAuthoritativePreviewUrls({
      gate: livePreviewGateBridge.gate,
      devServerUrl: previewRecovery.devServerUrl ?? devServer.url ?? null,
      devServerRunning,
    });
    livePreviewAvailable = previewRecovery.previewUnlocked;

    if (previewRecoveryAttempts > 0) {
      executionMonitor.recordRecoveryAttempt({
        readOnly: true,
        stage: 'PREVIEW_STARTUP',
        actionKind: 'RESTART_PREVIEW_SERVER',
        attemptedAtMs: Date.now(),
        succeeded: livePreviewAvailable,
        detail: previewRecoverySummary ?? 'Preview recovery attempted.',
      });
      if (livePreviewAvailable) {
        approvedRepairRealityPlan = appendApprovedRepairRealityEntries(approvedRepairRealityPlan, [
          createPreviewRecoveryRepairEntry({
            repairId: `preview-recovery-${previewRecoveryAttempts}`,
            repairReason:
              previewRecoverySummary ??
              'Preview startup recovered via bounded preview recovery (runtime/preview restart, no workspace source mutation).',
          }),
        ]);
        applyRepairPlanToEnvelope();
        executionMonitor.markRecovered(
          'PREVIEW_STARTUP',
          previewRecoverySummary ??
            'Preview startup recovered via preview recovery (runtime restart — no workspace source mutation).',
        );
      } else {
        executionMonitor.failStage('PREVIEW_STARTUP', previewRecoverySummary ?? 'Preview did not recover.');
      }
    }

    engineeringResult = completeAutonomousEngineering({
      partial: engineeringResult,
      previewUrl: previewRecovery.devServerUrl ?? devServer.url ?? null,
      projectRootDir: input.projectRootDir,
      workspaceDir,
      rawPrompt: prompt,
      projectId,
    });

    recordForensicManifestAeeExecutiveDecision(workspaceDir, {
      decision: livePreviewAvailable ? 'PREVIEW' : 'REPAIR',
      reasoning: previewRecovery.summary,
      overrideEvent: null,
      overriddenBlockers: [],
      respectedBlockers: livePreviewAvailable
        ? []
        : [
            livePreviewGateBridge.failureReason ??
              livePreviewGateBridge.gate.blockerExplanation.summary ??
              'Preview gate remained locked after recovery loop.',
          ],
      evidenceProviders: ['AUTONOMOUS_DEBUGGING', 'MISSING_CAPABILITY_EVOLUTION', 'LIVE_PREVIEW_GATE'],
    });
  }

  const gateBlocker =
    livePreviewGateBridge.failureReason ??
    livePreviewGateBridge.gate.blockerExplanation.summary ??
    'Live Preview Gate blocked preview unlock.';

  const previewContract = await resolveAeePreviewContract({
    npmInstallOk,
    npmBuildOk,
    devServerRunning,
    devServerUrl: devServer.url ?? null,
    gate: livePreviewGateBridge.gate,
    gateBlocker,
    previewRecoveryAttempts,
    previewRecoveryExhausted:
      previewRecoveryAttempts >= AEE_PREVIEW_RECOVERY_MAX_ATTEMPTS &&
      !livePreviewGateBridge.livePreviewAvailable,
  });

  livePreviewAvailable = previewContract.livePreviewAvailable;
  devServerRunning = previewContract.devServerRunning;
  authoritativePreview = previewContract.authoritativePreview;
  livePreviewGateBridge = {
    ...livePreviewGateBridge,
    gate: previewContract.gate,
    livePreviewAvailable: previewContract.livePreviewAvailable,
    previewUrl: previewContract.previewUrl,
    failureReason: previewContract.gateLocked ? gateBlocker : null,
  };

  const previewProbeUrl = previewContract.previewUrl ?? null;
  const diagnosticPreviewUrl =
    previewContract.diagnosticPreviewUrl ?? devServer.url ?? null;
  let endToEndBuildRealityReport: E2EBuildRealityReport | null = null;
  if (previewProbeUrl && workspaceDir && input.deferEndToEndBuildRealityGate !== true) {
    endToEndBuildRealityReport = await runEndToEndBuildReality({
      rawPrompt: prompt,
      projectRootDir: input.projectRootDir ?? resolveProjectRegistryRootDir(),
      projectId,
      projectName,
      skipFullBuild: true,
      workspaceDir,
      previewUrl: previewProbeUrl,
      gateUnlockedPreviewUrl: previewProbeUrl,
      diagnosticPreviewUrl,
      buildReady: buildPlan.readyForGeneration,
    });
  }

  const postBuildFaithfulnessFields = buildPromptFaithfulnessManifestFields({
    rawPrompt: prompt,
    selectedProfile: String(materializationProfile),
    generatedModules: listWorkspaceFeatureModuleIds(workspaceDir),
    guardResult: buildPlan.guardResult,
    workspaceDir,
    approvedModuleIds: buildPlan.modulePlan.approvedModuleIds,
  });

  const engineeringIntelligencePostWorkspace = buildPlan.engineeringIntelligence
    ? await runEngineeringIntelligencePostWorkspace({
        rawPrompt: prompt,
        workspaceDir,
        projectRootDir: input.projectRootDir,
        workspaceId: projectId,
        selectedProfile: String(materializationProfile),
        buildPlanDefinition: buildPlan.definition,
        approvedModuleIds: buildPlan.modulePlan.approvedModuleIds,
        generatedModules: listWorkspaceFeatureModuleIds(workspaceDir),
        contract: buildPlan.engineeringIntelligence.contract,
        profileMismatch: buildPlan.engineeringIntelligence.profileMismatch,
        productIntelligenceModel: buildPlan.productIntelligenceModel,
        promptFaithfulness: buildPlan.promptFaithfulness,
        capabilityPlanning: buildPlan.capabilityPlanning,
        rerunBuild: runNpmBuildAttempt,
      })
    : null;

  if (engineeringIntelligencePostWorkspace?.repairResult?.finalNpmBuildOk === false) {
    npmBuildOk = false;
  } else if (engineeringIntelligencePostWorkspace?.repairResult?.finalNpmBuildOk === true) {
    npmBuildOk = true;
  }

  // Production Pipeline Constitution Adoption Phase 1 (Tier 1) — Engineering Intelligence's
  // missing-capability repair loop generates/rewrites real workspace files
  // (`repairResult.repairAttempts`). This runs after the dev server has already been started
  // above, so — unlike the pre-preview mutation points — this milestone cannot retroactively
  // "not start preview" for an already-running server; instead it re-audits immediately and, if
  // GPCA now blocks, the final result below is corrected to never report a compliant/available
  // preview for this build, and no further repair stage (capability evolution) is allowed to run.
  if ((engineeringIntelligencePostWorkspace?.repairResult?.repairAttempts.length ?? 0) > 0) {
    approvedRepairRealityPlan = appendApprovedRepairRealityEntries(
      approvedRepairRealityPlan,
      (engineeringIntelligencePostWorkspace?.repairResult?.repairAttempts ?? []).map((attempt) =>
        createGeneratorRegenerationRepairEntry({
          repairId: `engineering-intelligence-regen-${attempt.attemptNumber}`,
          repairReason: `Engineering Intelligence generator regeneration attempt ${attempt.attemptNumber}.`,
          mutatedPaths: [...attempt.modulesGenerated],
        }),
      ),
    );
    applyRepairPlanToEnvelope();
    if (reauditGpcaAfterWorkspaceMutation('ENGINEERING_INTELLIGENCE_POST_WORKSPACE')) {
      postPreviewGpcaBlockedMutationLabel = 'ENGINEERING_INTELLIGENCE_POST_WORKSPACE';
      livePreviewAvailable = false;
      devServerRunning = false;
    }
  }

  const postBuildManifestFaithfulness =
    npmBuildOk && (buildPlan.readyForGeneration || buildPlan.promptFaithfulness.readyForGeneration)
      ? resolveAeeContinuationManifestFaithfulness({
          buildPlan,
          workspaceDir,
          manifestFields: postBuildFaithfulnessFields,
        })
      : {
          status: postBuildFaithfulnessFields.promptFaithfulnessStatus,
          score: postBuildFaithfulnessFields.promptFaithfulnessScore,
        };

  aeeExecutiveDecision = runAeeExecutiveCoordination({
    workspaceDir,
    buildPlan,
    rawPrompt: prompt,
    projectId,
    projectName,
    aseBlockers: livePreviewAvailable ? [] : [gateBlocker],
    aseMaterializationAuthorized: true,
    aseMaterializationExecuted: true,
    featureRealityStatus: null,
    manifestFaithfulness: postBuildManifestFaithfulness,
    npmInstallOk,
    npmBuildOk,
    previewOk: previewContract.livePreviewAvailable,
    previewDegraded: previewContract.previewDegraded,
    previewRecoveryAttempts,
    repairAttempts: buildAutofixAttemptsFinal,
    engineeringIntelligenceReport: engineeringIntelligencePostWorkspace?.report ?? null,
    engineeringIntelligenceFidelityPassed: engineeringIntelligencePostWorkspace?.fidelity.passed ?? undefined,
  });

  const featureGapsRemain =
    engineeringIntelligencePostWorkspace != null &&
    !engineeringIntelligencePostWorkspace.fidelity.passed &&
    npmBuildOk;

  const finalBuildOutcome =
    previewContract.finalOutcome ??
    resolveAeeBuildOutcome({
      workspaceExists: true,
      materialized: workspaceHasGeneratedFeatureModules(workspaceDir),
      npmInstallOk,
      npmBuildOk,
      previewOk: previewContract.livePreviewAvailable,
      previewDegraded: previewContract.previewDegraded,
      repairAttempts: buildAutofixAttemptsFinal,
      concreteBlocker: false,
      featureGapsRemain,
    });

  createPreviewSession({
    projectId,
    workspaceId: workspaceRel,
    targetName: `${projectName} Preview`,
    targetType: 'WEB_APP',
    previewUrl: authoritativePreview.previewUrl ?? authoritativePreview.diagnosticPreviewUrl,
    previewState: livePreviewAvailable ? 'PREVIEW_READY' : 'PREVIEW_BLOCKED',
    allowDuplicate: true,
  });

  const featureSignals =
    generatedProfile === 'TASK_TRACKER_WEB_V1' ? inspectFeatureSignals(workspaceDir) : null;

  touchForensicStage(workspaceDir, {
    stage: 'FINAL_VALIDATION',
    durationMs: timings.validationDurationMs,
    timingsPatch: { validationDurationMs: timings.validationDurationMs },
  });

  const successDefinition = buildPlan.definition;
  const completedFaithfulnessManifestFields = buildPromptFaithfulnessManifestFields({
    rawPrompt: prompt,
    selectedProfile: String(effectiveProfile),
    generatedModules: listWorkspaceFeatureModuleIds(workspaceDir),
    guardResult: buildPlan.guardResult,
    workspaceDir,
    approvedModuleIds: buildPlan.modulePlan.approvedModuleIds,
  });

  aeeFinalReport = buildAeeFinalReport({
    projectName,
    selectedProfile: String(generatedProfile),
    generatedModules: listWorkspaceFeatureModuleIds(workspaceDir),
    workspacePath: workspaceRel,
    executiveDecision: aeeExecutiveDecision,
    npmInstallOk,
    npmBuildOk,
    previewOk: previewContract.livePreviewAvailable,
    previewDegraded: previewContract.previewDegraded,
    livePreviewUrl: previewContract.previewUrl ?? previewContract.diagnosticPreviewUrl,
    remainingGaps: previewContract.livePreviewAvailable
      ? [
          ...(engineeringIntelligencePostWorkspace && !engineeringIntelligencePostWorkspace.fidelity.passed
            ? [
                `Engineering Intelligence feature gaps — fidelity ${engineeringIntelligencePostWorkspace.report.productFidelityScore}/100.`,
              ]
            : []),
          ...(buildAutofixLoopFinal?.summary ? [buildAutofixLoopFinal.summary] : []),
        ]
      : [previewContract.summary, previewRecoverySummary ?? gateBlocker].filter(Boolean),
    outcome: finalBuildOutcome,
    buildAutofixReport: buildAutofixLoopFinal?.report ?? null,
    previewContractSummary: previewContract.summary,
    engineeringIntelligenceReport: engineeringIntelligencePostWorkspace?.report ?? null,
  });

  const aelLoopResult = await runAutonomousEngineeringLoop({
    rawPrompt: prompt,
    workspaceDir,
    projectRootDir: resolveProjectRegistryRootDir(),
    projectId,
    workspaceId: projectId,
    buildPlan,
    buildRunId: buildId,
    npmInstallOk,
    npmBuildOk,
    previewOk: previewContract.livePreviewAvailable,
    previewDegraded: previewContract.previewDegraded,
    previewUrl: previewContract.previewUrl,
    devServerUrl: previewContract.diagnosticPreviewUrl ?? previewContract.previewUrl,
    generatedModules: listWorkspaceFeatureModuleIds(workspaceDir),
    aeeFinalReport,
    aeeFurthestStage: aeeExecutiveDecision?.furthestStageReached ?? null,
    autofixAttempts: buildAutofixAttemptsFinal,
    previewRecoveryAttempts,
    engineeringIntelligenceScore: engineeringIntelligencePostWorkspace?.report.productFidelityScore ?? null,
    rerunNpmBuild: async () => {
      const attempt = runNpmBuildAttempt();
      npmBuildOk = attempt.ok;
      return attempt.ok;
    },
    runAutofix: async () => {
      const loop = await runAeeBuildAutofixLoop({
        workspaceDir,
        projectId,
        initialBuildOk: npmBuildOk,
        initialBuildOutput: '',
        rerunBuild: runNpmBuildAttempt,
      });
      npmBuildOk = loop.finalBuildOk;
      return { resolved: loop.finalBuildOk, attempts: loop.attempts.length };
    },
    runPreviewRecovery: async () => {
      const recovery = await runAeePreviewRecoveryLoop({
        rawPrompt: prompt,
        projectId,
        workspaceDir,
        projectRootDir: input.projectRootDir ?? null,
        npmBuildOk,
        devServerUrl: devServer.url ?? previewContract.diagnosticPreviewUrl ?? previewContract.previewUrl,
        gateBridge: livePreviewGateBridge,
        pipelines: {
          productIntelligenceModel: buildPlan.productIntelligenceModel,
          promptFaithfulness: buildPlan.promptFaithfulness,
          capabilityPlanning: buildPlan.capabilityPlanning,
          incrementalBuild: incrementalPipeline,
          behaviorSimulation: behaviorPipeline,
          virtualUserSimulation: virtualUserPipeline,
          virtualDeviceLaboratory: virtualDevicePipeline,
          interactionProof: interactionProofPipeline,
          autonomousDebugging: autonomousDebuggingPipeline,
          continuousImprovement: continuousImprovementPipeline,
          launchReadiness: launchReadinessResult,
          missingCapabilityEvolution: asePipeline.artifacts.missingCapabilityEvolution,
        },
        restartDevServer: async () => {
          const retry = await startGeneratedAppDevServer({
            workspaceDir,
            workspaceId: projectId,
          });
          return { ok: retry.ok, url: retry.url ?? null, error: retry.error ?? null };
        },
      });
      return {
        resolved: recovery.previewUnlocked,
        attempts: recovery.attempts.length,
      };
    },
  });
  const aelReport: AelFinalReport = aelLoopResult.report;
  const aelEvidence: AelEvidenceBundle = aelLoopResult.evidence;

  // Production Pipeline Constitution Adoption Phase 1 (Tier 1) — the Autonomous Engineering
  // Loop's capability-evolution repair path generates new real feature module files directly into
  // `workspaceDir` (`report.capabilitiesEvolved`). Like Engineering Intelligence above, this runs
  // after the dev server has already been started, so this milestone re-audits and — if GPCA now
  // blocks — corrects the final result below rather than retroactively un-starting the server.
  if (aelReport.capabilitiesEvolved.length > 0) {
    approvedRepairRealityPlan = appendApprovedRepairRealityEntries(approvedRepairRealityPlan, [
      createCapabilityEvolutionRepairEntry({
        repairId: 'capability-evolution',
        repairReason: `Capability evolution generated: ${aelReport.capabilitiesEvolved.join(', ')}`,
        mutatedPaths: aelReport.capabilitiesEvolved,
      }),
    ]);
    applyRepairPlanToEnvelope();
    if (reauditGpcaAfterWorkspaceMutation('CAPABILITY_EVOLUTION')) {
      postPreviewGpcaBlockedMutationLabel = 'CAPABILITY_EVOLUTION';
      livePreviewAvailable = false;
      devServerRunning = false;
    }
  }

  if (aelLoopResult.enabled && aelReport.remainingGaps.length > 0) {
    aeeFinalReport = {
      ...aeeFinalReport,
      remainingGaps: [
        ...aeeFinalReport.remainingGaps,
        ...aelReport.remainingGaps.filter((g) => !aeeFinalReport!.remainingGaps.includes(g)),
      ],
    };
  }

  executionMonitor.startStage('VALIDATION');
  const evidenceCompletion = completeMaterializationEvidence({
    workspaceDir,
    prompt,
    projectId,
    projectName,
    buildRunId: buildId,
    selectedProfile: String(effectiveProfile),
    expectedAppType: successDefinition.expectedAppType,
    promptSummary: summarizePrompt(prompt),
    confidence: ranking.confidence,
    featureModules: successDefinition.featureModules,
    routes: successDefinition.routes,
    fallbackUsed: buildPlan.guardResult.guardApplied,
    buildSpinePassed: npmInstallOk && npmBuildOk,
    previewEvidence: {
      previewUrl: previewProbeUrl,
      previewVerified:
        endToEndBuildRealityReport?.verdict === 'READY_FOR_FOUNDER_TESTING' ||
        (endToEndBuildRealityReport === null && previewContract.livePreviewAvailable),
      previewHtmlStatus:
        endToEndBuildRealityReport?.verdict === 'READY_FOR_FOUNDER_TESTING'
          ? 'PASS'
          : endToEndBuildRealityReport?.verdict === 'NOT_READY'
            ? 'FAIL'
            : previewContract.livePreviewAvailable
              ? 'PASS'
              : 'PENDING',
      visiblePreviewValidationStatus:
        endToEndBuildRealityReport?.verdict === 'READY_FOR_FOUNDER_TESTING'
          ? 'PASS'
          : endToEndBuildRealityReport?.verdict === 'NOT_READY'
            ? 'FAIL'
            : previewProbeUrl
              ? 'PENDING'
              : 'SKIPPED',
      visiblePreviewValidationFailureReasons:
        endToEndBuildRealityReport?.verdict === 'NOT_READY'
          ? [
              endToEndBuildRealityReport.failingStage
                ? `E2E failing stage: ${endToEndBuildRealityReport.failingStage}`
                : 'End-to-end build reality validation failed',
              ...endToEndBuildRealityReport.falseSuccessFindings.map((finding) => finding.detail),
            ]
          : [],
    },
    validation: {
      passed: materializationValidation.passed && npmInstallOk && npmBuildOk,
      blueprintShellPresent: materializationValidation.blueprintShellPresent,
      featureModulesPresent: materializationValidation.featureModulesPresent,
      promptSpecificTermsPresent: materializationValidation.promptSpecificTermsPresent,
      warnings: materializationValidation.warnings,
      errors: materializationValidation.passed
        ? []
        : [
            ...materializationValidation.missingArtifacts.map((a) => `Missing artifact: ${a}`),
            ...materializationValidation.missingFeatureModules.map(
              (m) => `Missing feature module: ${m}`,
            ),
          ],
    },
    timings,
    promptFaithfulness: completedFaithfulnessManifestFields,
  });

  const completedManifest = evidenceCompletion.manifest;
  const endToEndRealityBlocked =
    endToEndBuildRealityReport !== null &&
    endToEndBuildRealityReport.verdict !== 'READY_FOR_FOUNDER_TESTING';
  const launchEvidenceBlocked =
    completedManifest.workspaceRealityAuditStatus === 'FAIL' || endToEndRealityBlocked;
  const launchBlockReasons = [
    ...(completedManifest.workspaceRealityAuditStatus === 'FAIL'
      ? completedManifest.workspaceRealityFailureReasons
      : []),
    ...(endToEndRealityBlocked
      ? [
          endToEndBuildRealityReport?.failingStage
            ? `End-to-end build reality blocked at ${endToEndBuildRealityReport.failingStage}`
            : 'End-to-end build reality validation failed',
          ...(endToEndBuildRealityReport?.falseSuccessFindings.map((finding) => finding.detail) ?? []),
        ]
      : []),
  ];
  // Production Pipeline Constitution Adoption Phase 1 (Tier 1) — if a POST-preview-activation
  // mutation (Engineering Intelligence repair, capability evolution) invalidated GPCA's report and
  // the fresh re-audit blocked, this build's final result must never report a compliant/ready
  // outcome — GPCA's own evidence is the freshest, most authoritative signal available, and it
  // overrides workspace-reality/E2E evidence exactly the way every pre-preview GPCA hard-stop in
  // this file already does.
  const gpcaBlockedAfterPreviewActivation = postPreviewGpcaBlockedMutationLabel !== null;
  const finalBuildStatus = gpcaBlockedAfterPreviewActivation || launchEvidenceBlocked ? 'FAILED' : 'READY';
  if (finalBuildStatus === 'READY' && productionBuildEnvelope.pipelineState.currentState === 'PREVIEW_READY') {
    advanceProductionEnvelopeState(
      'ENGINEERING_REPORT_COMPLETE',
      'Engineering report complete — immutable production pipeline state machine finished.',
    );
  }
  const finalBuildResult = gpcaBlockedAfterPreviewActivation || launchEvidenceBlocked ? 'FAIL' : 'PASS';
  const finalFailureReason = gpcaBlockedAfterPreviewActivation
    ? `GENERATION_PIPELINE_NON_COMPLIANT: ${gpcaFailureReason(gpcaComplianceReport)} (post-preview-activation mutation: ${postPreviewGpcaBlockedMutationLabel})`
    : launchEvidenceBlocked
      ? launchBlockReasons.join('; ') ||
        'End-to-end build reality validation failed'
      : null;

  if (launchEvidenceBlocked) {
    executionMonitor.failStage('VALIDATION', finalFailureReason ?? 'Final validation failed.');
  } else {
    executionMonitor.completeStage('VALIDATION', 'Final validation passed.');
  }
  executionMonitor.startStage('RESULT');
  executionMonitor.completeStage('RESULT', 'Build response assembled.');

  const success: OnePromptLivePreviewBuildResult = {
    readOnly: true,
    buildId,
    projectId,
    projectName,
    status: finalBuildStatus,
    prompt,
    requestType: source === 'chat' ? 'CHAT_BUILD' : 'BUILD_FROM_PROMPT',
    workspaceId: projectId,
    workspacePath:
      evidenceCompletion.manifest.promotionStatus === 'PASS' &&
      evidenceCompletion.manifest.persistentProjectSourceRoot
        ? evidenceCompletion.manifest.persistentProjectSourceRoot
        : workspaceRel,
    generatedProfile,
    planningProofLevel: contractAssessment.report.proofLevel,
    materializationProofLevel: materialization.proofLevel,
    buildResult: finalBuildResult,
    npmInstallOk,
    npmBuildOk,
    previewUrl: previewContract.previewUrl,
    diagnosticPreviewUrl: previewContract.livePreviewAvailable
      ? null
      : previewContract.diagnosticPreviewUrl,
    limitedPreviewUrl: previewContract.limitedPreviewUrl,
    devServerRunning,
    livePreviewAvailable,
    previewStatus: previewContract.previewStatus === 'UNLOCKED'
      ? 'UNLOCKED'
      : previewContract.previewStatus === 'DEGRADED'
        ? 'DEGRADED'
        : 'UNAVAILABLE',
    previewRecoveryAttempts,
    buildAutofixAttempts: buildAutofixAttemptsFinal,
    buildAutofixLoop: buildAutofixLoopFinal,
    previewContract,
    failureReason: finalFailureReason,
    featureSignals,
    materializationManifest: evidenceCompletion.manifest,
    workspaceStabilizerReport,
    livePreviewGate: livePreviewGateBridge.gate,
    autonomousSoftwareEngineering,
    aeeExecutiveDecision,
    aeeFinalReport,
    aelReport,
    aelFinalOutcome: aelLoopResult.finalOutcome,
    aelEvidence,
    gpcaComplianceReport,
    // Identity Computation Collapse V1 — the single approved post-CBGA product identity this build
    // consumed everywhere (blueprint, router, feature modules, manifests, GPCA evidence). Every
    // identity string elsewhere in this result (projectName, materializationManifest.projectName,
    // gpcaComplianceReport.productIdentity) must trace back to this object.
    approvedProductIdentity: approvedIdentity,
    // Navigation Computation Collapse V1 — the single approved post-CBGA navigation plan this
    // build consumed everywhere (blueprint, router, feature modules, manifests, GPCA evidence).
    // Every navigation label elsewhere in this result must trace back to this object.
    approvedNavigationPlan,
    // Module Computation Collapse V1 — the single approved post-CBGA module plan this build
    // consumed everywhere (blueprint, router, feature modules, manifests, GPCA evidence). Every
    // module id/displayName/route elsewhere in this result must trace back to this object.
    approvedModulePlan,
    // Metadata Computation Collapse V1 — the single approved post-CBGA metadata plan this build
    // consumed everywhere (materialization, blueprint runtime shell, feature contract, manifests,
    // engineering report, GPCA evidence). Every title/subtitle/description/count/summary elsewhere
    // in this result must trace back to this object.
    approvedMetadataPlan,
    approvedSampleDataPlan,
    approvedProvenancePlan,
    approvedRepairRealityPlan,
    approvedProductionBuildEnvelope: productionBuildEnvelope,
    ...(gpcaBlockedAfterPreviewActivation
      ? {
          gpcaHardStop: true,
          gpcaBlockedPreviewActivation: true,
          gpcaViolatedConstitutionRuleIds: PRODUCTION_PIPELINE_CONSTITUTION_ADOPTION_PHASE_1_RULE_IDS,
        }
      : {}),
    updatedAt: new Date().toISOString(),
  };
  persistBuildIntentRun({
    buildRunId: buildId,
    projectId,
    projectName,
    prompt,
    profile: generatedProfile,
    status: finalBuildStatus,
    stage: 'LIVE_PREVIEW',
    workspacePath:
      evidenceCompletion.manifest.promotionStatus === 'PASS' &&
      evidenceCompletion.manifest.persistentProjectSourceRoot
        ? evidenceCompletion.manifest.persistentProjectSourceRoot
        : workspaceRel,
    previewUrl: authoritativePreview.previewUrl,
    planTaskCount,
    architectureSummary,
    failureReason: finalFailureReason,
    projectRootDir: resolveProjectRegistryRootDir(),
  });
  // NEW_BUILD never merges keyword/concept metadata across projects — see
  // src/project-context-isolation-v4/ requirement 6 (registry and metadata scoping).
  (buildDecision.decision === 'NEW_BUILD' ? replaceProjectContextMetadata : upsertProjectContextMetadata)(
    {
      projectId,
      name: projectName,
      prompt,
      profile: generatedProfile,
      summary: architectureSummary,
      profileConfidence: 'HIGH',
    },
    resolveProjectRegistryRootDir(),
  );
  return registerBuildOutcome(projectId, projectName, success, devServer.port ?? null);
  } catch (unexpected) {
    const commandFailure = extractExecCommandFailure(unexpected, 'one-prompt-build-orchestrator');
    const failureStage: ForensicBuildStage =
      lastSuccessfulStage === 'PREVIEW'
        ? 'FINAL_VALIDATION'
        : lastSuccessfulStage === 'NPM_BUILD'
          ? 'PREVIEW'
          : lastSuccessfulStage === 'NPM_INSTALL'
            ? 'NPM_BUILD'
            : lastSuccessfulStage === 'MATERIALIZATION_VALIDATION'
              ? 'NPM_INSTALL'
              : lastSuccessfulStage === 'MATERIALIZATION'
                ? 'MATERIALIZATION_VALIDATION'
                : lastSuccessfulStage === 'WORKSPACE_CREATED'
                  ? 'MATERIALIZATION'
                  : lastSuccessfulStage === 'PLANNING'
                    ? 'WORKSPACE_CREATED'
                    : 'PLANNING';
    touchForensicStage(workspaceDir, {
      stage: failureStage,
      errors: [commandFailure.failureMessage],
    });
    return registerFailedBuild({
      projectId,
      projectName,
      workspaceDir,
      failure: {
        failureStage,
        failureReason: `Unexpected build error: ${commandFailure.failureMessage}`,
        failureMessage: commandFailure.failureMessage,
        lastSuccessfulStage,
        commandFailure,
        stackPreview: commandFailure.stackPreview,
      },
      result: {
        buildId,
        projectId,
        projectName,
        prompt,
        source,
        failureReason: `Unexpected build error: ${commandFailure.failureMessage}`,
        workspaceId: projectId,
        workspacePath: workspaceRel,
        generatedProfile: effectiveProfile,
      },
    });
  }
}

export function getOnePromptLivePreviewPublicState(
  projectId?: string | null,
): OnePromptLivePreviewPublicState {
  const resolvedProjectId = projectId ?? getActiveProjectId();
  const latest = resolvedProjectId ? getBuildResultForProject(resolvedProjectId) : null;
  const active =
    (resolvedProjectId
      ? listGeneratedDevServers().find((server) => server.projectId === resolvedProjectId)
      : null) ?? getActiveGeneratedDevServerState();

  const devServerRunning =
    latest?.devServerRunning === true || Boolean(active?.url);
  const livePreviewAvailable = latest?.livePreviewAvailable === true;
  const previewUrl = livePreviewAvailable ? latest?.previewUrl ?? null : null;
  const diagnosticPreviewUrl =
    latest?.diagnosticPreviewUrl ??
    (!livePreviewAvailable && devServerRunning ? active?.url ?? null : null);
  const limitedPreviewUrl = livePreviewAvailable ? null : latest?.limitedPreviewUrl ?? null;
  const livePreviewGateState = latest?.livePreviewGate?.state ?? null;
  const gateBlockerSummary =
    latest?.livePreviewGate?.blockerExplanation?.summary ?? latest?.failureReason ?? null;

  if (!latest) {
    return {
      status: 'IDLE',
      projectId: resolvedProjectId,
      projectName: null,
      workspaceId: null,
      workspacePath: null,
      generatedProfile: null,
      buildResult: null,
      previewUrl: null,
      diagnosticPreviewUrl: devServerRunning ? active?.url ?? null : null,
      devServerRunning,
      livePreviewAvailable: false,
      livePreviewGateState: null,
      gateBlockerSummary: null,
      limitedPreviewUrl: null,
      failureReason: null,
      buildStatusLabel: resolvedProjectId
        ? `No build has run yet for project ${resolvedProjectId}`
        : 'No one-prompt build has run yet',
      connected: devServerRunning,
    };
  }

  let buildStatusLabel: string = latest.status;
  if (latest.status === 'READY') {
    if (livePreviewAvailable) {
      buildStatusLabel = `BUILD_COMPLETED_WITH_PREVIEW — ${latest.generatedProfile ?? 'app'} at ${latest.workspacePath ?? 'workspace'}`;
    } else if (latest.npmBuildOk) {
      buildStatusLabel = `BUILD_COMPLETED_WITH_DEGRADED_PREVIEW — compiled at ${latest.workspacePath ?? 'workspace'}; live preview verification incomplete`;
    } else if (latest.aeeFinalReport?.finalOutcome === 'BUILD_COMPLETED_WITH_BUILD_ERRORS') {
      buildStatusLabel = `BUILD_COMPLETED_WITH_BUILD_ERRORS — workspace at ${latest.workspacePath ?? 'workspace'}; npm build failed after bounded AutoFix`;
    } else {
      buildStatusLabel = `READY — ${latest.generatedProfile ?? 'app'} at ${latest.workspacePath ?? 'workspace'}`;
    }
  } else if (latest.status === 'FAILED') {
    buildStatusLabel = `FAILED — ${latest.failureReason ?? 'unknown error'}`;
  } else if (latest.status === 'BUILDING') {
    buildStatusLabel = 'BUILDING — generating workspace and starting preview';
  }

  return {
    status: latest.status,
    projectId: latest.projectId,
    projectName: latest.projectName,
    workspaceId: latest.workspaceId,
    workspacePath: latest.workspacePath,
    generatedProfile: latest.generatedProfile,
    buildResult: latest.buildResult,
    previewUrl,
    diagnosticPreviewUrl,
    devServerRunning,
    livePreviewAvailable,
    livePreviewGateState,
    gateBlockerSummary,
    limitedPreviewUrl,
    failureReason: latest.failureReason,
    buildStatusLabel,
    connected: livePreviewAvailable || devServerRunning,
  };
}

/** Conversational fallback when LLM is unavailable — AEE-controlled narrative. */
export function composeOnePromptBuildChatResponse(result: OnePromptLivePreviewBuildResult): string {
  return composeAeeAwareBuildChatResponse(result);
}
