/**
 * Customer Operations Platform V1 — validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildCustomerOperationsPlatformV1ReportMarkdown,
  CUSTOMER_OPERATIONS_PLATFORM_V1_ARTIFACT_DIR,
  CUSTOMER_OPERATIONS_PLATFORM_V1_PASS_TOKEN,
  CUSTOMER_OPERATIONS_PLATFORM_V1_REPORT_TITLE,
  MIN_CUSTOMERS_PROVEN,
  MIN_PROJECTS_REGISTERED,
  MIN_TENANTS_PROVEN,
  PLAN_TYPES,
  runCustomerOperationsPlatformV1,
} from '../src/customer-operations-platform-v1/index.js';
import { buildCustomerOperationsPayload } from '../server/customer-operations-handler.js';
import { runStrategicCapabilityAuditV4 } from '../src/strategic-capability-audit-v4/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const ARTIFACT_DIR = join(ROOT, CUSTOMER_OPERATIONS_PLATFORM_V1_ARTIFACT_DIR);
const REPORT_PATH = join(ROOT, CUSTOMER_OPERATIONS_PLATFORM_V1_REPORT_TITLE);
const START = Date.now();
const MAX_RUNTIME_MS = 120_000;

const REGRESSION_SCRIPTS_REGISTERED = [
  'validate:strategic-capability-audit-v4',
  'validate:operational-evidence-freshness-authority-v1',
  'validate:unified-failure-escalation-authority-v1',
  'validate:multi-project-concurrent-execution-v1',
  'validate:canonical-ownership-v2',
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

function main(): void {
  console.log('');
  console.log('Customer Operations Platform V1 — Validation');
  console.log('==============================================');
  console.log('');

  checkpoint('start');

  const requiredFiles = [
    'src/customer-operations-platform-v1/customer-operations-platform-assessor.ts',
    'src/customer-operations-platform-v1/tenant-isolation-assessment.ts',
    'src/customer-operations-platform-v1/index.ts',
    'server/customer-operations-handler.ts',
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

  assert('01. package script', Boolean(pkg.scripts?.['validate:customer-operations-platform-v1']), 'script');
  assert('02. operator section', manifest.includes("'Customer Operations'"), 'manifest');
  assert('03. server route', serverTs.includes('/api/founder/customer-operations-platform-v1'), 'route');
  assert('04. UI customers', appJs.includes('Customers'), 'customers');
  assert('05. UI tenants', appJs.includes('Tenants'), 'tenants');
  assert('06. UI projects panel', appJs.includes('Projects'), 'projects');
  assert('07. UI usage', appJs.includes('Usage'), 'usage');
  assert('08. UI plan distribution', appJs.includes('Plan distribution'), 'plans');
  assert('09. UI activation metrics', appJs.includes('Activation metrics'), 'activation');
  assert('10. UI isolation status', appJs.includes('Isolation status'), 'isolation');

  for (const script of REGRESSION_SCRIPTS_REGISTERED) {
    assert(`11. regression script registered: ${script}`, Boolean(pkg.scripts?.[script]), script);
  }

  const assessment = runCustomerOperationsPlatformV1({ projectRootDir: ROOT });
  checkpoint('platform assessment completed');

  const reportMarkdown = buildCustomerOperationsPlatformV1ReportMarkdown(assessment);
  writeFileSync(REPORT_PATH, reportMarkdown, 'utf8');

  assert(
    '12. customers registered',
    assessment.customersRegistered >= MIN_CUSTOMERS_PROVEN,
    String(assessment.customersRegistered),
  );
  assert(
    '13. tenants active',
    assessment.tenantsActive >= MIN_TENANTS_PROVEN,
    String(assessment.tenantsActive),
  );
  assert(
    '14. projects registered',
    assessment.projectsRegistered >= MIN_PROJECTS_REGISTERED,
    String(assessment.projectsRegistered),
  );
  assert('15. onboarding proven', assessment.onboardingProven, 'onboarding');
  assert('16. tenant isolation proven', assessment.tenantIsolationProven, 'isolation');
  assert('17. project ownership proven', assessment.projectOwnershipProven, 'ownership');
  assert('18. usage tracking proven', assessment.usageTrackingProven, 'usage');
  assert('19. subscription readiness proven', assessment.subscriptionReadinessProven, 'subscription');
  assert('20. execution tagging proven', assessment.executionTaggingProven, 'tagging');
  assert(
    '21. plan types',
    assessment.subscriptionPlans.length >= PLAN_TYPES.length,
    String(assessment.subscriptionPlans.length),
  );
  assert(
    '22. platform proof status',
    assessment.platformProofStatus === 'PROVEN',
    assessment.platformProofStatus,
  );
  assert(
    '23. pass token',
    assessment.passToken === CUSTOMER_OPERATIONS_PLATFORM_V1_PASS_TOKEN,
    assessment.passToken,
  );
  assert(
    '24. commercialization increased',
    assessment.commercializationImpact.projectedCommercializationScore >
      assessment.commercializationImpact.priorCommercializationScore,
    String(assessment.commercializationImpact.projectedCommercializationScore),
  );

  const artifactFiles = [
    'customer-registry.json',
    'tenant-registry.json',
    'project-ownership.json',
    'usage-tracking.json',
    'subscription-readiness.json',
    'tenant-isolation.json',
    'support-registry.json',
    'commercialization-impact.json',
    'assessment.json',
  ];
  for (const file of artifactFiles) {
    assert(`25. artifact ${file}`, existsSync(join(ARTIFACT_DIR, file)), file);
  }

  assert('26. report written', existsSync(REPORT_PATH), CUSTOMER_OPERATIONS_PLATFORM_V1_REPORT_TITLE);

  const payload = buildCustomerOperationsPayload({ projectRootDir: ROOT, refresh: false });
  assert('27. operator payload', payload.customers >= MIN_CUSTOMERS_PROVEN, 'payload');

  const strategicAudit = runStrategicCapabilityAuditV4({ projectRootDir: ROOT });
  assert(
    '28. strategic audit commercialization increased',
    strategicAudit.commercializationReadiness.overallScore >= 75,
    String(strategicAudit.commercializationReadiness.overallScore),
  );
  assert(
    '29. customer ops not highest gap',
    !strategicAudit.highestValueNextCapability.includes('Customer Operations Platform') ||
      strategicAudit.highestValueNextCapability.includes('Production Observability'),
    strategicAudit.highestValueNextCapability.slice(0, 80),
  );
  assert(
    '30. customer ops complete in roadmap',
    strategicAudit.roadmapV4.some(
      (p) => p.phase === 'Customer Operations Platform' && p.action === 'COMPLETE',
    ),
    'COMPLETE action',
  );

  checkpoint('strategic audit impact verified');

  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed.length > 0) {
    console.error(`Customer Operations Platform V1 — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(CUSTOMER_OPERATIONS_PLATFORM_V1_PASS_TOKEN);
  console.log(
    `Customer ops: ${assessment.customersRegistered} customers, ${assessment.projectsRegistered} projects, isolation ${assessment.tenantIsolation.isolationViolations} violations, commercialization ${assessment.commercializationImpact.projectedCommercializationScore}/100`,
  );
}

main();
