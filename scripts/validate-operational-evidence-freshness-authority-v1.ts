/**
 * Operational Evidence Freshness Authority V1 — validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildOperationalEvidenceFreshnessAuthorityV1ReportMarkdown,
  MIN_CAPABILITIES_ASSESSED,
  MIN_EVIDENCE_SOURCES_CONSUMED,
  OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_ARTIFACT_DIR,
  OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_PASS_TOKEN,
  OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_REPORT_TITLE,
  runOperationalEvidenceFreshnessAuthorityV1,
} from '../src/operational-evidence-freshness-authority-v1/index.js';
import { buildOperationalEvidenceFreshnessPayload } from '../server/operational-evidence-freshness-handler.js';
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
const ARTIFACT_DIR = join(ROOT, OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_ARTIFACT_DIR);
const REPORT_PATH = join(ROOT, OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_REPORT_TITLE);
const START = Date.now();
const MAX_RUNTIME_MS = 120_000;

const REGRESSION_SCRIPTS_REGISTERED = [
  'validate:unified-failure-escalation-authority-v1',
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
  console.log('Operational Evidence Freshness Authority V1 — Validation');
  console.log('========================================================');
  console.log('');

  checkpoint('start');

  const requiredFiles = [
    'src/operational-evidence-freshness-authority-v1/operational-evidence-freshness-assessor.ts',
    'src/operational-evidence-freshness-authority-v1/calculate-evidence-freshness.ts',
    'src/operational-evidence-freshness-authority-v1/index.ts',
    'server/operational-evidence-freshness-handler.ts',
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

  assert('01. package script', Boolean(pkg.scripts?.['validate:operational-evidence-freshness-authority-v1']), 'script');
  assert('02. operator section', manifest.includes("'Evidence Freshness'"), 'manifest');
  assert('03. server route', serverTs.includes('/api/founder/operational-evidence-freshness-authority-v1'), 'route');
  assert('04. UI overall freshness score', appJs.includes('Overall freshness score'), 'overall score');
  assert('05. UI fresh capabilities', appJs.includes('Fresh capabilities'), 'fresh');
  assert('06. UI aging capabilities', appJs.includes('Aging capabilities'), 'aging');
  assert('07. UI stale capabilities', appJs.includes('Stale capabilities'), 'stale');
  assert('08. UI expired capabilities', appJs.includes('Expired capabilities'), 'expired');
  assert('09. UI recommended validations', appJs.includes('Recommended validations'), 'revalidations');
  assert('10. UI confidence decay summary', appJs.includes('Confidence decay summary'), 'decay');

  for (const script of REGRESSION_SCRIPTS_REGISTERED) {
    assert(`11. regression script registered: ${script}`, Boolean(pkg.scripts?.[script]), script);
  }

  const assessment = runOperationalEvidenceFreshnessAuthorityV1({
    projectRootDir: ROOT,
    resetRegistry: true,
  });
  checkpoint('freshness authority completed');

  const reportMarkdown = buildOperationalEvidenceFreshnessAuthorityV1ReportMarkdown(assessment);
  writeFileSync(REPORT_PATH, reportMarkdown, 'utf8');

  assert(
    '12. evidence sources consumed',
    assessment.evidenceSourcesConsumed >= MIN_EVIDENCE_SOURCES_CONSUMED,
    String(assessment.evidenceSourcesConsumed),
  );
  assert(
    '13. capabilities assessed',
    assessment.capabilitiesAssessed >= MIN_CAPABILITIES_ASSESSED,
    String(assessment.capabilitiesAssessed),
  );
  assert('14. freshness scoring proven', assessment.freshnessScoringProven, 'scoring');
  assert('15. confidence decay proven', assessment.confidenceDecayProven, 'decay');
  assert('16. revalidation recommendations proven', assessment.revalidationRecommendationsProven, 'revalidation');
  assert('17. evidence drift proven', assessment.evidenceDriftProven, 'drift');
  assert('18. stale escalation proven', assessment.staleEscalationProven, 'escalation');
  assert(
    '19. freshness proof status',
    assessment.freshnessProofStatus === 'PROVEN',
    assessment.freshnessProofStatus,
  );
  assert(
    '20. pass token',
    assessment.passToken === OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_PASS_TOKEN,
    assessment.passToken,
  );

  const artifactFiles = [
    'freshness-registry.json',
    'capability-freshness.json',
    'confidence-decay.json',
    'revalidation-recommendations.json',
    'evidence-drift.json',
    'freshness-incidents.json',
    'audit-impact.json',
    'assessment.json',
  ];
  for (const file of artifactFiles) {
    assert(`21. artifact ${file}`, existsSync(join(ARTIFACT_DIR, file)), file);
  }

  assert('22. report written', existsSync(REPORT_PATH), OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_REPORT_TITLE);

  const payload = buildOperationalEvidenceFreshnessPayload({ projectRootDir: ROOT, refresh: false });
  assert('23. operator payload', payload.evidenceSourcesConsumed >= MIN_EVIDENCE_SOURCES_CONSUMED, 'payload');

  const missing = buildMissingCapabilitiesReport({ projectRootDir: ROOT });
  assert(
    '24. freshness gap closed',
    !missing.entries.some((e) => e.capability === 'Operational evidence freshness governance'),
    String(missing.entries.length),
  );

  const { highestPriorityGap, priorities: roadmap } = buildRecommendedRoadmap({
    projectRootDir: ROOT,
  });

  assert(
    '25. not highest gap',
    highestGapTitle(highestPriorityGap) !== 'Operational Evidence Freshness Authority',
    highestGapTitle(highestPriorityGap),
  );
  assert(
    '26. maintain freshness not highest gap',
    !highestPriorityGap.includes('maintain operational evidence freshness') ||
      highestPriorityGap.includes('continue operational monitoring'),
    highestGapTitle(highestPriorityGap),
  );
  assert(
    '27. complete in roadmap',
    roadmap.some((p) => p.phase === 'Operational Evidence Freshness Authority' && p.action === 'COMPLETE'),
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
    console.error(`Operational Evidence Freshness Authority V1 — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_PASS_TOKEN);
  console.log(
    `Freshness: ${assessment.capabilitiesAssessed} capabilities, score ${assessment.overallFreshnessScore}/100, ${assessment.registry.freshCount} fresh / ${assessment.registry.expiredCount} expired`,
  );
}

main();
