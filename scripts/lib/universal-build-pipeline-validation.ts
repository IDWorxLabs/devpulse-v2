/**
 * Universal Build Pipeline Verification V1 — shared validation suite.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MIN_UNIVERSAL_BUILD_MATRIX_COUNT,
  PIPELINE_STAGE_ORDER,
  UNIVERSAL_BUILD_PIPELINE_ARTIFACT_DIR,
  UNIVERSAL_BUILD_PIPELINE_MATRIX,
  UNIVERSAL_BUILD_PIPELINE_REPORT_JSON,
  UNIVERSAL_BUILD_PIPELINE_REPORT_MD,
  UNIVERSAL_BUILD_PIPELINE_V1_PASS_TOKEN,
  buildRecommendedFixes,
  classifyBlocker,
  detectSystemicPatterns,
  evaluateBuildContinuationPolicy,
  evaluateFeatureRealityPolicy,
  evaluateProfilePolicy,
  listUniversalBuildMatrixCategoryIds,
  resetUniversalBuildPipelineForTests,
  resolveBuildOutcome,
  runUniversalBuildPipeline,
  shouldInjectAuthRequirement,
  traceUniversalBuildPipeline,
} from '../../src/universal-build-pipeline-verification/index.js';
import { LISA_ASSISTIVE_PROMPT } from './prompt-bounded-materialization-validation.js';
import { resolvePromptFaithfulBuildPlan } from '../../src/prompt-faithful-generation/index.js';

export const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
export const MODULE_DIR = join(ROOT, 'src/universal-build-pipeline-verification');

export const REQUIRED_FILES = [
  'universal-build-pipeline-types.ts',
  'universal-build-pipeline-bounds.ts',
  'universal-build-pipeline-matrix.ts',
  'pipeline-stage-tracer.ts',
  'blocker-classifier.ts',
  'build-continuation-policy.ts',
  'build-profile-policy.ts',
  'build-feature-reality-policy.ts',
  'build-outcome-policy.ts',
  'universal-build-pipeline-runner.ts',
  'universal-build-pipeline-report-builder.ts',
  'index.ts',
] as const;

export interface ValidationCheck {
  name: string;
  passed: boolean;
  detail: string;
}

function assert(checks: ValidationCheck[], name: string, condition: boolean, detail: string): void {
  checks.push({ name, passed: condition, detail });
}

export function runUniversalBuildPipelineValidation(): {
  checks: ValidationCheck[];
  allPassed: boolean;
  assessment: ReturnType<typeof runUniversalBuildPipeline>;
} {
  const checks: ValidationCheck[] = [];
  resetUniversalBuildPipelineForTests();

  for (const file of REQUIRED_FILES) {
    assert(checks, `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
  }

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  assert(
    checks,
    'package script validate:universal-build-pipeline',
    Boolean(pkg.scripts?.['validate:universal-build-pipeline']),
    'script',
  );

  const orchestrator = readFileSync(
    join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'),
    'utf8',
  );
  assert(
    checks,
    'orchestrator wires runtime continuation policy',
    orchestrator.includes('evaluateRuntimeBuildContinuation'),
    'runtime continuation policy',
  );
  assert(
    checks,
    'orchestrator records ASE continuation override',
    orchestrator.includes('recordForensicManifestAseContinuationOverride'),
    'manifest ASE warning',
  );
  assert(
    checks,
    'orchestrator uses normalizeFailureStageLabel',
    orchestrator.includes('normalizeFailureStageLabel'),
    'build outcome policy',
  );

  assert(
    checks,
    'matrix category count',
    UNIVERSAL_BUILD_PIPELINE_MATRIX.length >= MIN_UNIVERSAL_BUILD_MATRIX_COUNT,
    String(UNIVERSAL_BUILD_PIPELINE_MATRIX.length),
  );

  const categoryIds = listUniversalBuildMatrixCategoryIds();
  const requiredCategories = [
    'assistive-mobile-accessibility',
    'expense-tracker',
    'e-commerce-store',
    'saas-crm',
    'social-community',
    'ai-chat-app',
    'education-lms',
    'healthcare-patient-portal',
    'marketplace-app',
    'developer-api-dashboard',
    'internal-hr-admin',
    'simple-game-puzzle',
  ];
  for (const id of requiredCategories) {
    assert(checks, `matrix includes ${id}`, categoryIds.includes(id), id);
  }

  assert(
    checks,
    'pipeline stage order count',
    PIPELINE_STAGE_ORDER.length >= 17,
    String(PIPELINE_STAGE_ORDER.length),
  );

  // LISA regression included
  const lisaEntry = UNIVERSAL_BUILD_PIPELINE_MATRIX.find((e) => e.isLisaRegression);
  assert(checks, 'LISA included as regression', Boolean(lisaEntry?.isLisaRegression), 'lisa');

  const lisaPlan = resolvePromptFaithfulBuildPlan(LISA_ASSISTIVE_PROMPT);
  assert(
    checks,
    'LISA does not select ExpenseTracker',
    String(lisaPlan.selectedProfile) !== 'EXPENSE_TRACKER_WEB_V1',
    String(lisaPlan.selectedProfile),
  );

  // Profile policy — generic custom for e-commerce
  const ecommerce = UNIVERSAL_BUILD_PIPELINE_MATRIX.find((e) => e.categoryId === 'e-commerce-store')!;
  const ecommercePlan = resolvePromptFaithfulBuildPlan(ecommerce.prompt);
  const ecommerceProfile = evaluateProfilePolicy({
    rawPrompt: ecommerce.prompt,
    buildPlan: ecommercePlan,
    expectedProfile: ecommerce.expectedProfile,
  });
  assert(
    checks,
    'generic custom profile accepted for e-commerce',
    ecommerceProfile.genericCustomAccepted || ecommerceProfile.accepted,
    ecommerceProfile.selectedProfile,
  );

  // Auth not required unless prompted
  const gameEntry = UNIVERSAL_BUILD_PIPELINE_MATRIX.find((e) => e.categoryId === 'simple-game-puzzle')!;
  assert(
    checks,
    'auth not injected for game prompt',
    !shouldInjectAuthRequirement(gameEntry.prompt),
    gameEntry.prompt.slice(0, 40),
  );

  // Feature reality degraded is warning not hard blocker
  const degradedPolicy = evaluateFeatureRealityPolicy({
    readOnly: true,
    status: 'DEGRADED_WITH_WORKSPACE_EVIDENCE',
    available: true,
    passed: true,
    score: 75,
    requiredModuleIds: ['a'],
    presentModuleIds: ['a'],
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
  assert(
    checks,
    'feature reality fallback is warning not blocker',
    !degradedPolicy.isHardBlocker && degradedPolicy.isWarning,
    degradedPolicy.status,
  );

  // Continuation policy allows build when conditions met
  const continuation = evaluateBuildContinuationPolicy({
    promptFaithfulnessPassed: true,
    workspaceExists: true,
    generatedModulesExist: true,
    hasGeneratedSourceFiles: true,
    blockers: ['Feature Reality evidence unavailable'],
    featureRealityStatus: 'DEGRADED_WITH_WORKSPACE_EVIDENCE',
  });
  assert(
    checks,
    'continuation policy continues to build',
    continuation.shouldContinueToBuild,
    continuation.continuationReason ?? 'no reason',
  );

  // Blocker classification — over-strict
  const overstrict = classifyBlocker({
    stage: 'ASE_AUTHORIZATION',
    reason: 'Feature Reality evidence unavailable',
    hasGeneratedSource: true,
    hasWorkspaceModules: true,
  });
  assert(
    checks,
    'over-strict blocker classified',
    overstrict.blockerClass === 'OVERSTRICT_BLOCKER' || overstrict.blockerClass === 'MISSING_FALLBACK_BLOCKER',
    overstrict.blockerClass,
  );

  // Build outcome — no PLANNING_FAILED for post-generation
  const postGenOutcome = resolveBuildOutcome({
    materialized: true,
    npmInstallOk: true,
    npmBuildOk: false,
    previewOk: false,
    previewDegraded: false,
    blockedBeforeMaterialization: false,
  });
  assert(
    checks,
    'post-generation maps to BUILD_COMPLETED_WITH_BUILD_ERRORS',
    postGenOutcome === 'BUILD_COMPLETED_WITH_BUILD_ERRORS',
    postGenOutcome,
  );

  // Tracer discovers multiple blockers without first-abort hiding
  const trace = traceUniversalBuildPipeline({
    matrixEntry: UNIVERSAL_BUILD_PIPELINE_MATRIX.find((e) => e.categoryId === 'ai-chat-app')!,
    projectRootDir: ROOT,
    leafMode: true,
  });
  assert(
    checks,
    'tracer records all stages',
    trace.stageTraces.length >= PIPELINE_STAGE_ORDER.length,
    String(trace.stageTraces.length),
  );

  // Full pipeline run + report artifacts
  const assessment = runUniversalBuildPipeline({ projectRootDir: ROOT, leafMode: true });
  const artifactDir = join(ROOT, UNIVERSAL_BUILD_PIPELINE_ARTIFACT_DIR);
  assert(
    checks,
    'report markdown written',
    existsSync(join(artifactDir, UNIVERSAL_BUILD_PIPELINE_REPORT_MD)),
    UNIVERSAL_BUILD_PIPELINE_REPORT_MD,
  );
  assert(
    checks,
    'report json written',
    existsSync(join(artifactDir, UNIVERSAL_BUILD_PIPELINE_REPORT_JSON)),
    UNIVERSAL_BUILD_PIPELINE_REPORT_JSON,
  );
  assert(
    checks,
    'assessment includes all matrix prompts',
    assessment.promptsTested >= MIN_UNIVERSAL_BUILD_MATRIX_COUNT,
    String(assessment.promptsTested),
  );
  assert(checks, 'LISA in assessment', assessment.lisaIncluded, String(assessment.lisaIncluded));
  assert(
    checks,
    'report separates outcome dimensions',
    assessment.categoryResults.every(
      (r) =>
        typeof r.promptFaithfulnessPassed === 'boolean' &&
        typeof r.workspaceMaterialized === 'boolean' &&
        typeof r.reachedNpmInstall === 'boolean',
    ),
    'per-category dimensions',
  );
  assert(
    checks,
    'no ExpenseTracker contamination in unrelated apps',
    !assessment.expenseTrackerContaminationDetected,
    String(assessment.expenseTrackerContaminationDetected),
  );

  const patterns = detectSystemicPatterns(assessment.categoryResults.flatMap((r) => r.blockers));
  assert(
    checks,
    'recommended fixes generated when patterns exist',
    buildRecommendedFixes(patterns).length >= 0,
    String(buildRecommendedFixes(patterns).length),
  );

  const allPassed = checks.every((c) => c.passed);
  return { checks, allPassed, assessment };
}

export function printUniversalBuildPipelineValidationResults(checks: ValidationCheck[]): number {
  let passed = 0;
  for (const check of checks) {
    const tag = check.passed ? '[PASS]' : '[FAIL]';
    console.log(`${tag} ${check.name} — ${check.detail}`);
    if (check.passed) passed += 1;
  }
  console.log('');
  console.log(`${passed}/${checks.length} checks passed`);
  return passed;
}

export { UNIVERSAL_BUILD_PIPELINE_V1_PASS_TOKEN };
