/**
 * Validation Runtime Governance V1 — validation.
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AFLA_FORBIDDEN_TIERS,
  REGRESSION_VALIDATORS,
  VALIDATION_RUNTIME_GOVERNANCE_V1_ARTIFACT_DIR,
  VALIDATION_RUNTIME_GOVERNANCE_V1_PASS_TOKEN,
  VALIDATION_RUNTIME_GOVERNANCE_V1_REPORT_TITLE,
  acquirePlaywrightSession,
  acquirePreviewRuntime,
  buildValidationRuntimeGovernanceAssessment,
  buildValidationRuntimeGovernanceV1ReportMarkdown,
  checkDuplicateOperation,
  computeWorkspaceFingerprint,
  isValidationRuntimeGovernanceActive,
  isValidatorAllowedInTier,
  planValidationRun,
  releasePlaywrightSession,
  releasePreviewRuntime,
  resetArtifactReuseRegistryForTests,
  resetBuildOutputCacheForTests,
  resetPlaywrightSessionPoolForTests,
  resetPreviewRuntimePoolForTests,
  resetValidationRuntimeGovernanceForTests,
  resolveBuildOutput,
  TARGET_DUPLICATE_WORK_PERCENT,
  TARGET_VALIDATION_OVERHEAD_PERCENT,
} from '../src/validation-runtime-governance-v1/index.js';
import { buildValidationRuntimeAudit } from '../src/validation-runtime-audit-v1/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const ARTIFACT_DIR = join(ROOT, VALIDATION_RUNTIME_GOVERNANCE_V1_ARTIFACT_DIR);
const REPORT_PATH = join(ROOT, VALIDATION_RUNTIME_GOVERNANCE_V1_REPORT_TITLE);

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function runRegressionValidator(scriptName: string): void {
  try {
    execSync(`npm run ${scriptName}`, {
      cwd: ROOT,
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: 900_000,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Regression validator ${scriptName} failed: ${message}`);
  }
}

function main(): void {
  console.log('');
  console.log('Validation Runtime Governance V1');
  console.log('================================');
  console.log('');

  resetValidationRuntimeGovernanceForTests();
  resetPreviewRuntimePoolForTests();
  resetBuildOutputCacheForTests();
  resetPlaywrightSessionPoolForTests();
  resetArtifactReuseRegistryForTests();

  const requiredFiles = [
    'src/validation-runtime-governance-v1/index.ts',
    'src/validation-runtime-governance-v1/tier-registry.ts',
    'src/validation-runtime-governance-v1/capability-impact-graph.ts',
    'src/validation-runtime-governance-v1/runtime-budget-registry.ts',
    'src/validation-runtime-governance-v1/preview-runtime-pool.ts',
    'src/validation-runtime-governance-v1/build-output-cache.ts',
    'src/validation-runtime-governance-v1/playwright-session-pool.ts',
    'src/validation-runtime-governance-v1/artifact-reuse-registry.ts',
    'src/validation-runtime-governance-v1/governance-policy-authority.ts',
    'src/validation-runtime-governance-v1/validation-runtime-governance-assessor.ts',
  ];

  for (const rel of requiredFiles) {
    assert(`module ${rel}`, existsSync(join(ROOT, rel)), rel);
  }

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  assert(
    'package script',
    Boolean(pkg.scripts?.['validate:validation-runtime-governance-v1']),
    'validate:validation-runtime-governance-v1',
  );

  const assessment = buildValidationRuntimeGovernanceAssessment(ROOT);
  const auditResult = buildValidationRuntimeAudit(ROOT);

  assert('governance active', isValidationRuntimeGovernanceActive(), 'active');
  assert('policy active', assessment.policy.active === true, 'policy.active');
  assert('10 governance rules', assessment.policy.rules.length === 10, String(assessment.policy.rules.length));
  assert('4 tiers defined', assessment.policy.tiers.length === 4, String(assessment.policy.tiers.length));
  assert('tier assignments', assessment.tierAssignments.length > 0, String(assessment.tierAssignments.length));
  assert('capability impact graph', assessment.capabilityImpactGraph.nodes.length > 0, 'nodes');
  assert('runtime budget registry', assessment.runtimeBudgetRegistry.length > 0, 'budgets');
  assert('reuse strategy preview', assessment.reuseStrategy.previewServerReuse.enabled, 'preview');
  assert('reuse strategy build cache', assessment.reuseStrategy.buildOutputCache.enabled, 'build');
  assert('reuse strategy playwright', assessment.reuseStrategy.playwrightSessionReuse.enabled, 'playwright');

  assert(
    'AFLA blocked in FAST',
    !isValidatorAllowedInTier('validate:autonomous-founder-launch-authority-v1', 'AFLA', 'FAST'),
    'FAST forbidden',
  );
  assert(
    'AFLA blocked in STANDARD',
    AFLA_FORBIDDEN_TIERS.includes('STANDARD'),
    'STANDARD forbidden',
  );
  assert(
    'AFLA allowed in LAUNCH',
    isValidatorAllowedInTier('validate:autonomous-founder-launch-authority-v1', 'AFLA', 'LAUNCH'),
    'LAUNCH allowed',
  );

  const preview1 = acquirePreviewRuntime({ workspaceKey: 'ws-test', url: 'http://127.0.0.1:4173', port: 4173 });
  const preview2 = acquirePreviewRuntime({ workspaceKey: 'ws-test' });
  assert('preview reuse', preview2.reused === true, `reused=${preview2.reused}`);
  releasePreviewRuntime('ws-test');

  const fp = computeWorkspaceFingerprint({ workspaceKey: 'ws-build', inputHashes: ['abc'] });
  resolveBuildOutput({ workspaceKey: 'ws-build', workspaceFingerprint: fp, distPath: '/dist' });
  const cached = resolveBuildOutput({ workspaceKey: 'ws-build', workspaceFingerprint: fp, distPath: '/dist' });
  assert('build cache hit', cached.hit === true, `hit=${cached.hit}`);

  const pw1 = acquirePlaywrightSession();
  const pw2 = acquirePlaywrightSession();
  assert('playwright reuse', pw2.reused === true, `reused=${pw2.reused}`);
  releasePlaywrightSession();
  releasePlaywrightSession();

  const dupCheck = checkDuplicateOperation({
    operation: 'preview_startup',
    workspaceKey: 'ws-dup',
    fingerprint: fp,
  });
  assert('duplicate check runs', typeof dupCheck.blocked === 'boolean', String(dupCheck.blocked));

  const fastPlan = planValidationRun({
    tier: 'FAST',
    changedFiles: ['src/clarifying-question-intelligence/index.ts'],
    capabilityImpactGraph: assessment.capabilityImpactGraph,
    tierAssignments: assessment.tierAssignments,
    metrics: auditResult.assessment.metrics,
  });
  assert('FAST plan under 60s target', fastPlan.estimatedRuntimeSeconds <= 60 || fastPlan.validatorsToRun.length <= 3, `${fastPlan.estimatedRuntimeSeconds}s`);

  assert(
    'projected overhead under target',
    assessment.governanceMetrics.projectedValidationOverheadPercent < TARGET_VALIDATION_OVERHEAD_PERCENT,
    `${assessment.governanceMetrics.projectedValidationOverheadPercent}%`,
  );
  assert(
    'projected duplicate under target',
    assessment.governanceMetrics.projectedDuplicateWorkPercent < TARGET_DUPLICATE_WORK_PERCENT,
    `${assessment.governanceMetrics.projectedDuplicateWorkPercent}%`,
  );

  for (const v of REGRESSION_VALIDATORS) {
    assert(`regression registered: ${v}`, Boolean(pkg.scripts?.[v]), v);
  }

  const reportMarkdown = buildValidationRuntimeGovernanceV1ReportMarkdown(
    assessment,
    auditResult.assessment.metrics,
  );

  mkdirSync(ARTIFACT_DIR, { recursive: true });

  writeFileSync(
    join(ARTIFACT_DIR, 'governance-policy.json'),
    `${JSON.stringify(assessment.policy, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(ARTIFACT_DIR, 'tier-registry.json'),
    `${JSON.stringify(
      {
        generatedAt: assessment.generatedAt,
        tiers: assessment.policy.tiers,
        assignments: assessment.tierAssignments,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  writeFileSync(
    join(ARTIFACT_DIR, 'capability-impact-graph.json'),
    `${JSON.stringify(
      {
        generatedAt: assessment.generatedAt,
        nodes: assessment.capabilityImpactGraph.nodes,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  writeFileSync(
    join(ARTIFACT_DIR, 'runtime-budget-registry.json'),
    `${JSON.stringify(
      {
        generatedAt: assessment.generatedAt,
        entries: assessment.runtimeBudgetRegistry,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  writeFileSync(
    join(ARTIFACT_DIR, 'reuse-strategy.json'),
    `${JSON.stringify(assessment.reuseStrategy, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(ARTIFACT_DIR, 'governance-metrics.json'),
    `${JSON.stringify(assessment.governanceMetrics, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(REPORT_PATH, reportMarkdown, 'utf8');

  assert('report written', existsSync(REPORT_PATH), REPORT_PATH);
  assert('governance-policy.json', existsSync(join(ARTIFACT_DIR, 'governance-policy.json')), 'artifact');
  assert('tier-registry.json', existsSync(join(ARTIFACT_DIR, 'tier-registry.json')), 'artifact');
  assert('capability-impact-graph.json', existsSync(join(ARTIFACT_DIR, 'capability-impact-graph.json')), 'artifact');
  assert('runtime-budget-registry.json', existsSync(join(ARTIFACT_DIR, 'runtime-budget-registry.json')), 'artifact');
  assert('reuse-strategy.json', existsSync(join(ARTIFACT_DIR, 'reuse-strategy.json')), 'artifact');
  assert('governance-metrics.json', existsSync(join(ARTIFACT_DIR, 'governance-metrics.json')), 'artifact');
  assert('report pass token', reportMarkdown.includes(VALIDATION_RUNTIME_GOVERNANCE_V1_PASS_TOKEN), 'token');

  const fastRegressions = [
    'validate:validation-runtime-audit-v1',
    'validate:capability-audit-v3',
    'validate:product-architect-intelligence-v1',
    'validate:afla-trust-calibration-v1',
  ];

  console.log('Running fast regression validators...');
  for (const script of fastRegressions) {
    try {
      runRegressionValidator(script);
      assert(`regression pass: ${script}`, true, 'passed');
      console.log(`  PASS ${script}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      assert(`regression pass: ${script}`, false, message.slice(0, 200));
      console.log(`  FAIL ${script}`);
    }
  }

  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const r of results) {
    if (!r.name.startsWith('regression pass')) {
      console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
    }
  }
  console.log('');
  console.log(`Governance active: ${assessment.governanceActive}`);
  console.log(`Overhead: ${assessment.governanceMetrics.baselineValidationOverheadPercent}% → ${assessment.governanceMetrics.projectedValidationOverheadPercent}%`);
  console.log(`Duplicate: ${assessment.governanceMetrics.baselineDuplicateWorkPercent}% → ${assessment.governanceMetrics.projectedDuplicateWorkPercent}%`);
  console.log(`Report: ${REPORT_PATH}`);
  console.log('');

  if (failed.length > 0) {
    console.error(`Validation Runtime Governance V1 — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(VALIDATION_RUNTIME_GOVERNANCE_V1_PASS_TOKEN);
}

main();
