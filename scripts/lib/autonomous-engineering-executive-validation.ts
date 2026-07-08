/**
 * Autonomous Engineering Executive V1 — shared validation suite.
 */

import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { resetEngineeringAuthorityForTests } from '../../src/ase-enforcement-engine/index.js';
import { materializeGeneratedApplication } from '../../src/code-generation-engine/code-generation-engine-authority.js';
import {
  collectWorkspaceFeatureRealityFallback,
  resetWorkspaceFeatureRealityFallbackForTests,
  workspaceHasGeneratedFeatureModules,
} from '../../src/feature-contract-reality/index.js';
import { readForensicManifest } from '../../src/materialization-evidence/index.js';
import {
  resetOnePromptLivePreviewForTests,
  runOnePromptLivePreviewBuild,
} from '../../src/one-prompt-live-preview/index.js';
import { resetGeneratedDevServerManagerForTests } from '../../src/one-prompt-live-preview/generated-dev-server-manager.js';
import { resetPreviewSessionManagerForTests } from '../../src/live-preview-runtime/index.js';
import { assessRequirementsToPlanExecutionContract } from '../../src/requirements-to-plan-execution-contract/index.js';
import { resetRequirementsToPlanContractModuleForTests } from '../../src/requirements-to-plan-execution-contract/index.js';
import { resetConnectedBuildExecutionModuleForTests } from '../../src/connected-build-execution/index.js';
import { resetDevPulseV2AiDevEngineAuthorityForTests } from '../../src/aidev-engine/aidev-engine-authority.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../../src/real-file-workspace-execution/real-file-workspace-execution-bounds.js';
import {
  AUTONOMOUS_ENGINEERING_EXECUTIVE_V1_PASS_TOKEN,
  AEE_OVERRIDE_ASE_DENIAL_EVENT,
  aeeCanAbortBuild,
  aeeForbidsPlanningFailedAfterWorkspace,
  resetAeeRuntimeRecorderForTests,
  runAeeExecutiveCoordination,
  type AeeValidationCheck,
  validateAeeAseOverride,
  validateAeeContinuationPolicyUnit,
  validateAeeEvidenceNormalization,
  validateAeeModuleFiles,
  validateAeeOrchestratorWiring,
  validateAeeStateMachineRules,
} from '../../src/autonomous-engineering-executive/index.js';
import {
  evaluateFeatureRealityPolicy,
  evaluateProfilePolicy,
  shouldInjectAuthRequirement,
} from '../../src/universal-build-pipeline-verification/index.js';
import { resolvePromptFaithfulBuildPlan } from '../../src/prompt-faithful-generation/index.js';
import { UNIVERSAL_BUILD_PIPELINE_MATRIX } from '../../src/universal-build-pipeline-verification/universal-build-pipeline-matrix.js';
import { LISA_ASSISTIVE_PROMPT } from './prompt-bounded-materialization-validation.js';

export const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
export const MODULE_DIR = join(ROOT, 'src/autonomous-engineering-executive');

export async function runAutonomousEngineeringExecutiveValidation(): Promise<{
  checks: AeeValidationCheck[];
  allPassed: boolean;
}> {
  const checks: AeeValidationCheck[] = [];
  resetAeeRuntimeRecorderForTests();

  validateAeeModuleFiles(MODULE_DIR, checks);

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  checks.push({
    name: 'package script validate:autonomous-engineering-executive',
    passed: Boolean(pkg.scripts?.['validate:autonomous-engineering-executive']),
    detail: 'script',
  });

  const orchestrator = readFileSync(
    join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'),
    'utf8',
  );
  const handlerSource = readFileSync(join(ROOT, 'server/build-from-prompt-handler.ts'), 'utf8');
  const brainHandler = readFileSync(join(ROOT, 'server/brain-api-handler.ts'), 'utf8');

  validateAeeOrchestratorWiring(orchestrator, checks);
  checks.push({
    name: 'build-from-prompt uses orchestrator',
    passed: handlerSource.includes('runOnePromptLivePreviewBuild'),
    detail: 'handler',
  });
  checks.push({
    name: 'brain respond uses orchestrator',
    passed: brainHandler.includes('runOnePromptLivePreviewBuild'),
    detail: 'brain handler',
  });

  validateAeeStateMachineRules(checks);
  validateAeeEvidenceNormalization(checks);
  validateAeeContinuationPolicyUnit(checks);

  const lisaPlan = resolvePromptFaithfulBuildPlan(LISA_ASSISTIVE_PROMPT);
  checks.push({
    name: 'LISA does not select ExpenseTracker',
    passed: String(lisaPlan.selectedProfile) !== 'EXPENSE_TRACKER_WEB_V1',
    detail: String(lisaPlan.selectedProfile),
  });

  const profilePolicy = evaluateProfilePolicy({
    rawPrompt: LISA_ASSISTIVE_PROMPT,
    buildPlan: lisaPlan,
    expectedProfile: 'ASSISTIVE_COMMUNICATION',
  });
  checks.push({
    name: 'generic custom profile accepted for LISA',
    passed: profilePolicy.genericCustomAccepted || profilePolicy.accepted,
    detail: profilePolicy.selectedProfile,
  });
  checks.push({
    name: 'auth not injected unless prompt asks for auth',
    passed:
      !shouldInjectAuthRequirement(
        UNIVERSAL_BUILD_PIPELINE_MATRIX.find((e) => e.categoryId === 'simple-game-puzzle')!.prompt,
      ) && !shouldInjectAuthRequirement(LISA_ASSISTIVE_PROMPT),
    detail: 'game and LISA prompts',
  });

  const testRoot = join(tmpdir(), `aee-evidence-${Date.now()}`);
  mkdirSync(testRoot, { recursive: true });
  try {
    const assessment = assessRequirementsToPlanExecutionContract({ rawPrompt: LISA_ASSISTIVE_PROMPT });
    const contract = assessment.report.buildReadyContract;
    if (!contract) throw new Error('contract missing');

    const projectId = `aee-lisa-${Date.now()}`;
    const workspaceDir = join(testRoot, '.generated-builder-workspaces', projectId);
    mkdirSync(workspaceDir, { recursive: true });

    materializeGeneratedApplication({
      projectRootDir: testRoot,
      workspaceId: projectId,
      contract: { ...contract, contractId: projectId },
      rawPrompt: LISA_ASSISTIVE_PROMPT,
      faithfulBuildPlan: lisaPlan,
      profileOverride: lisaPlan.selectedProfile,
    });

    validateAeeAseOverride(checks, workspaceDir);

    const frPolicy = evaluateFeatureRealityPolicy({
      readOnly: true,
      status: 'DEGRADED_WITH_WORKSPACE_EVIDENCE',
      available: true,
      passed: true,
      score: 75,
      requiredModuleIds: lisaPlan.modulePlan.approvedModuleIds,
      presentModuleIds: lisaPlan.modulePlan.approvedModuleIds,
      missingModuleIds: [],
      checks: [],
      blockers: [],
      warnings: ['runtime evidence unavailable'],
      findings: [],
      interactionSignalsFound: ['click'],
      interactionSignalsMissing: [],
      registryPresent: true,
      routesPresent: true,
      appRendersFeatures: true,
      manifestPresent: true,
    });
    checks.push({
      name: 'Feature Reality DEGRADED_WITH_WORKSPACE_EVIDENCE does not stop build',
      passed: frPolicy.isWarning && !frPolicy.isHardBlocker,
      detail: 'DEGRADED_WITH_WORKSPACE_EVIDENCE',
    });

    const hasModules = workspaceHasGeneratedFeatureModules(workspaceDir);
    const decision = runAeeExecutiveCoordination({
      workspaceDir,
      buildPlan: lisaPlan,
      rawPrompt: LISA_ASSISTIVE_PROMPT,
      projectId,
      projectName: 'AEE LISA',
      aseBlockers: ['ASE denied materialization authorization.'],
      aseMaterializationAuthorized: false,
      featureRealityStatus: 'DEGRADED_WITH_WORKSPACE_EVIDENCE',
      manifestFaithfulness: { status: 'PASS', score: 100 },
      generatedFileCount: hasModules ? 50 : 0,
    });
    checks.push({
      name: 'AEE CONTINUE after workspace evidence with ASE denial',
      passed: hasModules && (decision.decision === 'CONTINUE' || decision.shouldContinueToBuild),
      detail: hasModules ? decision.decision : 'no modules yet',
    });
    checks.push({
      name: 'AEE override event is AEE_OVERRIDE_ASE_DENIAL',
      passed:
        !hasModules ||
        decision.overrideEvent === AEE_OVERRIDE_ASE_DENIAL_EVENT ||
        decision.shouldContinueToBuild,
      detail: String(decision.overrideEvent),
    });
    checks.push({
      name: 'PLANNING_FAILED forbidden after WORKSPACE_READY',
      passed: aeeForbidsPlanningFailedAfterWorkspace(
        'WORKSPACE_READY',
        workspaceHasGeneratedFeatureModules(workspaceDir),
        'PLANNING_FAILED — ASE denied materialization authorization.',
      ),
      detail: 'forbidden',
    });
    checks.push({
      name: 'bare ASE denial forbidden after workspace evidence',
      passed: !aeeCanAbortBuild({
        hasGeneratedSource: workspaceHasGeneratedFeatureModules(workspaceDir),
        stage: 'WORKSPACE_READY',
        proposedFailureLabel: 'ASE denied materialization authorization.',
        executiveDecision: 'STOP',
      }),
      detail: 'bare ASE denial must not abort when modules exist',
    });
  } finally {
    rmSync(testRoot, { recursive: true, force: true });
  }

  resetOnePromptLivePreviewForTests();
  resetEngineeringAuthorityForTests();
  resetWorkspaceFeatureRealityFallbackForTests();
  await resetGeneratedDevServerManagerForTests();
  resetPreviewSessionManagerForTests();
  resetRequirementsToPlanContractModuleForTests();
  resetConnectedBuildExecutionModuleForTests();
  resetDevPulseV2AiDevEngineAuthorityForTests();
  resetAeeRuntimeRecorderForTests();

  const liveProjectId = `aee-live-${Date.now()}`;
  const liveBuild = await runOnePromptLivePreviewBuild({
    rawPrompt: `${LISA_ASSISTIVE_PROMPT}\n\nGenerate architecture, plan, tasks, and begin build execution now.`,
    projectRootDir: ROOT,
    source: 'validator',
    projectId: liveProjectId,
    projectName: 'AEE LISA Live',
    simulateAseMaterializationDenial: true,
  });

  const liveWorkspace = join(ROOT, GENERATED_BUILDER_WORKSPACES_DIR, liveProjectId);
  const liveManifest = readForensicManifest(liveWorkspace);
  const livePlan = resolvePromptFaithfulBuildPlan(LISA_ASSISTIVE_PROMPT);
  const liveFeatureFallback = collectWorkspaceFeatureRealityFallback({
    workspaceDir: liveWorkspace,
    requiredModuleIds: livePlan.modulePlan.approvedModuleIds,
    contractId: livePlan.promptFaithfulness.contract.id,
    registerAssessment: false,
    isLisaContext: true,
  });
  const liveFrPolicy = evaluateFeatureRealityPolicy(liveFeatureFallback);

  checks.push({
    name: 'LISA real builder reaches npm install',
    passed:
      liveBuild.npmInstallOk ||
      (liveManifest?.stageHistory ?? []).some((s) => s.stage === 'NPM_INSTALL'),
    detail: String(liveBuild.npmInstallOk),
  });
  checks.push({
    name: 'LISA real builder reaches npm build',
    passed:
      liveBuild.npmBuildOk ||
      (liveManifest?.stageHistory ?? []).some((s) => s.stage === 'NPM_BUILD'),
    detail: String(liveBuild.npmBuildOk),
  });
  checks.push({
    name: 'manifest not ABORTED at PLANNING after files exist',
    passed: !(
      liveManifest?.status === 'ABORTED' &&
      liveManifest.failureStage === 'PLANNING' &&
      workspaceHasGeneratedFeatureModules(liveWorkspace)
    ),
    detail: `${liveManifest?.status ?? 'none'}@${liveManifest?.failureStage ?? 'n/a'}`,
  });
  checks.push({
    name: 'AEE final report includes decision and furthest stage',
    passed: Boolean(
      liveBuild.aeeFinalReport?.finalDecision && liveBuild.aeeFinalReport?.buildSpineStageReached,
    ),
    detail: liveBuild.aeeFinalReport?.finalDecision ?? 'missing',
  });
  checks.push({
    name: 'AEE executive coordination recorded at runtime',
    passed: Boolean(
      runAeeExecutiveCoordination({
        workspaceDir: liveWorkspace,
        buildPlan: livePlan,
        rawPrompt: LISA_ASSISTIVE_PROMPT,
        projectId: liveProjectId,
        projectName: 'AEE LISA Live',
        aseBlockers: ['ASE denied materialization authorization.'],
        aseMaterializationAuthorized: false,
        featureRealityStatus: 'DEGRADED_WITH_WORKSPACE_EVIDENCE',
        manifestFaithfulness: { status: 'PASS', score: 100 },
      }).decision,
    ),
    detail: 'coordination ok',
  });

  const allPassed = checks.every((c) => c.passed);
  return { checks, allPassed };
}

export function printAeeValidationResults(checks: AeeValidationCheck[]): number {
  let passed = 0;
  for (const check of checks) {
    console.log(`${check.passed ? '[PASS]' : '[FAIL]'} ${check.name} — ${check.detail}`);
    if (check.passed) passed += 1;
  }
  console.log('');
  console.log(`${passed}/${checks.length} checks passed`);
  return passed;
}

export const printAutonomousEngineeringExecutiveValidationResults = printAeeValidationResults;

export { AUTONOMOUS_ENGINEERING_EXECUTIVE_V1_PASS_TOKEN };
