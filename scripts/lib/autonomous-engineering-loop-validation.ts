/**
 * Autonomous Engineering Loop V1 — shared validation suite.
 */

import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import {
  AUTONOMOUS_ENGINEERING_LOOP_V1_PASS_TOKEN,
  assertAelCheck,
  runAutonomousEngineeringLoop,
  routeAelRepair,
  runAutonomousFounderLoop,
  validateAelDecisionOutcomes,
  validateAelFeatureFlag,
  validateAelModuleFiles,
  validateAelNoAppHardcoding,
  validateAelOrchestratorWiring,
  validateAelStateMachine,
  validateCerModuleGeneration,
  validateCerSafetyGates,
  validatePreGenericFallbackDetection,
  validatePreRichProductPass,
  type AelValidationCheck,
} from '../../src/autonomous-engineering-loop/index.js';
import { resetOnePromptLivePreviewForTests } from '../../src/one-prompt-live-preview/index.js';
import { resetGeneratedDevServerManagerForTests } from '../../src/one-prompt-live-preview/generated-dev-server-manager.js';
import { resetPreviewSessionManagerForTests } from '../../src/live-preview-runtime/index.js';
import { resetEngineeringAuthorityForTests } from '../../src/ase-enforcement-engine/index.js';
import { resetAeeRuntimeRecorderForTests } from '../../src/autonomous-engineering-executive/index.js';
import { resolvePromptFaithfulBuildPlan } from '../../src/prompt-faithful-generation/index.js';
import { UNIVERSAL_BUILD_PIPELINE_MATRIX } from '../../src/universal-build-pipeline-verification/universal-build-pipeline-matrix.js';
import { runOnePromptLivePreviewBuild } from '../../src/one-prompt-live-preview/one-prompt-build-orchestrator.js';
import { evaluateProductReality } from '../../src/autonomous-engineering-loop/product-reality-engine.js';

export const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
export const MODULE_DIR = join(ROOT, 'src/autonomous-engineering-loop');

const REGRESSION_CATEGORIES = [
  'expense-tracker',
  'e-commerce-store',
  'ai-chat-app',
  'internal-hr-admin',
  'assistive-mobile-accessibility',
  'saas-crm',
] as const;

export async function runAutonomousEngineeringLoopValidation(): Promise<{
  checks: AelValidationCheck[];
  allPassed: boolean;
}> {
  const checks: AelValidationCheck[] = [];
  validateAelModuleFiles(MODULE_DIR, checks);
  validateAelStateMachine(checks);
  validatePreGenericFallbackDetection(checks);
  validatePreRichProductPass(checks);
  validateCerSafetyGates(checks);
  validateAelDecisionOutcomes(checks);
  validateAelFeatureFlag(checks);
  validateAelNoAppHardcoding(MODULE_DIR, checks);

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  assertAelCheck(
    checks,
    'package script validate:autonomous-engineering-loop',
    Boolean(pkg.scripts?.['validate:autonomous-engineering-loop']),
    'script',
  );

  const orchestrator = readFileSync(
    join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'),
    'utf8',
  );
  const brainHandler = readFileSync(join(ROOT, 'server/brain-api-handler.ts'), 'utf8');
  const buildHandler = readFileSync(join(ROOT, 'server/build-from-prompt-handler.ts'), 'utf8');
  const chatResponse = readFileSync(
    join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-chat-response.ts'),
    'utf8',
  );

  validateAelOrchestratorWiring(orchestrator, checks);
  assertAelCheck(
    checks,
    'brain respond uses orchestrator with AEL',
    brainHandler.includes('runOnePromptLivePreviewBuild'),
    'brain handler',
  );
  assertAelCheck(
    checks,
    'build-from-prompt uses orchestrator',
    buildHandler.includes('runOnePromptLivePreviewBuild'),
    'build handler',
  );
  assertAelCheck(
    checks,
    'chat response includes AEL evidence',
    chatResponse.includes('aelEvidence') && chatResponse.includes('aelFinalOutcome'),
    'chat payload',
  );

  assertAelCheck(
    checks,
    'AFL routes to AutoFix/CER/Preview Recovery',
    orchestrator.includes('runAeeBuildAutofixLoop') &&
      orchestrator.includes('runCapabilityEvolutionRuntime') === false &&
      orchestrator.includes('runAutonomousEngineeringLoop'),
    'repair routing via AEL orchestrator',
  );

  const founderRoutes = runAutonomousFounderLoop({
    rawPrompt: 'Build CRM with customers and deals',
    workspaceDir: join(ROOT, 'src'),
    projectId: 'ael-test',
    productRealityReport: evaluateProductReality({
      rawPrompt: 'Build CRM with customers and deals',
      workspaceDir: join(ROOT, 'src'),
      generatedModules: ['dashboard', 'settings'],
    }),
    npmBuildOk: true,
    previewOk: false,
    cycleBudget: 1,
  });
  assertAelCheck(
    checks,
    'Autonomous Founder Loop routes findings',
    founderRoutes.routedDecision === 'RUN_CAPABILITY_EVOLUTION' ||
      founderRoutes.routedDecision === 'RUN_PREVIEW_RECOVERY' ||
      founderRoutes.routedDecision === 'RUN_AUTOFIX',
    String(founderRoutes.routedDecision),
  );

  const repairRoute = await routeAelRepair({
    decision: 'RUN_CAPABILITY_EVOLUTION',
    rawPrompt: 'Build AI chat with conversation history',
    workspaceDir: join(tmpdir(), `ael-cer-${Date.now()}`),
    projectRootDir: ROOT,
    workspaceId: 'ael-cer-test',
    missingCapabilities: ['conversation-history'],
    definition: resolvePromptFaithfulBuildPlan('Build AI chat app').definition,
    existingModules: ['dashboard'],
    capabilityEvolutionAttempts: 0,
  });
  assertAelCheck(
    checks,
    'AEL repair router invokes CER',
    repairRoute.action === 'RUN_CAPABILITY_EVOLUTION',
    repairRoute.action,
  );

  const testRoot = join(tmpdir(), `ael-validation-${Date.now()}`);
  mkdirSync(testRoot, { recursive: true });
  process.env.AIDEVENGINE_REGISTRY_ROOT = testRoot;
  process.env.AIDEVENGINE_AEL_ENABLED = 'true';

  try {
    resetOnePromptLivePreviewForTests();
    resetGeneratedDevServerManagerForTests();
    resetPreviewSessionManagerForTests();
    resetEngineeringAuthorityForTests();
    resetAeeRuntimeRecorderForTests();

    const cerWorkspace = join(testRoot, 'cer-workspace');
    mkdirSync(join(cerWorkspace, 'src', 'features'), { recursive: true });
    validateCerModuleGeneration(checks, {
      workspaceDir: cerWorkspace,
      projectRootDir: testRoot,
      workspaceId: 'cer-workspace',
      definition: resolvePromptFaithfulBuildPlan('Build AI chat app').definition,
    });

    for (const categoryId of REGRESSION_CATEGORIES) {
      const entry = UNIVERSAL_BUILD_PIPELINE_MATRIX.find((e) => e.categoryId === categoryId);
      if (!entry) continue;
      const preOnly = evaluateProductReality({
        rawPrompt: entry.prompt,
        workspaceDir: ROOT,
        generatedModules: entry.requiredModuleHints,
      });
      assertAelCheck(
        checks,
        `regression PRE ${categoryId}`,
        !preOnly.genericFallbackDetected || entry.requiredModuleHints.length <= 2,
        `score=${preOnly.productRealityScore}`,
      );
    }

    const liveBuild = await runOnePromptLivePreviewBuild({
      rawPrompt: UNIVERSAL_BUILD_PIPELINE_MATRIX.find((e) => e.categoryId === 'expense-tracker')!.prompt,
      projectRootDir: testRoot,
      source: 'validator',
      projectId: `ael-live-${Date.now()}`,
      projectName: 'AEL Validation Expense',
    });

    assertAelCheck(
      checks,
      'real one-prompt path includes AEL evidence',
      liveBuild.aelReport != null && liveBuild.aelFinalOutcome != null,
      liveBuild.aelFinalOutcome ?? 'missing',
    );
    assertAelCheck(
      checks,
      'AEL report artifacts written when enabled',
      liveBuild.aelReport?.enabled === true,
      `cycles=${liveBuild.aelReport?.cyclesExecuted ?? 0}`,
    );
    assertAelCheck(
      checks,
      'AEL does not return generic FAILED after build pass',
      liveBuild.npmBuildOk !== true || liveBuild.status !== 'FAILED',
      liveBuild.status,
    );
  } finally {
    delete process.env.AIDEVENGINE_REGISTRY_ROOT;
    delete process.env.AIDEVENGINE_AEL_ENABLED;
    try {
      rmSync(testRoot, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }

  const allPassed = checks.every((c) => c.passed);
  return { checks, allPassed };
}
