/**
 * Project State Sync + Real AEE Preview Recovery Path V1 — validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  evaluateAeeExecutiveDecision,
  resolveAeeBuildOutcome,
  AEE_PREVIEW_RECOVERY_MAX_ATTEMPTS,
} from '../src/autonomous-engineering-executive/index.js';
import { composeAeeAwareBuildChatResponse } from '../src/autonomous-engineering-executive/aee-production-response.js';
import {
  applyRegistryPayloadToProjectState,
  PROJECT_STATE_AEE_RECOVERY_REAL_PATH_V1_PASS_TOKEN,
  shouldClearActiveProjectAfterDelete,
} from '../src/project-state-sync-v1/index.js';
import { resolvePromptFaithfulBuildPlan } from '../src/prompt-faithful-generation/index.js';
import { resolvePromptBoundedModulePlan } from '../src/prompt-bounded-materialization/index.js';
import type { OnePromptLivePreviewBuildResult } from '../src/one-prompt-live-preview/one-prompt-live-preview-types.js';

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

const results: Check[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readRoot(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

async function main(): Promise<void> {
  console.log('');
  console.log('Project State + AEE Recovery Real Path V1 — Validation');
  console.log('======================================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const appJs = readRoot('public/founder-reality/app.js');
  const orchestrator = readRoot('src/one-prompt-live-preview/one-prompt-build-orchestrator.ts');
  const decisionEngine = readRoot('src/autonomous-engineering-executive/aee-decision-engine.ts');

  assert(
    '01. package script registered',
    Boolean(pkg.scripts?.['validate:project-state-and-aee-recovery-real-path']),
    'script',
  );
  assert(
    '02. project state sync authority module',
    existsSync(join(ROOT, 'src/project-state-sync-v1/project-state-sync-authority.ts')),
    'module',
  );

  const deleteClears = shouldClearActiveProjectAfterDelete({
    deletedProjectId: 'proj-a',
    previousActiveProjectId: 'proj-a',
    nextActiveProjectId: null,
  });
  assert('03. delete active project clears selection', deleteClears, 'should clear');

  const afterDelete = applyRegistryPayloadToProjectState({
    previous: {
      readOnly: true,
      activeProjectId: 'proj-a',
      projects: [{ projectId: 'proj-a', name: 'Deleted Project' }],
      multiProjectWorkspaces: [
        {
          projectId: 'proj-a',
          projectName: 'Deleted Project',
          active: true,
          buildStatus: 'IDLE',
          workspacePath: null,
          previewUrl: null,
        },
      ],
      hydrationState: 'ready',
    },
    payload: {
      activeProjectId: null,
      projects: { items: [] },
    },
  });
  assert('04. registry delete clears activeProjectId', afterDelete.activeProjectId === null, String(afterDelete.activeProjectId));
  assert(
    '05. registry delete clears workspace chips',
    afterDelete.multiProjectWorkspaces.length === 0,
    String(afterDelete.multiProjectWorkspaces.length),
  );
  assert('06. registry delete hydration empty', afterDelete.hydrationState === 'empty', afterDelete.hydrationState);

  const afterCreate = applyRegistryPayloadToProjectState({
    previous: {
      readOnly: true,
      activeProjectId: null,
      projects: [],
      multiProjectWorkspaces: [],
      hydrationState: 'empty',
    },
    payload: {
      activeProjectId: 'proj-new',
      projects: {
        items: [{ projectId: 'proj-new', name: 'Fresh Project', status: 'ACTIVE' }],
      },
    },
  });
  assert(
    '07. new project syncs activeProjectId',
    afterCreate.activeProjectId === 'proj-new',
    String(afterCreate.activeProjectId),
  );
  assert(
    '08. new project appears in Command Center chips',
    afterCreate.multiProjectWorkspaces.some((chip) => chip.projectId === 'proj-new'),
    afterCreate.multiProjectWorkspaces.map((c) => c.projectId).join(','),
  );
  assert(
    '09. stale deleted project not in chips',
    !afterCreate.multiProjectWorkspaces.some((chip) => chip.projectId === 'proj-a'),
    'stale chip removed',
  );

  assert('10. app.js clearActiveProjectClientState', appJs.includes('function clearActiveProjectClientState'), 'function');
  assert(
    '11. app.js rebuildMultiProjectWorkspacesFromRegistry',
    appJs.includes('function rebuildMultiProjectWorkspacesFromRegistry'),
    'function',
  );
  assert(
    '12. app.js resolveActiveProjectIdFromRegistry',
    appJs.includes('function resolveActiveProjectIdFromRegistry'),
    'function',
  );
  assert(
    '13. app.js empty tabs not default project placeholder',
    appJs.includes('No projects — create one from Projects'),
    'empty state',
  );
  assert(
    '14. app.js delete response clears via applyProjectRegistryResponse',
    appJs.includes('payload.deleted === true'),
    'delete branch',
  );

  assert(
    '15. orchestrator re-runs AEE after preview recovery',
    orchestrator.includes('previewRecoveryAttempts') &&
      orchestrator.includes('runAeeExecutiveCoordination') &&
      orchestrator.includes('resolveAeeBuildOutcome'),
    'post-recovery coordination',
  );
  assert(
    '16. orchestrator stores previewStatus separately',
    orchestrator.includes("previewStatus: livePreviewAvailable ? 'UNLOCKED'"),
    'previewStatus',
  );
  assert(
    '17. orchestrator passes finalBuildOutcome to report',
    orchestrator.includes('outcome: finalBuildOutcome'),
    'final outcome',
  );

  const habitPrompt =
    'Build a habit tracker with daily streaks, routines, and progress charts. No login required.';
  const buildPlan = resolvePromptFaithfulBuildPlan(habitPrompt);
  const modulePlan = resolvePromptBoundedModulePlan({
    rawPrompt: habitPrompt,
    materializationProfile: buildPlan.materializationProfile,
    extraction: buildPlan.extraction,
    profileDefinition: buildPlan.definition,
    productIntelligenceModel: buildPlan.productIntelligenceModel,
    capabilityPlanning: buildPlan.capabilityPlanning,
    guardApplied: buildPlan.guardResult.guardApplied,
  });

  assert(
    '18. auth not injected without explicit request',
    !modulePlan.approvedModuleIds.includes('auth'),
    modulePlan.approvedModuleIds.join(','),
  );
  assert(
    '19. filter not injected without prompt evidence',
    !modulePlan.approvedModuleIds.includes('filter'),
    modulePlan.approvedModuleIds.join(','),
  );
  assert(
    '20. export not injected without prompt evidence',
    !modulePlan.approvedModuleIds.includes('export'),
    modulePlan.approvedModuleIds.join(','),
  );

  const preRecoveryDecision = evaluateAeeExecutiveDecision({
    workspaceDir: join(ROOT, '.generated-builder-workspaces', 'aee-real-path-validation'),
    buildPlan,
    rawPrompt: habitPrompt,
    projectId: 'aee-real-path-validation',
    projectName: 'Habit Tracker Validation',
    aseBlockers: ['Live Preview Gate blocked preview unlock.'],
    aseMaterializationAuthorized: true,
    manifestFaithfulness: { status: 'PASS', score: 90 },
    generatedFileCount: 32,
    npmInstallOk: true,
    npmBuildOk: true,
    previewOk: false,
    previewDegraded: true,
    previewRecoveryAttempts: 0,
  });
  assert(
    '21. AEE REPAIR before recovery attempts',
    preRecoveryDecision.decision === 'REPAIR',
    preRecoveryDecision.decision,
  );
  assert(
    '22. AEE does not STOP before recovery attempts',
    preRecoveryDecision.decision !== 'STOP',
    preRecoveryDecision.decision,
  );

  const postRecoveryDecision = evaluateAeeExecutiveDecision({
    workspaceDir: join(ROOT, '.generated-builder-workspaces', 'aee-real-path-validation'),
    buildPlan,
    rawPrompt: habitPrompt,
    projectId: 'aee-real-path-validation',
    projectName: 'Habit Tracker Validation',
    aseBlockers: ['Live Preview Gate blocked preview unlock.'],
    aseMaterializationAuthorized: true,
    manifestFaithfulness: { status: 'PASS', score: 90 },
    generatedFileCount: 32,
    npmInstallOk: true,
    npmBuildOk: true,
    previewOk: false,
    previewDegraded: true,
    previewRecoveryAttempts: AEE_PREVIEW_RECOVERY_MAX_ATTEMPTS,
  });
  assert(
    '23. AEE forward decision after bounded recovery with degraded preview',
    postRecoveryDecision.decision === 'CONTINUE' || postRecoveryDecision.decision === 'PREVIEW',
    postRecoveryDecision.decision,
  );
  assert(
    '24. AEE does not STOP after bounded recovery exhausted',
    postRecoveryDecision.decision !== 'STOP',
    postRecoveryDecision.decision,
  );

  const degradedOutcome = resolveAeeBuildOutcome({
    workspaceExists: true,
    materialized: true,
    npmInstallOk: true,
    npmBuildOk: true,
    previewOk: false,
    previewDegraded: true,
    repairAttempts: AEE_PREVIEW_RECOVERY_MAX_ATTEMPTS,
    concreteBlocker: false,
  });
  assert(
    '25. degraded preview outcome BUILD_COMPLETED_WITH_DEGRADED_PREVIEW',
    degradedOutcome === 'BUILD_COMPLETED_WITH_DEGRADED_PREVIEW',
    degradedOutcome,
  );

  const degradedBuildResult: OnePromptLivePreviewBuildResult = {
    readOnly: true,
    buildId: 'build-degraded',
    projectId: 'proj-degraded',
    projectName: 'Degraded Preview App',
    status: 'READY',
    prompt: habitPrompt,
    requestType: 'BUILD_FROM_PROMPT',
    workspaceId: 'proj-degraded',
    workspacePath: '.generated-builder-workspaces/proj-degraded',
    generatedProfile: 'GENERIC_CUSTOM_APP_V1',
    planningProofLevel: 'L1',
    materializationProofLevel: 'L1',
    buildResult: 'PASS',
    npmInstallOk: true,
    npmBuildOk: true,
    previewUrl: null,
    diagnosticPreviewUrl: 'http://127.0.0.1:5173',
    limitedPreviewUrl: null,
    devServerRunning: true,
    livePreviewAvailable: false,
    previewStatus: 'DEGRADED',
    previewRecoveryAttempts: AEE_PREVIEW_RECOVERY_MAX_ATTEMPTS,
    failureReason: null,
    featureSignals: null,
    materializationManifest: null,
    livePreviewGate: null,
    autonomousSoftwareEngineering: null,
    aeeExecutiveDecision: postRecoveryDecision,
    aeeFinalReport: {
      readOnly: true,
      projectName: 'Degraded Preview App',
      selectedProfile: 'GENERIC_CUSTOM_APP_V1',
      generatedModules: ['habits'],
      workspacePath: '.generated-builder-workspaces/proj-degraded',
      buildSpineStageReached: 'PREVIEWING',
      finalDecision: 'CONTINUE',
      finalOutcome: degradedOutcome,
      evidenceProvidersConsulted: [],
      blockersOverridden: [],
      blockersRespected: [],
      repairAttempts: 0,
      retryAttempts: 0,
      previewRecoveryAttempts: AEE_PREVIEW_RECOVERY_MAX_ATTEMPTS,
      npmInstallResult: 'PASS',
      npmBuildResult: 'PASS',
      previewResult: 'DEGRADED',
      livePreviewUrl: 'http://127.0.0.1:5173',
      remainingGaps: [],
      overrideEvents: [],
      recordedAt: new Date().toISOString(),
    },
    updatedAt: new Date().toISOString(),
  };
  const chatResponse = composeAeeAwareBuildChatResponse(degradedBuildResult);
  assert(
    '26. chat response does not ask manual Autonomous Debugging',
    !/run autonomous debugging/i.test(chatResponse),
    chatResponse.slice(0, 120),
  );
  assert(
    '27. chat response mentions automatic recovery',
    /bounded preview recovery|automatic preview recovery/i.test(chatResponse),
    chatResponse.slice(0, 120),
  );

  assert(
    '28. decision engine degraded completion branch',
    decisionEngine.includes('preview is degraded after bounded recovery'),
    'branch present',
  );
  assert(
    '29. no LISA hardcoding in project state sync',
    !readRoot('src/project-state-sync-v1/project-state-sync-authority.ts').includes('LISA'),
    'generic',
  );

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  for (const r of results) {
    console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.name} — ${r.detail}`);
  }
  console.log('');
  console.log(`${passed}/${total} checks passed`);
  if (passed === total) {
    console.log(PROJECT_STATE_AEE_RECOVERY_REAL_PATH_V1_PASS_TOKEN);
    process.exit(0);
  }
  process.exit(1);
}

void main();
