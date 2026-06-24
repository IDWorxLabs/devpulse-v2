/**
 * Canonical Ownership V2 Registration — validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildCanonicalOwnershipV2ReportMarkdown,
  CANONICAL_OWNERSHIP_V2_ARTIFACT_DIR,
  CANONICAL_OWNERSHIP_V2_PASS_TOKEN,
  CANONICAL_OWNERSHIP_V2_REGISTRATION_REPORT_TITLE,
  REGISTRATION_SCOPE_CAPABILITY_IDS,
  runCanonicalOwnershipV2Registration,
} from '../src/canonical-ownership-v2/index.js';
import { buildCanonicalOwnershipV2Payload } from '../server/canonical-ownership-v2-handler.js';
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
const ARTIFACT_DIR = join(ROOT, CANONICAL_OWNERSHIP_V2_ARTIFACT_DIR);
const REPORT_PATH = join(ROOT, CANONICAL_OWNERSHIP_V2_REGISTRATION_REPORT_TITLE);
const START = Date.now();
const MAX_RUNTIME_MS = 120_000;

const REGRESSION_SCRIPTS_REGISTERED = [
  'validate:capability-audit-v3-1',
  'validate:self-evolution-execution-v1',
  'validate:world2-real-instantiation-v1',
  'validate:mobile-runtime-validation-at-scale-v1',
  'validate:large-scale-pipeline-integration-v1',
  'validate:validation-runtime-governance-v1',
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
  console.log('Canonical Ownership V2 Registration — Validation');
  console.log('================================================');
  console.log('');

  checkpoint('start');

  const requiredFiles = [
    'src/canonical-ownership-v2/index.ts',
    'src/canonical-ownership-v2/ownership-registry-v2.ts',
    'src/canonical-ownership-v2/canonical-ownership-v2-assessor.ts',
    'src/canonical-ownership-v2/orphan-detector.ts',
    'src/canonical-ownership-v2/ownership-collision-detector.ts',
    'server/canonical-ownership-v2-handler.ts',
  ];

  for (const rel of requiredFiles) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }

  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8').slice(0, 3_000_000);
  const manifest = readFileSync(join(ROOT, 'server/command-center-shell-manifest.ts'), 'utf8');
  const serverTs = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  assert('01. package script', Boolean(pkg.scripts?.['validate:canonical-ownership-v2']), 'script');
  assert('02. operator section', manifest.includes("'Capability Ownership'"), 'manifest');
  assert('03. server route', serverTs.includes('/api/founder/canonical-ownership-v2'), 'route');
  assert('04. UI canonical owners', appJs.includes('Canonical owners'), 'canonical owners');
  assert('05. UI registered capabilities', appJs.includes('Registered capabilities'), 'registered capabilities');
  assert('06. UI orphan capabilities', appJs.includes('Orphan Capabilities'), 'orphan capabilities');
  assert('07. UI duplicate risks', appJs.includes('Duplicate Risks'), 'duplicate risks');
  assert('08. UI ownership collisions', appJs.includes('Ownership Collisions'), 'ownership collisions');
  assert('09. UI resolved overlaps', appJs.includes('Resolved Overlaps'), 'resolved overlaps');

  for (const script of REGRESSION_SCRIPTS_REGISTERED) {
    assert(`10. regression script registered: ${script}`, Boolean(pkg.scripts?.[script]), script);
  }

  const assessment = runCanonicalOwnershipV2Registration({ projectRootDir: ROOT });
  checkpoint('registration completed');

  const reportMarkdown = buildCanonicalOwnershipV2ReportMarkdown(assessment);
  writeFileSync(REPORT_PATH, reportMarkdown, 'utf8');

  assert(
    '11. registration scope complete',
    assessment.registrationScopeComplete &&
      assessment.registeredCapabilities >= REGISTRATION_SCOPE_CAPABILITY_IDS.length,
    `${assessment.registeredCapabilities}/${REGISTRATION_SCOPE_CAPABILITY_IDS.length}`,
  );

  for (const capabilityId of REGISTRATION_SCOPE_CAPABILITY_IDS) {
    assert(
      `12. scope registered: ${capabilityId}`,
      assessment.entries.some((e) => e.capabilityId === capabilityId),
      capabilityId,
    );
  }

  assert('13. zero orphan critical', assessment.orphanCriticalCount === 0, String(assessment.orphanCriticalCount));
  assert('14. zero collisions', assessment.collisionCount === 0, String(assessment.collisionCount));
  assert(
    '15. duplicate risks resolved',
    assessment.duplicateRisksResolved >= 6,
    String(assessment.duplicateRisksResolved),
  );
  assert(
    '16. ownership proof status',
    assessment.ownershipProofStatus === 'PROVEN',
    assessment.ownershipProofStatus,
  );
  assert(
    '17. pass token',
    assessment.passToken === CANONICAL_OWNERSHIP_V2_PASS_TOKEN,
    assessment.passToken,
  );

  const artifactFiles = [
    'ownership-registry.json',
    'ownership-graph.json',
    'orphan-capabilities.json',
    'ownership-collisions.json',
    'duplicate-risk-resolution.json',
    'audit-impact.json',
    'assessment.json',
  ];
  for (const file of artifactFiles) {
    assert(`18. artifact ${file}`, existsSync(join(ARTIFACT_DIR, file)), file);
  }

  assert('19. report written', existsSync(REPORT_PATH), CANONICAL_OWNERSHIP_V2_REGISTRATION_REPORT_TITLE);

  const payload = buildCanonicalOwnershipV2Payload({ projectRootDir: ROOT, refresh: false });
  assert(
    '20. operator payload',
    payload.registrationScopeComplete && payload.collisionCount === 0,
    String(payload.registeredCapabilities),
  );

  const missing = buildMissingCapabilitiesReport({ projectRootDir: ROOT });
  assert(
    '21. audit gap closed in missing capabilities',
    !missing.entries.some((e) => e.capability === 'Canonical ownership registration for V2/V3 modules'),
    String(missing.entries.length),
  );

  const { highestPriorityGap, nextPriority, priorities: roadmap } = buildRecommendedRoadmap({
    projectRootDir: ROOT,
  });

  assert(
    '22. canonical ownership not highest gap',
    highestGapTitle(highestPriorityGap) !== 'Canonical Ownership V2 Registration',
    highestGapTitle(highestPriorityGap),
  );
  assert(
    '23. next priority not canonical ownership',
    nextPriority !== 'Canonical Ownership V2 Registration',
    nextPriority,
  );
  assert(
    '24. canonical ownership complete in roadmap',
    roadmap.some((p) => p.phase === 'Canonical Ownership V2 Registration' && p.action === 'COMPLETE'),
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
    console.error(`Canonical Ownership V2 Registration — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(CANONICAL_OWNERSHIP_V2_PASS_TOKEN);
  console.log(
    `Ownership: ${assessment.registeredCapabilities} registered, ${assessment.duplicateRisksResolved} overlaps resolved, audit gap closed`,
  );
}

main();
