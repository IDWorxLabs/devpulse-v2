/**
 * Unified Failure Escalation Authority V1 — validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildUnifiedFailureEscalationAuthorityV1ReportMarkdown,
  MIN_INCIDENTS_PROCESSED,
  MIN_SOURCE_SYSTEMS_CONSUMED,
  UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_ARTIFACT_DIR,
  UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_PASS_TOKEN,
  UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_REPORT_TITLE,
  runUnifiedFailureEscalationAuthorityV1,
} from '../src/unified-failure-escalation-authority-v1/index.js';
import { buildUnifiedFailureEscalationPayload } from '../server/unified-failure-escalation-handler.js';
import {
  buildMissingCapabilitiesReport,
  buildRecommendedRoadmap,
} from '../src/capability-audit-v3/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const ARTIFACT_DIR = join(ROOT, UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_ARTIFACT_DIR);
const REPORT_PATH = join(ROOT, UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_REPORT_TITLE);
const START = Date.now();
const MAX_RUNTIME_MS = 120_000;

const REGRESSION_SCRIPTS_REGISTERED = [
  'validate:multi-project-concurrent-execution-v1',
  'validate:canonical-ownership-v2',
  'validate:self-evolution-execution-v1',
  'validate:world2-real-instantiation-v1',
  'validate:mobile-runtime-validation-at-scale-v1',
  'validate:large-scale-pipeline-integration-v1',
  'validate:validation-runtime-governance-v1',
  'validate:capability-audit-v3-1',
] as const;

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function checkpoint(label: string): void {
  const elapsed = Date.now() - START;
  console.log(`[checkpoint ${elapsed}ms] ${label}`);
  if (elapsed > MAX_RUNTIME_MS) {
    throw new Error(`Runtime guard exceeded at "${label}" (${elapsed}ms > ${MAX_RUNTIME_MS}ms)`);
  }
}

function highestGapTitle(highestPriorityGap: string): string {
  const separator = ' — ';
  const idx = highestPriorityGap.indexOf(separator);
  return idx >= 0 ? highestPriorityGap.slice(0, idx) : highestPriorityGap;
}

function main(): void {
  console.log('');
  console.log('Unified Failure Escalation Authority V1 — Validation');
  console.log('====================================================');
  console.log('');

  checkpoint('start');

  const requiredFiles = [
    'src/unified-failure-escalation-authority-v1/unified-failure-escalation-assessor.ts',
    'src/unified-failure-escalation-authority-v1/failure-classification-engine.ts',
    'src/unified-failure-escalation-authority-v1/index.ts',
    'server/unified-failure-escalation-handler.ts',
  ];

  for (const rel of requiredFiles) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }

  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8').slice(0, 4_000_000);
  const manifest = readFileSync(join(ROOT, 'server/command-center-shell-manifest.ts'), 'utf8');
  const serverTs = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  assert('01. package script', Boolean(pkg.scripts?.['validate:unified-failure-escalation-authority-v1']), 'script');
  assert('02. operator section', manifest.includes("'Failure Escalation'"), 'manifest');
  assert('03. server route', serverTs.includes('/api/founder/unified-failure-escalation-authority-v1'), 'route');
  assert('04. UI open incidents', appJs.includes('Open incidents'), 'open incidents');
  assert('05. UI severity distribution', appJs.includes('Severity distribution'), 'severity');
  assert('06. UI root causes', appJs.includes('Root causes'), 'root causes');
  assert('07. UI escalation paths', appJs.includes('Escalation paths'), 'escalation paths');
  assert('08. UI effectiveness metrics', appJs.includes('Effectiveness metrics'), 'effectiveness');

  for (const script of REGRESSION_SCRIPTS_REGISTERED) {
    assert(`09. regression script registered: ${script}`, Boolean(pkg.scripts?.[script]), script);
  }

  const assessment = runUnifiedFailureEscalationAuthorityV1({
    projectRootDir: ROOT,
    resetRegistry: true,
  });
  checkpoint('escalation authority completed');

  const reportMarkdown = buildUnifiedFailureEscalationAuthorityV1ReportMarkdown(assessment);
  writeFileSync(REPORT_PATH, reportMarkdown, 'utf8');

  assert(
    '10. source systems consumed',
    assessment.sourceSystemsConsumed >= MIN_SOURCE_SYSTEMS_CONSUMED,
    String(assessment.sourceSystemsConsumed),
  );
  assert(
    '11. incidents processed',
    assessment.incidentsProcessed >= MIN_INCIDENTS_PROCESSED,
    String(assessment.incidentsProcessed),
  );
  assert('12. three-failure rule proven', assessment.threeFailureRuleProven, 'rule');
  assert('13. world2 escalation proven', assessment.world2EscalationProven, 'world2');
  assert('14. evolution escalation proven', assessment.evolutionEscalationProven, 'evolution');
  assert('15. single authority proven', assessment.singleAuthorityProven, 'authority');
  assert(
    '16. escalation proof status',
    assessment.escalationProofStatus === 'PROVEN',
    assessment.escalationProofStatus,
  );
  assert(
    '17. pass token',
    assessment.passToken === UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_PASS_TOKEN,
    assessment.passToken,
  );

  const artifactFiles = [
    'incident-registry.json',
    'severity-distribution.json',
    'root-cause-analysis.json',
    'escalation-decisions.json',
    'repeated-failure-analysis.json',
    'effectiveness-assessment.json',
    'audit-impact.json',
    'assessment.json',
  ];
  for (const file of artifactFiles) {
    assert(`18. artifact ${file}`, existsSync(join(ARTIFACT_DIR, file)), file);
  }

  assert('19. report written', existsSync(REPORT_PATH), UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_REPORT_TITLE);

  const payload = buildUnifiedFailureEscalationPayload({ projectRootDir: ROOT, refresh: false });
  assert('20. operator payload', payload.openIncidents + payload.escalatedIncidents > 0, 'incidents');

  const missing = buildMissingCapabilitiesReport({ projectRootDir: ROOT });
  assert(
    '21. escalation gap closed',
    !missing.entries.some((e) => e.capability === 'Unified failure escalation authority'),
    String(missing.entries.length),
  );

  const { highestPriorityGap, nextPriority, priorities: roadmap } = buildRecommendedRoadmap({
    projectRootDir: ROOT,
  });

  assert(
    '22. not highest gap',
    highestGapTitle(highestPriorityGap) !== 'Unified Failure Escalation Authority',
    highestGapTitle(highestPriorityGap),
  );
  assert(
    '23. self-evolution not highest gap',
    highestGapTitle(highestPriorityGap) !== 'Self-Evolution Execution' ||
      !highestPriorityGap.includes('Unified failure escalation'),
    highestGapTitle(highestPriorityGap),
  );
  assert(
    '24. complete in roadmap',
    roadmap.some((p) => p.phase === 'Unified Failure Escalation Authority' && p.action === 'COMPLETE'),
    'COMPLETE action',
  );

  checkpoint('audit impact verified');

  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed.length > 0) {
    console.error(`Unified Failure Escalation Authority V1 — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_PASS_TOKEN);
  console.log(
    `Escalation: ${assessment.incidentsProcessed} incidents, ${assessment.sourceSystemsConsumed} sources, 3-failure rule ${assessment.threeFailureRuleProven ? 'enforced' : 'open'}`,
  );
}

main();
