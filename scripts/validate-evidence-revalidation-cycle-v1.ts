/**
 * Evidence Revalidation Cycle V1 — validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildEvidenceRevalidationCycleV1ReportMarkdown,
  EVIDENCE_REVALIDATION_CYCLE_V1_ARTIFACT_DIR,
  EVIDENCE_REVALIDATION_CYCLE_V1_PASS_TOKEN,
  EVIDENCE_REVALIDATION_CYCLE_V1_REPORT_TITLE,
  MIN_EXPIRED_REFRESHED,
  runEvidenceRevalidationCycleV1,
} from '../src/evidence-revalidation-cycle-v1/index.js';
import { buildEvidenceRevalidationPayload } from '../server/evidence-revalidation-handler.js';
import {
  isOperationalEvidenceFreshnessProven,
  runOperationalEvidenceFreshnessAuthorityV1,
} from '../src/operational-evidence-freshness-authority-v1/index.js';
import { runStrategicCapabilityAuditV4 } from '../src/strategic-capability-audit-v4/index.js';
import { buildOperationalMaturityReport } from '../src/capability-audit-v3/operational-maturity.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const ARTIFACT_DIR = join(ROOT, EVIDENCE_REVALIDATION_CYCLE_V1_ARTIFACT_DIR);
const REPORT_PATH = join(ROOT, EVIDENCE_REVALIDATION_CYCLE_V1_REPORT_TITLE);
const START = Date.now();
const MAX_RUNTIME_MS = 120_000;

const REGRESSION_SCRIPTS_REGISTERED = [
  'validate:strategic-audit-roadmap-consistency-repair-v1',
  'validate:operational-evidence-freshness-authority-v1',
  'validate:continuous-deployment-pipeline-v1',
  'validate:production-observability-platform-v1',
  'validate:customer-operations-platform-v1',
  'validate:unified-failure-escalation-authority-v1',
  'validate:canonical-ownership-v2',
  'validate:capability-audit-v3-1',
  'validate:strategic-capability-audit-v4',
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

function main(): void {
  console.log('');
  console.log('Evidence Revalidation Cycle V1 — Validation');
  console.log('===========================================');
  console.log('');

  checkpoint('start');

  if (!isOperationalEvidenceFreshnessProven(ROOT)) {
    runOperationalEvidenceFreshnessAuthorityV1({ projectRootDir: ROOT });
  }

  const requiredFiles = [
    'src/evidence-revalidation-cycle-v1/evidence-revalidation-cycle-assessor.ts',
    'src/evidence-revalidation-cycle-v1/revalidation-planner.ts',
    'src/evidence-revalidation-cycle-v1/evidence-revalidation-runner.ts',
    'src/evidence-revalidation-cycle-v1/index.ts',
    'server/evidence-revalidation-handler.ts',
  ];

  for (const rel of requiredFiles) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }

  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8').slice(0, 4_000_000);
  const manifest = readFileSync(join(ROOT, 'server/command-center-shell-manifest.ts'), 'utf8');
  const serverTs = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8');
  const ufeaCollector = readFileSync(
    join(ROOT, 'src/unified-failure-escalation-authority-v1/failure-evidence-collector.ts'),
    'utf8',
  );
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  assert('01. package script', Boolean(pkg.scripts?.['validate:evidence-revalidation-cycle-v1']), 'script');
  assert('02. operator section', manifest.includes("'Evidence Revalidation'"), 'manifest');
  assert('03. server route', serverTs.includes('/api/founder/evidence-revalidation-cycle-v1'), 'route');
  assert('04. UI Fresh count', appJs.includes('Fresh:'), 'fresh');
  assert('05. UI Aging count', appJs.includes('Aging:'), 'aging');
  assert('06. UI Stale count', appJs.includes('Stale:'), 'stale');
  assert('07. UI Expired count', appJs.includes('Expired:'), 'expired');
  assert('08. UI Revalidating count', appJs.includes('Revalidating:'), 'revalidating');
  assert('09. UI Recently Refreshed', appJs.includes('Recently Refreshed:'), 'refreshed');
  assert('10. UFEA integration', ufeaCollector.includes('evidence-revalidation-cycle-v1'), 'ufea');

  for (const script of REGRESSION_SCRIPTS_REGISTERED) {
    assert(`11. regression script registered: ${script}`, Boolean(pkg.scripts?.[script]), script);
  }

  const assessment = runEvidenceRevalidationCycleV1({ projectRootDir: ROOT });
  checkpoint('revalidation cycle assessment completed');

  const reportMarkdown = buildEvidenceRevalidationCycleV1ReportMarkdown(assessment);
  writeFileSync(REPORT_PATH, reportMarkdown, 'utf8');

  assert('12. OEFA consumed', assessment.oefaConsumed, 'oefa');
  assert('13. governance planner used', assessment.governancePlannerUsed, 'governance');
  assert('14. expired discovered', assessment.expiredDiscovered >= MIN_EXPIRED_REFRESHED, String(assessment.expiredDiscovered));
  assert('15. expired refreshed', assessment.expiredRefreshed >= MIN_EXPIRED_REFRESHED, String(assessment.expiredRefreshed));
  assert('16. revalidation scheduled', assessment.revalidationScheduled >= MIN_EXPIRED_REFRESHED, String(assessment.revalidationScheduled));
  assert('17. revalidation succeeded', assessment.revalidationSucceeded >= MIN_EXPIRED_REFRESHED, String(assessment.revalidationSucceeded));
  assert('18. revalidation failed zero', assessment.revalidationFailed === 0, String(assessment.revalidationFailed));
  assert('19. confidence recovered', assessment.confidenceRecoveryPoints > 0, String(assessment.confidenceRecoveryPoints));
  assert('20. freshness increased', assessment.overallFreshnessAfter >= assessment.overallFreshnessBefore, `${assessment.overallFreshnessBefore}→${assessment.overallFreshnessAfter}`);
  assert('21. expired gap closed', assessment.auditImpact.expiredEvidenceGapClosed, 'gap closed');
  assert('22. revalidation proof status', assessment.revalidationProofStatus === 'PROVEN', assessment.revalidationProofStatus);
  assert('23. pass token', assessment.passToken === EVIDENCE_REVALIDATION_CYCLE_V1_PASS_TOKEN, assessment.passToken);

  const artifactFiles = [
    'revalidation-registry.json',
    'revalidation-queue.json',
    'revalidation-results.json',
    'confidence-recovery.json',
    'freshness-updates.json',
    'audit-impact.json',
    'assessment.json',
  ];
  for (const file of artifactFiles) {
    assert(`24. artifact ${file}`, existsSync(join(ARTIFACT_DIR, file)), file);
  }

  assert('25. report written', existsSync(REPORT_PATH), EVIDENCE_REVALIDATION_CYCLE_V1_REPORT_TITLE);

  const payload = buildEvidenceRevalidationPayload({ projectRootDir: ROOT, refresh: false });
  assert('26. operator payload', payload.expiredRefreshed >= MIN_EXPIRED_REFRESHED, 'payload');

  const ops = buildOperationalMaturityReport(ROOT);
  assert('27. capability audit fresh count', ops.evidenceRevalidation.freshEvidenceCount > 0, String(ops.evidenceRevalidation.freshEvidenceCount));
  assert('28. capability audit revalidated count', ops.evidenceRevalidation.revalidatedEvidenceCount >= MIN_EXPIRED_REFRESHED, String(ops.evidenceRevalidation.revalidatedEvidenceCount));
  assert('29. capability audit confidence recovery', ops.evidenceRevalidation.confidenceRecovered > 0, String(ops.evidenceRevalidation.confidenceRecovered));
  assert('30. capability audit expired zero', ops.evidenceRevalidation.expiredEvidenceCount === 0, String(ops.evidenceRevalidation.expiredEvidenceCount));

  const strategicAudit = runStrategicCapabilityAuditV4({ projectRootDir: ROOT });
  assert(
    '31. evidence revalidation complete in roadmap',
    strategicAudit.roadmapV4.some(
      (p) => p.phase === 'Evidence Revalidation Cycle' && p.action === 'COMPLETE',
    ),
    'COMPLETE action',
  );
  assert(
    '32. expired evidence not highest gap',
    !strategicAudit.highestValueNextCapability.includes('Expired operational evidence'),
    strategicAudit.highestValueNextCapability.slice(0, 100),
  );
  assert(
    '33. operational excellence priority',
    strategicAudit.highestValueNextCapability.includes('Operational Excellence') ||
      strategicAudit.highestValueNextCapability.includes('Operational Monitoring') ||
      strategicAudit.highestValueNextCapability.includes('maintain'),
    strategicAudit.highestValueNextCapability.slice(0, 100),
  );

  checkpoint('strategic audit impact verified');

  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed.length > 0) {
    console.error(`Evidence Revalidation Cycle V1 — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(EVIDENCE_REVALIDATION_CYCLE_V1_PASS_TOKEN);
  console.log(
    `Revalidation cycle: ${assessment.expiredRefreshed} expired refreshed, confidence +${assessment.confidenceRecoveryPoints}, freshness ${assessment.overallFreshnessBefore}→${assessment.overallFreshnessAfter}`,
  );
}

main();
