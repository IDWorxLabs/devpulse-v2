/**
 * Strategic Capability Audit V4 — validation.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildStrategicCapabilityAuditV4ReportMarkdown,
  MIN_EVIDENCE_SOURCES_CONSUMED,
  STRATEGIC_CAPABILITY_AUDIT_V4_ARTIFACT_DIR,
  STRATEGIC_CAPABILITY_AUDIT_V4_PASS_TOKEN,
  STRATEGIC_CAPABILITY_AUDIT_V4_REPORT_TITLE,
  STRATEGIC_GAP_CATEGORIES,
  runStrategicCapabilityAuditV4,
} from '../src/strategic-capability-audit-v4/index.js';
import {
  isOperationalEvidenceFreshnessProven,
  runOperationalEvidenceFreshnessAuthorityV1,
} from '../src/operational-evidence-freshness-authority-v1/index.js';
import {
  isUnifiedFailureEscalationProven,
  runUnifiedFailureEscalationAuthorityV1,
} from '../src/unified-failure-escalation-authority-v1/index.js';
import {
  isMultiProjectConcurrentExecutionProven,
  runMultiProjectConcurrentExecutionV1,
} from '../src/multi-project-concurrent-execution-v1/index.js';
import {
  isCanonicalOwnershipV2Proven,
  runCanonicalOwnershipV2Registration,
} from '../src/canonical-ownership-v2/index.js';
import {
  isCustomerOperationsPlatformProven,
  runCustomerOperationsPlatformV1,
} from '../src/customer-operations-platform-v1/index.js';
import {
  isProductionObservabilityPlatformProven,
  runProductionObservabilityPlatformV1,
} from '../src/production-observability-platform-v1/index.js';
import {
  isContinuousDeploymentPipelineProven,
  runContinuousDeploymentPipelineV1,
} from '../src/continuous-deployment-pipeline-v1/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const ARTIFACT_DIR = join(ROOT, STRATEGIC_CAPABILITY_AUDIT_V4_ARTIFACT_DIR);
const REPORT_PATH = join(ROOT, STRATEGIC_CAPABILITY_AUDIT_V4_REPORT_TITLE);
const START = Date.now();
const MAX_RUNTIME_MS = 120_000;

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
  console.log('Strategic Capability Audit V4 — Validation');
  console.log('==========================================');
  console.log('');

  checkpoint('start');

  if (!isCanonicalOwnershipV2Proven(ROOT)) {
    runCanonicalOwnershipV2Registration({ projectRootDir: ROOT });
  }
  if (!isMultiProjectConcurrentExecutionProven(ROOT)) {
    runMultiProjectConcurrentExecutionV1({ projectRootDir: ROOT, resetRegistry: false, resetQueue: false });
  }
  if (!isUnifiedFailureEscalationProven(ROOT)) {
    runUnifiedFailureEscalationAuthorityV1({ projectRootDir: ROOT, resetRegistry: true });
  }
  if (!isOperationalEvidenceFreshnessProven(ROOT)) {
    runOperationalEvidenceFreshnessAuthorityV1({ projectRootDir: ROOT, resetRegistry: true });
  }
  if (!isCustomerOperationsPlatformProven(ROOT)) {
    runCustomerOperationsPlatformV1({ projectRootDir: ROOT });
  }
  if (!isProductionObservabilityPlatformProven(ROOT)) {
    runProductionObservabilityPlatformV1({ projectRootDir: ROOT });
  }
  if (!isContinuousDeploymentPipelineProven(ROOT)) {
    runContinuousDeploymentPipelineV1({ projectRootDir: ROOT });
  }

  const requiredFiles = [
    'src/strategic-capability-audit-v4/strategic-capability-audit-assessor.ts',
    'src/strategic-capability-audit-v4/strategic-evidence-collector.ts',
    'src/strategic-capability-audit-v4/index.ts',
  ];

  for (const rel of requiredFiles) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  assert('01. package script', Boolean(pkg.scripts?.['validate:strategic-capability-audit-v4']), 'script');

  const assessment = runStrategicCapabilityAuditV4({ projectRootDir: ROOT });
  checkpoint('audit completed');

  const reportMarkdown = buildStrategicCapabilityAuditV4ReportMarkdown(assessment);
  writeFileSync(REPORT_PATH, reportMarkdown, 'utf8');

  assert(
    '02. evidence sources consumed',
    assessment.evidenceSourcesConsumed >= MIN_EVIDENCE_SOURCES_CONSUMED,
    String(assessment.evidenceSourcesConsumed),
  );
  assert(
    '03. strategic dimensions assessed',
    assessment.strategicDimensionsAssessed >= STRATEGIC_GAP_CATEGORIES.length,
    String(assessment.strategicDimensionsAssessed),
  );
  assert('04. seven capability questions', assessment.capabilityQuestions.length === 7, 'questions');
  assert(
    '05. build software proven',
    assessment.capabilityQuestions[0]?.answer === 'PROVEN',
    assessment.capabilityQuestions[0]?.answer ?? 'missing',
  );
  assert(
    '06. verify software proven',
    assessment.capabilityQuestions[1]?.answer === 'PROVEN',
    assessment.capabilityQuestions[1]?.answer ?? 'missing',
  );
  assert(
    '07. factory readiness assessed',
    assessment.factoryReadiness.overallScore > 0,
    String(assessment.factoryReadiness.overallScore),
  );
  assert(
    '08. autonomy readiness assessed',
    assessment.autonomyReadiness.overallScore > 0,
    String(assessment.autonomyReadiness.overallScore),
  );
  assert(
    '09. commercialization readiness assessed',
    assessment.commercializationReadiness.overallScore > 0,
    String(assessment.commercializationReadiness.overallScore),
  );
  assert('10. roadmap v4 generated', assessment.roadmapV4.length >= 1, String(assessment.roadmapV4.length));
  assert(
    '11. highest value next capability',
    assessment.highestValueNextCapability.length > 20,
    assessment.highestValueNextCapability.slice(0, 60),
  );
  assert(
    '12. fresh roadmap not v3 clone',
    !assessment.roadmapV4.some((p) => p.phase === 'UVL Verification Execution' && p.action === 'BUILD'),
    'no stale UVL BUILD',
  );
  assert(
    '13. audit proof status',
    assessment.auditProofStatus === 'PROVEN',
    assessment.auditProofStatus,
  );
  assert(
    '14. pass token',
    assessment.passToken === STRATEGIC_CAPABILITY_AUDIT_V4_PASS_TOKEN,
    assessment.passToken,
  );

  const artifactFiles = [
    'assessment.json',
    'roadmap-v4.json',
    'remaining-gaps.json',
    'factory-readiness.json',
    'autonomy-readiness.json',
    'commercialization-readiness.json',
  ];
  for (const file of artifactFiles) {
    assert(`15. artifact ${file}`, existsSync(join(ARTIFACT_DIR, file)), file);
  }

  assert('16. report written', existsSync(REPORT_PATH), STRATEGIC_CAPABILITY_AUDIT_V4_REPORT_TITLE);

  if (isCustomerOperationsPlatformProven(ROOT)) {
    assert(
      '17. commercialization increased with COP',
      assessment.commercializationReadiness.overallScore >= 75,
      String(assessment.commercializationReadiness.overallScore),
    );
    assert(
      '18. customer ops complete in roadmap',
      assessment.roadmapV4.some(
        (p) => p.phase === 'Customer Operations Platform' && p.action === 'COMPLETE',
      ),
      'COMPLETE action',
    );
    if (isProductionObservabilityPlatformProven(ROOT)) {
      assert(
        '19. commercialization increased with POP',
        assessment.commercializationReadiness.overallScore >= 85,
        String(assessment.commercializationReadiness.overallScore),
      );
      assert(
        '20. observability complete in roadmap',
        assessment.roadmapV4.some(
          (p) => p.phase === 'Production Observability Platform' && p.action === 'COMPLETE',
        ),
        'COMPLETE action',
      );
      if (isContinuousDeploymentPipelineProven(ROOT)) {
        assert(
          '21. commercialization increased with CD',
          assessment.commercializationReadiness.overallScore >= 88,
          String(assessment.commercializationReadiness.overallScore),
        );
        assert(
          '22. CD complete in roadmap',
          assessment.roadmapV4.some(
            (p) => p.phase === 'Continuous Deployment Pipeline' && p.action === 'COMPLETE',
          ),
          'COMPLETE action',
        );
        assert(
          '23. GP complete in roadmap',
          assessment.roadmapV4.some(
            (p) => p.phase === 'General-Purpose Code Generation' && p.action === 'COMPLETE',
          ),
          'COMPLETE action',
        );
        assert(
          '24. GP not top strategic gap',
          !assessment.highestValueNextCapability.includes('General-Purpose Code Generation') ||
            assessment.highestValueNextCapability.includes('Operational Excellence'),
          assessment.highestValueNextCapability.slice(0, 80),
        );
        assert(
          '25. evidence-driven top priority',
          assessment.roadmapV4[0]?.action !== 'EXTEND' ||
            assessment.roadmapV4[0]?.phase !== 'General-Purpose Code Generation',
          `${assessment.roadmapV4[0]?.phase ?? 'n/a'} ${assessment.roadmapV4[0]?.action ?? ''}`,
        );
      } else {
        assert(
          '21. next priority continuous deployment',
          assessment.roadmapV4[0]?.phase === 'Continuous Deployment Pipeline' ||
            assessment.highestValueNextCapability.includes('Continuous Deployment'),
          assessment.roadmapV4[0]?.phase ?? 'n/a',
        );
      }
    } else {
      assert(
        '19. next priority observability',
        assessment.roadmapV4[0]?.phase === 'Production Observability Platform' ||
          assessment.highestValueNextCapability.includes('Production Observability'),
        assessment.roadmapV4[0]?.phase ?? 'n/a',
      );
    }
  }

  checkpoint('artifacts verified');

  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed.length > 0) {
    console.error(`Strategic Capability Audit V4 — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(STRATEGIC_CAPABILITY_AUDIT_V4_PASS_TOKEN);
  console.log(
    `Strategic audit: factory ${assessment.factoryReadiness.overallScore}/100, no major gaps ${assessment.noMajorGapsConclusion ? 'YES' : 'NO'}, next: ${assessment.roadmapV4[0]?.phase ?? 'n/a'}`,
  );
}

main();
