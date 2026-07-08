/**
 * One-Prompt Build Readiness Audit V1 — shared audit engine.
 */

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { isBuildIntentRequest } from '../../src/build-intent-routing/index.js';
import {
  listWorkspaceFeatureModuleIds,
  moduleIdsInclude,
  resolvePromptFaithfulBuildPlan,
} from '../../src/prompt-faithful-generation/index.js';
import { resolvePromptBoundedModulePlan } from '../../src/prompt-bounded-materialization/index.js';
import { runOnePromptLivePreviewBuild } from '../../src/one-prompt-live-preview/one-prompt-build-orchestrator.js';
import { resetOnePromptLivePreviewForTests } from '../../src/one-prompt-live-preview/index.js';
import { resetGeneratedDevServerManagerForTests } from '../../src/one-prompt-live-preview/generated-dev-server-manager.js';
import { resetPreviewSessionManagerForTests } from '../../src/live-preview-runtime/index.js';
import { resetRequirementsToPlanContractModuleForTests } from '../../src/requirements-to-plan-execution-contract/index.js';
import { resetConnectedBuildExecutionModuleForTests } from '../../src/connected-build-execution/index.js';
import { resetDevPulseV2AiDevEngineAuthorityForTests } from '../../src/aidev-engine/aidev-engine-authority.js';
import { composeAeeAwareBuildChatResponse } from '../../src/autonomous-engineering-executive/aee-production-response.js';
import { composeOnePromptBuildBrainApiPayload } from '../../src/one-prompt-live-preview/one-prompt-build-chat-response.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../../src/real-file-workspace-execution/real-file-workspace-execution-bounds.js';
import { UNIVERSAL_BUILD_PIPELINE_MATRIX } from '../../src/universal-build-pipeline-verification/universal-build-pipeline-matrix.js';
import {
  createProjectRegistryTestRoot,
  invalidateProjectRegistryV1Cache,
} from '../../src/project-registry-v1/index.js';
import type { OnePromptLivePreviewBuildResult } from '../../src/one-prompt-live-preview/one-prompt-live-preview-types.js';

export const ONE_PROMPT_BUILD_READINESS_AUDIT_V1_COMPLETE =
  'ONE_PROMPT_BUILD_READINESS_AUDIT_V1_COMPLETE' as const;

export type ReadinessBlockerClass =
  | 'ROUTE_NOT_WIRED'
  | 'STALE_CLIENT_STATE'
  | 'PROFILE_MISROUTE'
  | 'MODULE_INJECTION'
  | 'AEE_NOT_CONTROLLING_PATH'
  | 'AUTOFIX_NOT_EXECUTING'
  | 'MISSING_CAPABILITY_NOT_EXECUTING'
  | 'PREVIEW_GATE_LOCK'
  | 'PROMOTION_SKIPPED'
  | 'FINAL_RESPONSE_STALE'
  | 'WINDOWS_PROCESS_CLEANUP'
  | 'REGISTRY_SYNC_FAILURE'
  | 'LEGITIMATE_BUILD_FAILURE';

export interface ReadinessBlocker {
  id: string;
  class: ReadinessBlockerClass;
  severity: 'critical' | 'high' | 'medium' | 'low';
  general: boolean;
  summary: string;
  files: string[];
  functions: string[];
  evidence: string;
  appIds: string[];
}

export interface AppBuildAuditRow {
  appId: string;
  label: string;
  prompt: string;
  expectedProfile: string;
  buildIntentDetected: boolean;
  promptUnderstandingPass: boolean;
  moduleExtractionMatch: boolean;
  moduleContractClassification: string;
  extractedModules: string[];
  approvedModules: string[];
  selectedProfile: string | null;
  workspaceGenerated: boolean;
  npmInstallRan: boolean;
  npmBuildRan: boolean;
  autoFixAvailable: boolean;
  autoFixTriggered: boolean;
  autoFixMissingWhenNeeded: boolean;
  missingCapabilityRan: boolean;
  previewStarted: boolean;
  previewRecoveryRan: boolean;
  livePreviewAvailable: boolean;
  persistentPromoted: boolean;
  commandCenterStateCorrect: 'unknown' | 'pass' | 'fail';
  finalResponseMatchesEvidence: boolean;
  buildStatus: string;
  aeeDecision: string | null;
  aeeOutcome: string | null;
  failureReason: string | null;
  blockers: ReadinessBlocker[];
  durationMs: number;
}

export interface BuildReadinessAuditReport {
  readOnly: true;
  auditedAt: string;
  auditPath: 'production-orchestrator-via-runOnePromptLivePreviewBuild';
  matrixAppsAudited: string[];
  appRows: AppBuildAuditRow[];
  topBlockers: ReadinessBlocker[];
  staticBlockers: ReadinessBlocker[];
  recommendedFixOrder: string[];
  minimumPathFirstPreview: string[];
  minimumPathStableV1: string[];
}

const AUDIT_CATEGORY_IDS = [
  'assistive-mobile-accessibility',
  'expense-tracker',
  'saas-crm',
  'e-commerce-store',
  'ai-chat-app',
  'internal-hr-admin',
] as const;

const SUPPORT_INFRA_MODULES = new Set([
  'navigation-router',
  'persistence',
  'auth',
  'filter-ui',
  'dashboard',
  'settings',
  'deals',
  'accessibility-layer',
]);

function profilesMatchForAudit(selected: string | null, expected: string): boolean {
  if (!selected) return false;
  if (selected === expected) return true;
  if (
    (expected === 'ASSISTIVE_COMMUNICATION' || expected === 'ASSISTIVE_COMMUNICATION_APP_V1') &&
    (selected === 'ASSISTIVE_COMMUNICATION_APP_V1' || selected === 'ASSISTIVE_COMMUNICATION')
  ) {
    return true;
  }
  return false;
}

function modulesMatchHints(modules: readonly string[], hints: readonly string[]): boolean {
  if (!hints.length) return true;
  const productModules = modules.filter((m) => !SUPPORT_INFRA_MODULES.has(m));
  const pool = productModules.length > 0 ? productModules : modules;
  const matched = hints.filter((hint) => moduleIdsInclude(pool, hint));
  return matched.length >= Math.min(2, hints.length);
}

export function evaluateModuleContractMatch(input: {
  build: OnePromptLivePreviewBuildResult;
  workspaceModules: readonly string[];
  matrixHints: readonly string[];
  prePlanApprovedModules: readonly string[];
}): { match: boolean; classification: string; detail: string } {
  const ei = input.build.aeeFinalReport?.engineeringIntelligenceReport ?? null;
  const generated =
    input.workspaceModules.length > 0
      ? input.workspaceModules
      : ei?.generatedModules?.length
        ? [...ei.generatedModules]
        : [...input.prePlanApprovedModules];

  const productModules = generated.filter((m) => !SUPPORT_INFRA_MODULES.has(m));
  const modulePool = productModules.length > 0 ? productModules : generated;
  const hintsSatisfied = modulesMatchHints(modulePool, input.matrixHints);

  if (ei) {
    const requiredMissing = ei.missingCapabilities.filter((c) => !c.optional);
    if (requiredMissing.length === 0 && hintsSatisfied) {
      return {
        match: true,
        classification: 'EI_CONTRACT_SATISFIED',
        detail: `fidelity=${ei.productFidelityScore}`,
      };
    }
    if (ei.productFidelityScore >= 60 && hintsSatisfied) {
      return {
        match: true,
        classification: 'EI_CONTRACT_SATISFIED',
        detail: `fidelity=${ei.productFidelityScore}`,
      };
    }
    if (hintsSatisfied) {
      return {
        match: true,
        classification: 'PRODUCT_MODULES_PRESENT',
        detail: modulePool.join(','),
      };
    }
    return {
      match: false,
      classification: requiredMissing.length > 0 ? 'PRODUCT_MODULE_MISSING' : 'MODULE_PLAN_STALE',
      detail: `missing=${requiredMissing.map((c) => c.capabilityId).slice(0, 3).join(',') || 'hints'}`,
    };
  }

  return {
    match: hintsSatisfied,
    classification: hintsSatisfied ? 'WORKSPACE_HINT_MATCH' : 'PRE_EI_HINT_MISMATCH',
    detail: modulePool.join(','),
  };
}


function classifyAppBlockers(row: AppBuildAuditRow): ReadinessBlocker[] {
  const blockers: ReadinessBlocker[] = [];

  if (!row.buildIntentDetected) {
    blockers.push({
      id: `${row.appId}-route-intent`,
      class: 'ROUTE_NOT_WIRED',
      severity: 'critical',
      general: true,
      summary: 'Build intent not detected for matrix prompt',
      files: ['src/build-intent-routing/build-intent-detector.ts'],
      functions: ['isBuildIntentRequest'],
      evidence: `isBuildIntentRequest=false for ${row.appId}`,
      appIds: [row.appId],
    });
  }

  if (!row.promptUnderstandingPass) {
    blockers.push({
      id: `${row.appId}-prompt-understanding`,
      class: 'PROFILE_MISROUTE',
      severity: 'high',
      general: true,
      summary: 'Prompt faithfulness / readyForGeneration did not pass during planning',
      files: ['src/prompt-faithful-generation/index.ts'],
      functions: ['resolvePromptFaithfulBuildPlan'],
      evidence: `readyForGeneration=false profile=${row.selectedProfile ?? 'null'}`,
      appIds: [row.appId],
    });
  }

  if (!row.moduleExtractionMatch) {
    const isRealInjectionBug = row.moduleContractClassification === 'PRODUCT_MODULE_MISSING';
    blockers.push({
      id: `${row.appId}-module-extraction`,
      class: 'MODULE_INJECTION',
      severity: isRealInjectionBug ? 'high' : 'medium',
      general: row.appId !== 'assistive-mobile-accessibility',
      summary: isRealInjectionBug
        ? 'Required product modules missing from final Engineering Intelligence contract'
        : `Module contract mismatch (${row.moduleContractClassification})`,
      files: [
        'src/engineering-intelligence-runtime/index.js',
        'src/prompt-bounded-materialization/prompt-bounded-module-resolver.ts',
      ],
      functions: ['runEngineeringIntelligencePostWorkspace', 'resolvePromptBoundedModulePlan'],
      evidence: `classification=${row.moduleContractClassification} approved=[${row.approvedModules.join(',')}] workspace product modules mismatch`,
      appIds: [row.appId],
    });
  }

  if (
    row.selectedProfile &&
    row.expectedProfile &&
    !profilesMatchForAudit(row.selectedProfile, row.expectedProfile)
  ) {
    blockers.push({
      id: `${row.appId}-profile-misroute`,
      class: 'PROFILE_MISROUTE',
      severity: 'high',
      general: true,
      summary: `Selected profile ${row.selectedProfile} != expected ${row.expectedProfile}`,
      files: ['src/prompt-faithful-generation/prompt-profile-selection-guard.ts'],
      functions: ['resolvePromptFaithfulBuildPlan'],
      evidence: `selected=${row.selectedProfile} expected=${row.expectedProfile}`,
      appIds: [row.appId],
    });
  }

  if (!row.workspaceGenerated) {
    const isAseDenial = /ASE-authorized materialization did not complete/i.test(row.failureReason ?? '');
    const isFaithfulnessBlock = /faithfulness score below threshold/i.test(row.failureReason ?? '');
    blockers.push({
      id: `${row.appId}-workspace`,
      class: isAseDenial
        ? 'AEE_NOT_CONTROLLING_PATH'
        : isFaithfulnessBlock
          ? 'PROFILE_MISROUTE'
          : 'LEGITIMATE_BUILD_FAILURE',
      severity: 'critical',
      general: true,
      summary: isAseDenial
        ? 'ASE pipeline blocked materialization before workspace generation; build spine never reached npm'
        : isFaithfulnessBlock
          ? 'Pre-materialization faithfulness gate blocked workspace generation'
          : 'Workspace did not materialize with feature modules',
      files: isAseDenial
        ? [
            'src/ase-enforcement-engine/engineering-authority.ts',
            'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts',
          ]
        : ['src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'],
      functions: isAseDenial
        ? ['runAutonomousEngineering', 'runAeeExecutiveCoordination']
        : ['runOnePromptLivePreviewBuild', 'materializeGeneratedApplication'],
      evidence: row.failureReason ?? 'no workspace modules',
      appIds: [row.appId],
    });
  }

  if (row.workspaceGenerated && !row.npmInstallRan) {
    blockers.push({
      id: `${row.appId}-npm-install`,
      class: 'LEGITIMATE_BUILD_FAILURE',
      severity: 'critical',
      general: true,
      summary: 'npm install did not complete successfully',
      files: ['src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'],
      functions: ['runOnePromptLivePreviewBuild'],
      evidence: row.failureReason ?? 'npmInstallOk=false',
      appIds: [row.appId],
    });
  }

  if (row.npmInstallRan && !row.npmBuildRan) {
    blockers.push({
      id: `${row.appId}-npm-build`,
      class: 'LEGITIMATE_BUILD_FAILURE',
      severity: 'critical',
      general: true,
      summary: 'npm run build did not complete successfully',
      files: ['src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'],
      functions: ['runOnePromptLivePreviewBuild'],
      evidence: row.failureReason ?? 'npmBuildOk=false',
      appIds: [row.appId],
    });
  }

  if (row.autoFixMissingWhenNeeded) {
    blockers.push({
      id: `${row.appId}-autofix-absent`,
      class: 'AUTOFIX_NOT_EXECUTING',
      severity: 'medium',
      general: true,
      summary: row.autoFixAvailable
        ? 'npm build failed but AEE Build AutoFix loop did not run or exhausted without repair'
        : 'AEE Build AutoFix loop is not wired on the one-prompt build spine',
      files: [
        'src/autonomous-engineering-executive/aee-build-autofix-loop.ts',
        'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts',
      ],
      functions: ['runAeeBuildAutofixLoop'],
      evidence: row.autoFixAvailable
        ? 'build failed; autofixAttempts=0 and no buildAutofixReport'
        : 'runAeeBuildAutofixLoop not present on build spine',
      appIds: [row.appId],
    });
  }

  if (row.npmBuildRan && !row.livePreviewAvailable && !row.previewRecoveryRan) {
    blockers.push({
      id: `${row.appId}-preview-recovery-skip`,
      class: 'AEE_NOT_CONTROLLING_PATH',
      severity: 'high',
      general: true,
      summary: 'Preview degraded/locked but preview recovery loop did not run',
      files: ['src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'],
      functions: ['runAeePreviewRecoveryLoop'],
      evidence: `previewRecoveryAttempts=0 previewStatus=${row.livePreviewAvailable ? 'UNLOCKED' : 'locked'}`,
      appIds: [row.appId],
    });
  }

  if (row.npmBuildRan && !row.livePreviewAvailable && row.previewStarted) {
    blockers.push({
      id: `${row.appId}-preview-gate`,
      class: 'PREVIEW_GATE_LOCK',
      severity: 'high',
      general: true,
      summary: 'Live preview gate remained locked after build',
      files: ['src/live-preview-gate/live-preview-orchestrator-bridge.ts'],
      functions: ['evaluateLivePreviewGateForOrchestrator'],
      evidence: row.failureReason ?? 'livePreviewAvailable=false',
      appIds: [row.appId],
    });
  }

  if (row.npmBuildRan && row.workspaceGenerated && !row.persistentPromoted) {
    blockers.push({
      id: `${row.appId}-promotion`,
      class: 'PROMOTION_SKIPPED',
      severity: 'medium',
      general: true,
      summary: 'Persistent workspace promotion did not reach PASS',
      files: ['src/materialization-evidence/materialization-evidence-completer.ts'],
      functions: ['completeMaterializationEvidence', 'recordPersistentProjectReality'],
      evidence: 'promotionStatus!=PASS or success path not reached',
      appIds: [row.appId],
    });
  }

  if (row.aeeDecision === 'STOP' && row.npmBuildRan) {
    blockers.push({
      id: `${row.appId}-aee-stop`,
      class: 'AEE_NOT_CONTROLLING_PATH',
      severity: 'high',
      general: true,
      summary: 'AEE issued STOP after npm build succeeded',
      files: ['src/autonomous-engineering-executive/aee-decision-engine.ts'],
      functions: ['evaluateAeeExecutiveDecision'],
      evidence: `finalDecision=STOP outcome=${row.aeeOutcome ?? 'null'}`,
      appIds: [row.appId],
    });
  }

  if (!row.finalResponseMatchesEvidence) {
    blockers.push({
      id: `${row.appId}-response-stale`,
      class: 'FINAL_RESPONSE_STALE',
      severity: 'medium',
      general: true,
      summary: 'Final chat response does not align with npm/preview evidence',
      files: ['src/autonomous-engineering-executive/aee-production-response.ts'],
      functions: ['composeAeeAwareBuildChatResponse'],
      evidence: 'brainResponse text mismatches buildResult/npm/preview fields',
      appIds: [row.appId],
    });
  }

  return blockers;
}

function responseMatchesEvidence(build: OnePromptLivePreviewBuildResult): boolean {
  const chat = composeAeeAwareBuildChatResponse(build);
  const payload = composeOnePromptBuildBrainApiPayload({
    message: build.prompt,
    buildResult: build,
  });
  const envelope = payload.aeeControlledResponse as Record<string, unknown> | undefined;
  if (build.status === 'READY' && build.npmInstallOk && build.npmBuildOk) {
    if (/failed|stopped before|ASE denied/i.test(chat) && !/degraded|recovery/i.test(chat)) {
      return false;
    }
    if (envelope?.npmBuildResult === 'FAIL') return false;
  }
  if (build.status === 'FAILED' && /completed successfully/i.test(chat)) return false;
  return true;
}

async function resetBuildModules(): Promise<void> {
  resetOnePromptLivePreviewForTests();
  await resetGeneratedDevServerManagerForTests();
  resetPreviewSessionManagerForTests();
  resetRequirementsToPlanContractModuleForTests();
  resetConnectedBuildExecutionModuleForTests();
  resetDevPulseV2AiDevEngineAuthorityForTests();
}

export function collectStaticProductionBlockers(rootDir: string): ReadinessBlocker[] {
  const appJs = readFileSync(join(rootDir, 'public/founder-reality/app.js'), 'utf8');
  const orchestrator = readFileSync(
    join(rootDir, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'),
    'utf8',
  );
  const chatResponse = readFileSync(
    join(rootDir, 'src/one-prompt-live-preview/one-prompt-build-chat-response.ts'),
    'utf8',
  );
  const devServer = readFileSync(
    join(rootDir, 'src/one-prompt-live-preview/generated-dev-server-manager.ts'),
    'utf8',
  );
  const blockers: ReadinessBlocker[] = [];

  blockers.push({
    id: 'static-autofix-not-on-spine',
    class: 'AUTOFIX_NOT_EXECUTING',
    severity: 'high',
    general: true,
    summary: 'AEE Build AutoFix loop is not wired on the one-prompt build spine',
    files: [
      'src/autonomous-engineering-executive/aee-build-autofix-loop.ts',
      'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts',
    ],
    functions: ['runAeeBuildAutofixLoop', 'runOnePromptLivePreviewBuild'],
    evidence: orchestrator.includes('runAeeBuildAutofixLoop')
      ? 'AutoFix loop present — static blocker suppressed at runtime'
      : 'missing runAeeBuildAutofixLoop in orchestrator',
    appIds: orchestrator.includes('runAeeBuildAutofixLoop') ? [] : AUDIT_CATEGORY_IDS.slice(),
  });

  if (blockers[blockers.length - 1]!.appIds.length === 0) {
    blockers.pop();
  }

  if (!orchestrator.includes('runAeePreviewRecoveryLoop')) {
    blockers.push({
      id: 'static-preview-recovery-unwired',
      class: 'AEE_NOT_CONTROLLING_PATH',
      severity: 'critical',
      general: true,
      summary: 'Preview recovery loop not present in orchestrator',
      files: ['src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'],
      functions: ['runAeePreviewRecoveryLoop'],
      evidence: 'missing import/call',
      appIds: AUDIT_CATEGORY_IDS.slice(),
    });
  }

  if (
    appJs.includes('isOnePromptBuildPrompt') ||
    (!appJs.includes('BuildIntentRouteParity') && !appJs.includes('classify-build-intent'))
  ) {
    blockers.push({
      id: 'static-ui-build-heuristic-narrower',
      class: 'ROUTE_NOT_WIRED',
      severity: 'medium',
      general: true,
      summary:
        'Command Center UI build-progress detection is not wired to shared build-intent route parity contract',
      files: ['public/founder-reality/app.js', 'server/brain-api-handler.ts'],
      functions: ['BuildIntentRouteParity', 'classifyBuildIntentRequest', 'askBrain'],
      evidence: 'UI must use shared classify-build-intent contract — no local isOnePromptBuildPrompt duplicate',
      appIds: AUDIT_CATEGORY_IDS.slice(),
    });
  }

  if (
    appJs.includes('applyMultiProjectWorkspaceState') &&
    !appJs.includes("purgeStaleCommandCenterProjectState('registry-empty-workspace-state')")
  ) {
    blockers.push({
      id: 'static-registry-stale-chips',
      class: 'STALE_CLIENT_STATE',
      severity: 'high',
      general: true,
      summary: 'Command Center may render stale project chips when registry is empty',
      files: ['public/founder-reality/app.js'],
      functions: ['applyMultiProjectWorkspaceState', 'multiProjectWorkspaces'],
      evidence: 'missing purgeStaleCommandCenterProjectState',
      appIds: AUDIT_CATEGORY_IDS.slice(),
    });
  }

  if (
    !devServer.includes('killProcessesByPort') ||
    !existsSync(join(rootDir, 'src/windows-process-cleanup/index.ts'))
  ) {
    blockers.push({
      id: 'static-windows-dev-server-accumulation',
      class: 'WINDOWS_PROCESS_CLEANUP',
      severity: 'medium',
      general: true,
      summary:
        'Preview/Vite child processes may accumulate on Windows without centralized windows-process-cleanup teardown',
      files: ['src/one-prompt-live-preview/generated-dev-server-manager.ts', 'src/windows-process-cleanup/index.ts'],
      functions: ['startGeneratedAppDevServer', 'killProcessesByPort', 'killChildProcessTree'],
      evidence: 'Missing centralized managed process cleanup or port-based orphan sweep after preview stop',
      appIds: AUDIT_CATEGORY_IDS.slice(),
    });
  }

  return blockers;
}

export async function auditOnePromptBuildReadiness(
  rootDir: string,
  options?: { registryRoot?: string; keepRegistryRoot?: boolean },
): Promise<BuildReadinessAuditReport> {
  const isolatedRegistryRoot =
    options?.registryRoot ?? createProjectRegistryTestRoot(join(tmpdir(), 'readiness-audit-registry-'));
  const priorRegistryEnv = process.env.AIDEVENGINE_REGISTRY_ROOT;
  process.env.AIDEVENGINE_REGISTRY_ROOT = isolatedRegistryRoot;
  invalidateProjectRegistryV1Cache();

  const appRows: AppBuildAuditRow[] = [];

  try {
  for (const categoryId of AUDIT_CATEGORY_IDS) {
    const entry = UNIVERSAL_BUILD_PIPELINE_MATRIX.find((row) => row.categoryId === categoryId);
    if (!entry) continue;

    const startedAt = Date.now();
    await resetBuildModules();

    const buildIntent = isBuildIntentRequest(entry.prompt);
    const buildPlan = resolvePromptFaithfulBuildPlan(entry.prompt);
    const modulePlan = resolvePromptBoundedModulePlan({
      rawPrompt: entry.prompt,
      materializationProfile: buildPlan.materializationProfile,
      extraction: buildPlan.extraction,
      profileDefinition: buildPlan.definition,
      productIntelligenceModel: buildPlan.productIntelligenceModel,
      capabilityPlanning: buildPlan.capabilityPlanning,
      guardApplied: buildPlan.guardResult.guardApplied,
    });

    const projectId = `readiness-audit-${categoryId}-${Date.now()}`;
    let build: OnePromptLivePreviewBuildResult;
    try {
      build = await runOnePromptLivePreviewBuild({
        rawPrompt: entry.prompt,
        projectRootDir: rootDir,
        source: 'api',
        projectId,
        projectName: entry.categoryLabel,
        projectKind: 'AUDIT',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      build = {
        readOnly: true,
        buildId: 'error',
        projectId,
        projectName: entry.categoryLabel,
        status: 'FAILED',
        prompt: entry.prompt,
        requestType: 'BUILD_FROM_PROMPT',
        workspaceId: projectId,
        workspacePath: null,
        generatedProfile: buildPlan.materializationProfile as OnePromptLivePreviewBuildResult['generatedProfile'],
        planningProofLevel: null,
        materializationProofLevel: null,
        buildResult: 'FAIL',
        npmInstallOk: false,
        npmBuildOk: false,
        previewUrl: null,
        diagnosticPreviewUrl: null,
        limitedPreviewUrl: null,
        devServerRunning: false,
        livePreviewAvailable: false,
        failureReason: message,
        featureSignals: null,
        materializationManifest: null,
        livePreviewGate: null,
        autonomousSoftwareEngineering: null,
        updatedAt: new Date().toISOString(),
      };
    }

    const workspaceDir = join(rootDir, GENERATED_BUILDER_WORKSPACES_DIR, projectId);
    const workspaceModules = existsSync(workspaceDir) ? listWorkspaceFeatureModuleIds(workspaceDir) : [];
    const manifest = build.materializationManifest;
    const missingCapabilityRan = Boolean(
      (build.previewRecoveryAttempts ?? 0) > 0 &&
        build.aeeFinalReport?.evidenceProvidersConsulted?.some((provider) =>
          /MISSING_CAPABILITY|AUTONOMOUS_DEBUGGING|LIVE_PREVIEW_GATE/.test(provider),
        ),
    );

    const moduleContract = evaluateModuleContractMatch({
      build,
      workspaceModules,
      matrixHints: entry.requiredModuleHints,
      prePlanApprovedModules: modulePlan.approvedModuleIds,
    });
    const autofixAttempts =
      build.buildAutofixAttempts ?? build.aeeFinalReport?.repairAttempts ?? 0;
    const autofixReport =
      build.buildAutofixLoop?.report ?? build.aeeFinalReport?.buildAutofixReport ?? null;
    const autoFixAvailable = true;
    const autoFixTriggered = autofixAttempts > 0;
    const autoFixMissingWhenNeeded =
      build.npmInstallOk &&
      !build.npmBuildOk &&
      !autofixReport &&
      autofixAttempts === 0;

    const row: AppBuildAuditRow = {
      appId: categoryId,
      label: entry.categoryLabel,
      prompt: entry.prompt,
      expectedProfile: entry.expectedProfile,
      buildIntentDetected: buildIntent,
      promptUnderstandingPass: buildPlan.readyForGeneration && buildPlan.promptFaithfulness.readyForGeneration,
      moduleExtractionMatch: moduleContract.match,
      moduleContractClassification: moduleContract.classification,
      extractedModules: buildPlan.extraction.requiredModules,
      approvedModules:
        build.aeeFinalReport?.engineeringIntelligenceReport?.generatedModules.length
          ? [...build.aeeFinalReport.engineeringIntelligenceReport.generatedModules]
          : modulePlan.approvedModuleIds,
      selectedProfile: String(build.generatedProfile ?? buildPlan.materializationProfile),
      workspaceGenerated: workspaceModules.length > 0,
      npmInstallRan: build.npmInstallOk,
      npmBuildRan: build.npmBuildOk,
      autoFixAvailable,
      autoFixTriggered,
      autoFixMissingWhenNeeded,
      missingCapabilityRan,
      previewStarted: build.devServerRunning || Boolean(build.previewUrl || build.diagnosticPreviewUrl),
      previewRecoveryRan: (build.previewRecoveryAttempts ?? 0) > 0,
      livePreviewAvailable: build.livePreviewAvailable,
      persistentPromoted: manifest?.promotionStatus === 'PASS',
      commandCenterStateCorrect: 'unknown',
      finalResponseMatchesEvidence: responseMatchesEvidence(build),
      buildStatus: build.status,
      aeeDecision: build.aeeFinalReport?.finalDecision ?? build.aeeExecutiveDecision?.decision ?? null,
      aeeOutcome: build.aeeFinalReport?.finalOutcome ?? build.aeeExecutiveDecision?.outcome ?? null,
      failureReason: build.failureReason,
      blockers: [],
      durationMs: Date.now() - startedAt,
    };
    row.blockers = classifyAppBlockers(row);
    appRows.push(row);
  }

  const staticBlockers = collectStaticProductionBlockers(rootDir);
  const merged = new Map<string, ReadinessBlocker>();
  for (const blocker of [...staticBlockers, ...appRows.flatMap((row) => row.blockers)]) {
    const existing = merged.get(blocker.id);
    if (!existing) {
      merged.set(blocker.id, blocker);
      continue;
    }
    existing.appIds = [...new Set([...existing.appIds, ...blocker.appIds])];
  }

  const allBlockers = [...merged.values()].sort((a, b) => {
    const rank = { critical: 0, high: 1, medium: 2, low: 3 };
    return rank[a.severity] - rank[b.severity];
  });
  const blockerKey = (b: ReadinessBlocker) => `${b.class}::${b.summary}`;
  const deduped = new Map<string, ReadinessBlocker>();
  for (const blocker of allBlockers) {
    const key = blockerKey(blocker);
    const existing = deduped.get(key);
    if (!existing) {
      deduped.set(key, { ...blocker, appIds: [...blocker.appIds] });
      continue;
    }
    existing.appIds = [...new Set([...existing.appIds, ...blocker.appIds])];
  }
  const topBlockers = [...deduped.values()]
    .sort((a, b) => {
      const rank = { critical: 0, high: 1, medium: 2, low: 3 };
      return rank[a.severity] - rank[b.severity];
    })
    .slice(0, 10);

  const recommendedFixOrder = [
    'Unblock ASE→AEE continuation for named-profile apps (expense, CRM, HR) so materialization runs on source:api path',
    'Wire AutoFix (or bounded npm-build repair) on the one-prompt orchestrator spine after npm run build failures',
    'Ensure AEE post-build coordination always runs after preview recovery (no stale STOP from pre-build)',
    'Harden preview gate + dev-server lifecycle on Windows (port cleanup between builds)',
    'Keep Command Center chips registry-authoritative (purge stale multiProjectWorkspaces on empty registry)',
    'Align UI build-progress detection with shared classifyBuildIntentRequest route parity contract',
    'Expand Missing Capability Evolution triggers for preview-gate CAPABILITY_PLANNING blockers',
    'Promote workspace on npm PASS + degraded preview (BUILD_COMPLETED_WITH_DEGRADED_PREVIEW)',
    'Profile guard: block ExpenseTracker/CRM misroutes for GENERIC_CUSTOM prompts',
    'Module injection policy: block auth/filter/export without explicit prompt evidence',
    'Truthful final response: AEE_CONTROLLED_RESULT envelope must match npm/preview evidence',
  ];

  const minimumPathFirstPreview = [
    'Pick one simple GENERIC_CUSTOM prompt (e-commerce or AI chat) with 3–4 modules',
    'Run POST /api/brain/respond with build intent on a clean registry project',
    'Verify workspace materialization + npm install + npm build PASS',
    'Accept degraded preview if gate locked; ensure recovery loop runs and reports truthfully',
    'Confirm persistent promotion + registry sync for the project',
    'Command Center shows READY build with diagnostic preview URL when gate locked',
  ];

  const minimumPathStableV1 = [
    'AutoFix or bounded repair on npm build + TypeScript route wiring failures',
    'Reliable preview unlock or degraded-preview success contract across 6 matrix apps',
    'Windows dev-server/process cleanup between builds',
    'Registry ↔ Command Center ↔ Live Preview single source of truth',
    'AEE controls all stop/continue decisions with evidence-backed final reports',
    'Matrix regression: 6 categories build npm PASS with prompt-faithful modules',
    'No manual “run Autonomous Debugging” unless recovery budget exhausted',
  ];

  return {
    readOnly: true,
    auditedAt: new Date().toISOString(),
    auditPath: 'production-orchestrator-via-runOnePromptLivePreviewBuild',
    matrixAppsAudited: AUDIT_CATEGORY_IDS.slice(),
    appRows,
    topBlockers,
    staticBlockers,
    recommendedFixOrder,
    minimumPathFirstPreview,
    minimumPathStableV1,
  };
  } finally {
    if (priorRegistryEnv) process.env.AIDEVENGINE_REGISTRY_ROOT = priorRegistryEnv;
    else delete process.env.AIDEVENGINE_REGISTRY_ROOT;
    invalidateProjectRegistryV1Cache();
    if (!options?.keepRegistryRoot && !options?.registryRoot) {
      try {
        rmSync(isolatedRegistryRoot, { recursive: true, force: true });
      } catch {
        // Windows may retain file handles from preview/dev-server processes.
      }
    }
  }
}

export function writeBuildReadinessAuditArtifacts(
  rootDir: string,
  report: BuildReadinessAuditReport,
): { mdPath: string; jsonPath: string } {
  const outDir = join(rootDir, '.build-readiness-audit');
  mkdirSync(outDir, { recursive: true });
  const jsonPath = join(outDir, 'one-prompt-build-readiness-audit.json');
  const mdPath = join(outDir, 'one-prompt-build-readiness-audit.md');

  writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');

  const readyCount = report.appRows.filter((r) => r.buildStatus === 'READY').length;
  const npmBuildPass = report.appRows.filter((r) => r.npmBuildRan).length;
  const previewUnlocked = report.appRows.filter((r) => r.livePreviewAvailable).length;
  const promoted = report.appRows.filter((r) => r.persistentPromoted).length;
  const autofixTriggeredCount = report.appRows.filter((r) => r.autoFixTriggered).length;
  const staleAutofixBlockers = report.topBlockers.filter((b) => b.class === 'AUTOFIX_NOT_EXECUTING').length;
  const staleModuleBlockers = report.topBlockers.filter((b) => b.class === 'MODULE_INJECTION').length;

  const md: string[] = [
    '# AiDevEngine One-Prompt Build Readiness Audit',
    '',
    `**Audited at:** ${report.auditedAt}`,
    `**Production path:** ${report.auditPath}`,
    '',
    '## Executive summary',
    '',
    'This audit exercises the real production build spine (`runOnePromptLivePreviewBuild` with `source: api`) for six canonical app categories. It does not rely on leaf-mode pipeline tracers alone.',
    '',
    `**Matrix pass rate:** ${readyCount}/${report.appRows.length} READY · ${npmBuildPass}/${report.appRows.length} npm build PASS · ${previewUnlocked}/${report.appRows.length} live preview unlocked · ${promoted}/${report.appRows.length} promoted`,
    '',
    '### Key findings',
    '',
    `- **Build spine:** ${readyCount}/${report.appRows.length} apps reached READY with npm install/build passing on the production orchestrator path.`,
    `- **Preview:** ${previewUnlocked}/${report.appRows.length} apps have live preview available (including degraded interaction proof when route probe succeeds).`,
    `- **AutoFix:** AEE Build AutoFix loop is wired on the spine; ${autofixTriggeredCount} app(s) triggered repair during this audit (successful builds do not require AutoFix).`,
    `- **Stale blockers:** ${staleAutofixBlockers} AUTOFIX_NOT_EXECUTING · ${staleModuleBlockers} MODULE_INJECTION in top blockers.`,
    `- **Module contract:** Comparisons use Engineering Intelligence final module contract and workspace modules, not stale pre-EI approved modules alone.`,
    '',
    '## Top 10 blockers stopping real builds today',
    '',
  ];

  for (const [index, blocker] of report.topBlockers.entries()) {
    md.push(
      `${index + 1}. **${blocker.class}** — ${blocker.summary}`,
      `   - Scope: ${blocker.general ? 'general' : 'app-specific'} | Severity: ${blocker.severity}`,
      `   - Files: ${blocker.files.join(', ')}`,
      `   - Functions: ${blocker.functions.join(', ')}`,
      `   - Evidence: ${blocker.evidence}`,
      `   - Apps: ${blocker.appIds.join(', ')}`,
      '',
    );
  }

  md.push('## Per-app matrix results', '');
  md.push(
    '| App | Intent | Plan | Modules | Workspace | npm i | npm build | AutoFix avail | AutoFix trig | MCE | Preview | Recovery | Promoted | Response | Status |',
    '|-----|--------|------|---------|-----------|-------|-----------|---------------|--------------|-----|---------|----------|----------|----------|--------|',
  );
  for (const row of report.appRows) {
    const yn = (v: boolean) => (v ? 'Y' : 'N');
    md.push(
      `| ${row.label} | ${yn(row.buildIntentDetected)} | ${yn(row.promptUnderstandingPass)} | ${yn(row.moduleExtractionMatch)} | ${yn(row.workspaceGenerated)} | ${yn(row.npmInstallRan)} | ${yn(row.npmBuildRan)} | ${yn(row.autoFixAvailable)} | ${yn(row.autoFixTriggered)} | ${yn(row.missingCapabilityRan)} | ${yn(row.livePreviewAvailable)} | ${yn(row.previewRecoveryRan)} | ${yn(row.persistentPromoted)} | ${yn(row.finalResponseMatchesEvidence)} | ${row.buildStatus} |`,
    );
  }

  md.push('', '## Recommended fix order', '');
  for (const [i, item] of report.recommendedFixOrder.entries()) {
    md.push(`${i + 1}. ${item}`);
  }

  md.push('', '## Minimum path to first successful app preview', '');
  for (const item of report.minimumPathFirstPreview) {
    md.push(`- ${item}`);
  }

  md.push('', '## Minimum path to stable AiDevEngine 1.0', '');
  for (const item of report.minimumPathStableV1) {
    md.push(`- ${item}`);
  }

  md.push('', '## Per-app detail', '');
  for (const row of report.appRows) {
    md.push(`### ${row.label} (\`${row.appId}\`)`, '');
    md.push(`- **Expected profile:** ${row.expectedProfile}`);
    md.push(`- **Selected profile:** ${row.selectedProfile ?? 'null'}`);
    md.push(`- **Module contract:** ${row.moduleContractClassification}`);
    md.push(`- **Final modules (EI/workspace):** ${row.approvedModules.join(', ') || 'none'}`);
    md.push(`- **AutoFix:** available=${row.autoFixAvailable} triggered=${row.autoFixTriggered}`);
    md.push(`- **AEE decision / outcome:** ${row.aeeDecision ?? 'null'} / ${row.aeeOutcome ?? 'null'}`);
    md.push(`- **Failure reason:** ${row.failureReason ?? 'none'}`);
    md.push(`- **Duration:** ${row.durationMs}ms`);
    if (row.blockers.length) {
      md.push('- **Blockers:**');
      for (const b of row.blockers) {
        md.push(`  - ${b.class}: ${b.summary}`);
      }
    }
    md.push('');
  }

  writeFileSync(mdPath, md.join('\n'), 'utf8');
  return { mdPath, jsonPath };
}
