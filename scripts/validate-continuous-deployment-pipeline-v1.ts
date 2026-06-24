/**
 * Continuous Deployment Pipeline V1 — validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildContinuousDeploymentPipelineV1ReportMarkdown,
  CONTINUOUS_DEPLOYMENT_PIPELINE_V1_ARTIFACT_DIR,
  CONTINUOUS_DEPLOYMENT_PIPELINE_V1_PASS_TOKEN,
  CONTINUOUS_DEPLOYMENT_PIPELINE_V1_REPORT_TITLE,
  MIN_DEPLOYMENT_CANDIDATES,
  MIN_PROMOTION_DECISIONS,
  runContinuousDeploymentPipelineV1,
} from '../src/continuous-deployment-pipeline-v1/index.js';
import { buildContinuousDeploymentPayload } from '../server/continuous-deployment-handler.js';
import {
  isProductionObservabilityPlatformProven,
  runProductionObservabilityPlatformV1,
} from '../src/production-observability-platform-v1/index.js';
import { isCustomerOperationsPlatformProven, runCustomerOperationsPlatformV1 } from '../src/customer-operations-platform-v1/index.js';
import { runStrategicCapabilityAuditV4 } from '../src/strategic-capability-audit-v4/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const ARTIFACT_DIR = join(ROOT, CONTINUOUS_DEPLOYMENT_PIPELINE_V1_ARTIFACT_DIR);
const REPORT_PATH = join(ROOT, CONTINUOUS_DEPLOYMENT_PIPELINE_V1_REPORT_TITLE);
const START = Date.now();
const MAX_RUNTIME_MS = 120_000;

const REGRESSION_SCRIPTS_REGISTERED = [
  'validate:production-observability-platform-v1',
  'validate:customer-operations-platform-v1',
  'validate:strategic-capability-audit-v4',
  'validate:operational-evidence-freshness-authority-v1',
  'validate:unified-failure-escalation-authority-v1',
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
  console.log('Continuous Deployment Pipeline V1 — Validation');
  console.log('===============================================');
  console.log('');

  checkpoint('start');

  if (!isCustomerOperationsPlatformProven(ROOT)) {
    runCustomerOperationsPlatformV1({ projectRootDir: ROOT });
  }
  if (!isProductionObservabilityPlatformProven(ROOT)) {
    runProductionObservabilityPlatformV1({ projectRootDir: ROOT });
  }

  const requiredFiles = [
    'src/continuous-deployment-pipeline-v1/continuous-deployment-pipeline-assessor.ts',
    'src/continuous-deployment-pipeline-v1/deployment-pipeline-catalog.ts',
    'src/continuous-deployment-pipeline-v1/index.ts',
    'server/continuous-deployment-handler.ts',
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

  assert('01. package script', Boolean(pkg.scripts?.['validate:continuous-deployment-pipeline-v1']), 'script');
  assert('02. operator section', manifest.includes("'Continuous Deployment'"), 'manifest');
  assert('03. server route', serverTs.includes('/api/founder/continuous-deployment-pipeline-v1'), 'route');
  assert('04. UI deployment candidates', appJs.includes('Deployment candidates'), 'candidates');
  assert('05. UI staging deployments', appJs.includes('Staging deployments'), 'staging');
  assert('06. UI production deployments', appJs.includes('Production deployments'), 'production');
  assert('07. UI promotion decisions', appJs.includes('Promotion decisions'), 'promotion');
  assert('08. UI rollback recommendations', appJs.includes('Rollback recommendations'), 'rollback');
  assert('09. UI deployment health', appJs.includes('Deployment health'), 'health');
  assert('10. UI deployment history', appJs.includes('Deployment history'), 'history');

  for (const script of REGRESSION_SCRIPTS_REGISTERED) {
    assert(`11. regression script registered: ${script}`, Boolean(pkg.scripts?.[script]), script);
  }

  const assessment = runContinuousDeploymentPipelineV1({ projectRootDir: ROOT });
  checkpoint('deployment pipeline assessment completed');

  const reportMarkdown = buildContinuousDeploymentPipelineV1ReportMarkdown(assessment);
  writeFileSync(REPORT_PATH, reportMarkdown, 'utf8');

  assert(
    '12. deployment candidates',
    assessment.deploymentCandidatesCreated >= MIN_DEPLOYMENT_CANDIDATES,
    String(assessment.deploymentCandidatesCreated),
  );
  assert(
    '13. promotion decisions',
    assessment.promotionDecisionsRecorded >= MIN_PROMOTION_DECISIONS,
    String(assessment.promotionDecisionsRecorded),
  );
  assert('14. candidate creation proven', assessment.candidateCreationProven, 'candidates');
  assert('15. promotion governance proven', assessment.promotionGovernanceProven, 'promotion');
  assert('16. staging before production proven', assessment.stagingBeforeProductionProven, 'staging');
  assert('17. deployment history proven', assessment.deploymentHistoryProven, 'history');
  assert('18. deployment health proven', assessment.deploymentHealthProven, 'health');
  assert('19. rollback recommendations proven', assessment.rollbackRecommendationsProven, 'rollback');
  assert('20. tenant isolation proven', assessment.tenantIsolationProven, 'isolation');
  assert('21. observability feed proven', assessment.productionObservabilityFeedProven, 'observability');
  assert('22. cloud execution feed proven', assessment.cloudExecutionFeedProven, 'cloud');
  assert('23. UFEA feed proven', assessment.unifiedFailureEscalationFeedProven, 'ufea');
  assert(
    '24. deployment proof status',
    assessment.deploymentProofStatus === 'PROVEN',
    assessment.deploymentProofStatus,
  );
  assert(
    '25. pass token',
    assessment.passToken === CONTINUOUS_DEPLOYMENT_PIPELINE_V1_PASS_TOKEN,
    assessment.passToken,
  );
  assert(
    '26. commercialization increased',
    assessment.commercializationImpact.projectedCommercializationScore >
      assessment.commercializationImpact.priorCommercializationScore,
    String(assessment.commercializationImpact.projectedCommercializationScore),
  );

  const artifactFiles = [
    'deployment-candidates.json',
    'deployment-lifecycle.json',
    'promotion-decisions.json',
    'deployment-history.json',
    'rollback-recommendations.json',
    'deployment-health.json',
    'commercialization-impact.json',
    'audit-impact.json',
    'assessment.json',
  ];
  for (const file of artifactFiles) {
    assert(`27. artifact ${file}`, existsSync(join(ARTIFACT_DIR, file)), file);
  }

  assert('28. report written', existsSync(REPORT_PATH), CONTINUOUS_DEPLOYMENT_PIPELINE_V1_REPORT_TITLE);

  const payload = buildContinuousDeploymentPayload({ projectRootDir: ROOT, refresh: false });
  assert('29. operator payload', payload.deploymentCandidates >= MIN_DEPLOYMENT_CANDIDATES, 'payload');

  const strategicAudit = runStrategicCapabilityAuditV4({ projectRootDir: ROOT });
  assert(
    '30. strategic commercialization increased',
    strategicAudit.commercializationReadiness.overallScore >= 88,
    String(strategicAudit.commercializationReadiness.overallScore),
  );
  assert(
    '31. CD complete in roadmap',
    strategicAudit.roadmapV4.some(
      (p) => p.phase === 'Continuous Deployment Pipeline' && p.action === 'COMPLETE',
    ),
    'COMPLETE action',
  );
  assert(
    '32. CD not highest gap',
    !strategicAudit.highestValueNextCapability.includes('Continuous Deployment Pipeline') ||
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
    console.error(`Continuous Deployment Pipeline V1 — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(CONTINUOUS_DEPLOYMENT_PIPELINE_V1_PASS_TOKEN);
  console.log(
    `Deployment pipeline: ${assessment.deploymentCandidatesCreated} candidates, ${assessment.promotionDecisionsRecorded} promotions, health ${assessment.deploymentHealth.postDeploymentHealthScore}/100`,
  );
}

main();
