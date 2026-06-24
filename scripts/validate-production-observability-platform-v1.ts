/**
 * Production Observability Platform V1 — validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildProductionObservabilityPlatformV1ReportMarkdown,
  MIN_APPLICATIONS_OBSERVED,
  MIN_DEPLOYMENTS_TRACKED,
  PRODUCTION_OBSERVABILITY_PLATFORM_V1_ARTIFACT_DIR,
  PRODUCTION_OBSERVABILITY_PLATFORM_V1_PASS_TOKEN,
  PRODUCTION_OBSERVABILITY_PLATFORM_V1_REPORT_TITLE,
  runProductionObservabilityPlatformV1,
} from '../src/production-observability-platform-v1/index.js';
import { buildProductionObservabilityPayload } from '../server/production-observability-handler.js';
import { isCustomerOperationsPlatformProven, runCustomerOperationsPlatformV1 } from '../src/customer-operations-platform-v1/index.js';
import { runStrategicCapabilityAuditV4 } from '../src/strategic-capability-audit-v4/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const ARTIFACT_DIR = join(ROOT, PRODUCTION_OBSERVABILITY_PLATFORM_V1_ARTIFACT_DIR);
const REPORT_PATH = join(ROOT, PRODUCTION_OBSERVABILITY_PLATFORM_V1_REPORT_TITLE);
const START = Date.now();
const MAX_RUNTIME_MS = 120_000;

const REGRESSION_SCRIPTS_REGISTERED = [
  'validate:customer-operations-platform-v1',
  'validate:strategic-capability-audit-v4',
  'validate:operational-evidence-freshness-authority-v1',
  'validate:unified-failure-escalation-authority-v1',
  'validate:canonical-ownership-v2',
  'validate:capability-audit-v3-1',
  'validate:continuous-deployment-pipeline-v1',
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
  console.log('Production Observability Platform V1 — Validation');
  console.log('================================================');
  console.log('');

  checkpoint('start');

  if (!isCustomerOperationsPlatformProven(ROOT)) {
    runCustomerOperationsPlatformV1({ projectRootDir: ROOT });
  }

  const requiredFiles = [
    'src/production-observability-platform-v1/production-observability-platform-assessor.ts',
    'src/production-observability-platform-v1/production-incident-detector.ts',
    'src/production-observability-platform-v1/index.ts',
    'server/production-observability-handler.ts',
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

  assert('01. package script', Boolean(pkg.scripts?.['validate:production-observability-platform-v1']), 'script');
  assert('02. operator section', manifest.includes("'Production Observability'"), 'manifest');
  assert('03. server route', serverTs.includes('/api/founder/production-observability-platform-v1'), 'route');
  assert('04. UI healthy apps', appJs.includes('Healthy apps'), 'healthy');
  assert('05. UI warning apps', appJs.includes('Warning apps'), 'warning');
  assert('06. UI critical apps', appJs.includes('Critical apps'), 'critical');
  assert('07. UI availability score', appJs.includes('Availability score'), 'availability');
  assert('08. UI open incidents', appJs.includes('Open incidents'), 'incidents');
  assert('09. UI incident severity', appJs.includes('Incident severity'), 'severity');
  assert('10. UI recovery recommendations', appJs.includes('Recovery recommendations'), 'recovery');

  for (const script of REGRESSION_SCRIPTS_REGISTERED) {
    assert(`11. regression script registered: ${script}`, Boolean(pkg.scripts?.[script]), script);
  }

  const assessment = runProductionObservabilityPlatformV1({ projectRootDir: ROOT });
  checkpoint('observability assessment completed');

  const reportMarkdown = buildProductionObservabilityPlatformV1ReportMarkdown(assessment);
  writeFileSync(REPORT_PATH, reportMarkdown, 'utf8');

  assert(
    '12. applications observed',
    assessment.applicationsObserved >= MIN_APPLICATIONS_OBSERVED,
    String(assessment.applicationsObserved),
  );
  assert(
    '13. deployments tracked',
    assessment.deploymentsTracked >= MIN_DEPLOYMENTS_TRACKED,
    String(assessment.deploymentsTracked),
  );
  assert('14. application health proven', assessment.applicationHealthProven, 'health');
  assert('15. deployment tracking proven', assessment.deploymentTrackingProven, 'deployments');
  assert('16. availability monitoring proven', assessment.availabilityMonitoringProven, 'availability');
  assert('17. incident detection proven', assessment.incidentDetectionProven, 'incidents');
  assert('18. customer impact tracking proven', assessment.customerImpactTrackingProven, 'impact');
  assert('19. recovery recommendations proven', assessment.recoveryRecommendationsProven, 'recovery');
  assert('20. tenant isolation proven', assessment.tenantIsolationProven, 'isolation');
  assert('21. UFEA feed proven', assessment.unifiedFailureEscalationFeedProven, 'ufea');
  assert(
    '22. observability proof status',
    assessment.observabilityProofStatus === 'PROVEN',
    assessment.observabilityProofStatus,
  );
  assert(
    '23. pass token',
    assessment.passToken === PRODUCTION_OBSERVABILITY_PLATFORM_V1_PASS_TOKEN,
    assessment.passToken,
  );
  assert(
    '24. commercialization increased',
    assessment.commercializationImpact.projectedCommercializationScore >
      assessment.commercializationImpact.priorCommercializationScore,
    String(assessment.commercializationImpact.projectedCommercializationScore),
  );

  const artifactFiles = [
    'application-health.json',
    'deployment-registry.json',
    'runtime-metrics.json',
    'availability-assessment.json',
    'incident-registry.json',
    'recovery-recommendations.json',
    'commercialization-impact.json',
    'audit-impact.json',
    'assessment.json',
  ];
  for (const file of artifactFiles) {
    assert(`25. artifact ${file}`, existsSync(join(ARTIFACT_DIR, file)), file);
  }

  assert('26. report written', existsSync(REPORT_PATH), PRODUCTION_OBSERVABILITY_PLATFORM_V1_REPORT_TITLE);

  const payload = buildProductionObservabilityPayload({ projectRootDir: ROOT, refresh: false });
  assert('27. operator payload', payload.healthyApps + payload.warningApps > 0, 'payload');

  const strategicAudit = runStrategicCapabilityAuditV4({ projectRootDir: ROOT });
  assert(
    '28. strategic commercialization increased',
    strategicAudit.commercializationReadiness.overallScore >= 85,
    String(strategicAudit.commercializationReadiness.overallScore),
  );
  assert(
    '29. observability complete in roadmap',
    strategicAudit.roadmapV4.some(
      (p) => p.phase === 'Production Observability Platform' && p.action === 'COMPLETE',
    ),
    'COMPLETE action',
  );
  assert(
    '30. observability not highest gap',
    !strategicAudit.highestValueNextCapability.includes('Production Observability Platform') ||
      strategicAudit.highestValueNextCapability.includes('Operational Excellence') ||
      strategicAudit.highestValueNextCapability.includes('Bounded autonomous'),
    strategicAudit.highestValueNextCapability.slice(0, 80),
  );

  checkpoint('strategic audit impact verified');

  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed.length > 0) {
    console.error(`Production Observability Platform V1 — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(PRODUCTION_OBSERVABILITY_PLATFORM_V1_PASS_TOKEN);
  console.log(
    `Observability: ${assessment.applicationsObserved} apps, ${assessment.incidentRegistry.openIncidents} open incidents, availability ${assessment.availabilityAssessment.overallAvailabilityScore}/100`,
  );
}

main();
