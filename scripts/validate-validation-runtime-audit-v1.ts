/**
 * Validation Runtime Audit V1 — validation (read-only, measurement only).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  VALIDATION_RUNTIME_AUDIT_V1_ARTIFACT_DIR,
  VALIDATION_RUNTIME_AUDIT_V1_PASS_TOKEN,
  VALIDATION_RUNTIME_AUDIT_V1_REPORT_TITLE,
  buildValidationRuntimeAudit,
  buildValidationRuntimeAuditV1ReportMarkdown,
} from '../src/validation-runtime-audit-v1/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const ARTIFACT_DIR = join(ROOT, VALIDATION_RUNTIME_AUDIT_V1_ARTIFACT_DIR);
const REPORT_PATH = join(ROOT, VALIDATION_RUNTIME_AUDIT_V1_REPORT_TITLE);

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function main(): void {
  console.log('');
  console.log('Validation Runtime Audit V1 — Measurement');
  console.log('=========================================');
  console.log('');

  const requiredModuleFiles = [
    'src/validation-runtime-audit-v1/index.ts',
    'src/validation-runtime-audit-v1/validation-runtime-audit-assessor.ts',
    'src/validation-runtime-audit-v1/runtime-estimator.ts',
    'src/validation-runtime-audit-v1/duplicate-work-analyzer.ts',
    'src/validation-runtime-audit-v1/dependency-graph-builder.ts',
    'src/validation-runtime-audit-v1/bottleneck-analyzer.ts',
    'src/validation-runtime-audit-v1/governance-recommendations.ts',
    'src/validation-runtime-audit-v1/validation-runtime-audit-report-builder.ts',
  ];

  for (const rel of requiredModuleFiles) {
    assert(`module file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  assert(
    'package script validate:validation-runtime-audit-v1',
    Boolean(pkg.scripts?.['validate:validation-runtime-audit-v1']),
    'validate:validation-runtime-audit-v1',
  );

  const auditResult = buildValidationRuntimeAudit(ROOT);
  const { assessment } = auditResult;

  assert('read-only mode', assessment.readOnly === true, 'readOnly=true');
  assert('measurement-only mode', assessment.measurementOnly === true, 'measurementOnly=true');
  assert('validator count > 0', assessment.validatorCount > 0, String(assessment.validatorCount));
  assert(
    'registered validator count > 0',
    assessment.registeredValidatorCount > 0,
    String(assessment.registeredValidatorCount),
  );
  assert(
    'runtime metrics populated',
    assessment.metrics.length === assessment.validatorCount,
    `${assessment.metrics.length} metrics`,
  );
  assert(
    'rankings slowest top 20 or fewer',
    auditResult.rankings.slowest.length > 0 && auditResult.rankings.slowest.length <= 20,
    String(auditResult.rankings.slowest.length),
  );
  assert(
    'dependency graph nodes',
    auditResult.dependencyGraph.nodes.length > 0,
    String(auditResult.dependencyGraph.nodes.length),
  );
  assert(
    'bottlenecks identified',
    auditResult.bottlenecks.length > 0,
    String(auditResult.bottlenecks.length),
  );
  assert(
    'governance recommendations',
    auditResult.governanceRecommendations.length > 0,
    String(auditResult.governanceRecommendations.length),
  );
  assert(
    'regression chain overhead computed',
    assessment.regressionChain.validationOverheadRatio > 0,
    `${assessment.regressionChain.validationOverheadRatio}%`,
  );

  const reportMarkdown = buildValidationRuntimeAuditV1ReportMarkdown(auditResult);
  mkdirSync(ARTIFACT_DIR, { recursive: true });

  writeFileSync(
    join(ARTIFACT_DIR, 'runtime-metrics.json'),
    `${JSON.stringify(
      {
        generatedAt: assessment.generatedAt,
        validatorCount: assessment.validatorCount,
        registeredValidatorCount: assessment.registeredValidatorCount,
        totalEstimatedRuntimeSeconds: assessment.totalEstimatedRuntimeSeconds,
        totalEstimatedRuntimeMinutes: assessment.totalEstimatedRuntimeMinutes,
        aggregateDuplicateWorkPercent: assessment.aggregateDuplicateWorkPercent,
        regressionChain: assessment.regressionChain,
        metrics: assessment.metrics,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  writeFileSync(
    join(ARTIFACT_DIR, 'validator-rankings.json'),
    `${JSON.stringify(
      {
        generatedAt: assessment.generatedAt,
        slowest: auditResult.rankings.slowest,
        mostExpensive: auditResult.rankings.mostExpensive,
        highestDuplicate: auditResult.rankings.highestDuplicate,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  writeFileSync(
    join(ARTIFACT_DIR, 'duplicate-work-analysis.json'),
    `${JSON.stringify(
      {
        generatedAt: assessment.generatedAt,
        aggregateDuplicateWorkPercent: auditResult.duplicateWork.aggregateDuplicateWorkPercent,
        entries: auditResult.duplicateWork.entries,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  writeFileSync(
    join(ARTIFACT_DIR, 'dependency-graph.json'),
    `${JSON.stringify(
      {
        generatedAt: assessment.generatedAt,
        ...auditResult.dependencyGraph,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  writeFileSync(
    join(ARTIFACT_DIR, 'bottlenecks.json'),
    `${JSON.stringify(
      {
        generatedAt: assessment.generatedAt,
        bottlenecks: auditResult.bottlenecks,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  writeFileSync(
    join(ARTIFACT_DIR, 'governance-recommendations.json'),
    `${JSON.stringify(
      {
        generatedAt: assessment.generatedAt,
        readOnly: true,
        notImplemented: true,
        recommendations: auditResult.governanceRecommendations,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  writeFileSync(REPORT_PATH, reportMarkdown, 'utf8');

  assert('report written', existsSync(REPORT_PATH), REPORT_PATH);
  assert('runtime-metrics.json', existsSync(join(ARTIFACT_DIR, 'runtime-metrics.json')), 'artifact');
  assert('validator-rankings.json', existsSync(join(ARTIFACT_DIR, 'validator-rankings.json')), 'artifact');
  assert(
    'duplicate-work-analysis.json',
    existsSync(join(ARTIFACT_DIR, 'duplicate-work-analysis.json')),
    'artifact',
  );
  assert('dependency-graph.json', existsSync(join(ARTIFACT_DIR, 'dependency-graph.json')), 'artifact');
  assert('bottlenecks.json', existsSync(join(ARTIFACT_DIR, 'bottlenecks.json')), 'artifact');
  assert(
    'governance-recommendations.json',
    existsSync(join(ARTIFACT_DIR, 'governance-recommendations.json')),
    'artifact',
  );
  assert(
    'report contains pass token',
    reportMarkdown.includes(VALIDATION_RUNTIME_AUDIT_V1_PASS_TOKEN),
    VALIDATION_RUNTIME_AUDIT_V1_PASS_TOKEN,
  );

  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
  }
  console.log('');
  console.log(`Validators scanned: ${assessment.validatorCount}`);
  console.log(`Registered: ${assessment.registeredValidatorCount}`);
  console.log(`Typical phase validation: ${assessment.regressionChain.typicalRegressionValidationMinutes} min`);
  console.log(`Validation overhead: ${assessment.regressionChain.validationOverheadRatio}%`);
  console.log(`Report: ${REPORT_PATH}`);
  console.log('');

  if (failed.length > 0) {
    console.error(`Validation Runtime Audit V1 — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(VALIDATION_RUNTIME_AUDIT_V1_PASS_TOKEN);
}

main();
