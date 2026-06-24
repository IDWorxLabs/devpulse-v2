/**
 * AiDevEngine Capability Audit V3.1 — validation (UVL evidence refresh, read-only).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AIDEVENGINE_CAPABILITY_AUDIT_V3_1_PASS_TOKEN,
  AIDEVENGINE_CAPABILITY_AUDIT_V3_PASS_TOKEN,
  AUDIT_CATEGORIES_V3,
  CAPABILITY_AUDIT_V3_REPORT_TITLE,
  CAPABILITY_INVENTORY_V3,
  PRIOR_PASS_TOKENS,
  REQUIRED_INVENTORY_V3,
  buildCapabilityAuditV3Assessment,
  buildCapabilityAuditV3ReportMarkdown,
  buildDuplicateRiskAnalysis,
  buildMaturityMatrix,
  buildMissingCapabilitiesReport,
  buildRecommendedRoadmap,
  buildUvlEvidenceRefreshArtifact,
  loadUvlEvidenceSnapshot,
} from '../src/capability-audit-v3/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const REPORT_PATH = join(ROOT, CAPABILITY_AUDIT_V3_REPORT_TITLE);
const ASSESSMENT_DIR = join(ROOT, '.capability-audit-v3-1');
const LEGACY_ASSESSMENT_DIR = join(ROOT, '.capability-audit-v3');

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

assert(
  'capability audit v3 module exists',
  existsSync(join(ROOT, 'src/capability-audit-v3/index.ts')),
  'src/capability-audit-v3/index.ts',
);

const evidence = loadUvlEvidenceSnapshot(ROOT);
const assessment = buildCapabilityAuditV3Assessment(ROOT);
const duplicateRisk = buildDuplicateRiskAnalysis();
const missingCapabilities = buildMissingCapabilitiesReport({
  projectRootDir: ROOT,
  productionReadinessScore: assessment.productionReadiness.productionReadinessScore,
  codeGenerationMaturityScore: assessment.codeGeneration.codeGenerationMaturityScore,
});
const { priorities: roadmap, world2IsNextPhase, nextPriority, highestPriorityGap } =
  buildRecommendedRoadmap({
    projectRootDir: ROOT,
    productionReadinessScore: assessment.productionReadiness.productionReadinessScore,
    codeGenerationMaturityScore: assessment.codeGeneration.codeGenerationMaturityScore,
  });
const maturityMatrix = buildMaturityMatrix(assessment);
const uvlRefresh = assessment.uvlEvidenceRefresh;
const uvlRefreshArtifact = buildUvlEvidenceRefreshArtifact(evidence);

const reportMarkdown = buildCapabilityAuditV3ReportMarkdown({
  assessment,
  duplicateRisk,
  missingCapabilities,
  roadmap,
});

function writeArtifacts(dir: string): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'assessment.json'), `${JSON.stringify(assessment, null, 2)}\n`, 'utf8');
  writeFileSync(
    join(dir, 'maturity-matrix.json'),
    `${JSON.stringify({ generatedAt: assessment.generatedAt, entries: maturityMatrix }, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'duplicate-risk-analysis.json'),
    `${JSON.stringify(duplicateRisk, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'operational-maturity.json'),
    `${JSON.stringify(assessment.operationalMaturity, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'recommended-roadmap.json'),
    `${JSON.stringify(
      {
        generatedAt: assessment.generatedAt,
        world2IsNextPhase,
        nextPriority,
        highestPriorityGap,
        priorities: roadmap,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'missing-capabilities.json'),
    `${JSON.stringify(missingCapabilities, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'uvl-evidence-refresh.json'),
    `${JSON.stringify(uvlRefreshArtifact, null, 2)}\n`,
    'utf8',
  );
}

writeArtifacts(ASSESSMENT_DIR);
writeArtifacts(LEGACY_ASSESSMENT_DIR);
writeFileSync(REPORT_PATH, reportMarkdown, 'utf8');

assert('report written', existsSync(REPORT_PATH), CAPABILITY_AUDIT_V3_REPORT_TITLE);
assert(
  'v3.1 assessment artifacts written',
  [
    'assessment.json',
    'maturity-matrix.json',
    'duplicate-risk-analysis.json',
    'operational-maturity.json',
    'recommended-roadmap.json',
    'missing-capabilities.json',
    'uvl-evidence-refresh.json',
  ].every((file) => existsSync(join(ASSESSMENT_DIR, file))),
  '.capability-audit-v3-1/',
);

const reportBody = readFileSync(REPORT_PATH, 'utf8');
assert(
  'report contains v3.1 pass token',
  reportBody.includes(AIDEVENGINE_CAPABILITY_AUDIT_V3_1_PASS_TOKEN),
  AIDEVENGINE_CAPABILITY_AUDIT_V3_1_PASS_TOKEN,
);

const requiredSections = [
  '## Executive Summary',
  '### Coverage Breakdown (Evidence-Driven)',
  '## Operational Reality Assessment',
  '## Recommended Roadmap V3',
  'Is UVL Verification Execution still missing?',
];

for (const section of requiredSections) {
  assert(`report section: ${section}`, reportBody.includes(section), section);
}

assert(
  'UVL evidence artifacts consumed',
  uvlRefresh.consumedArtifacts.every((artifact) => {
    const fileName = artifact.split('/').pop() ?? artifact;
    if (fileName.endsWith('.md')) {
      return existsSync(join(ROOT, fileName));
    }
    return existsSync(join(ROOT, artifact));
  }),
  uvlRefresh.consumedArtifacts.join(', '),
);

assert(
  'UVL verification execution complete',
  uvlRefresh.uvlVerificationExecutionComplete,
  `${uvlRefresh.verifiedCount}/${uvlRefresh.categoriesRequired} @ ${uvlRefresh.verificationCoveragePercent}%`,
);

assert(
  'verified count 15/15',
  uvlRefresh.verifiedCount >= 15 && uvlRefresh.categoriesRequired >= 15,
  `${uvlRefresh.verifiedCount}/${uvlRefresh.categoriesRequired}`,
);

assert(
  'verification coverage 100%',
  uvlRefresh.verificationCoveragePercent >= 100,
  String(uvlRefresh.verificationCoveragePercent),
);

assert(
  'verification confidence 100/100',
  uvlRefresh.verificationConfidenceScore >= 100,
  String(uvlRefresh.verificationConfidenceScore),
);

assert(
  'UVL verification execution is NOT rank 1',
  nextPriority !== 'UVL Verification Execution',
  nextPriority,
);

assert(
  'UVL not highest gap',
  !assessment.highestPriorityGap.includes('UVL Verification Execution') &&
    !assessment.highestPriorityGap.includes('UVL full verification'),
  assessment.highestPriorityGap.slice(0, 80),
);

assert(
  'verification is not blocking gap',
  assessment.operationalMaturity.verificationIsBlockingGap === false,
  'verification complete',
);

assert(
  'full pipeline proven across suite',
  assessment.operationalMaturity.fullPipelineProvenAcrossSuite === true,
  '15/15 build + preview + verification + AFLA',
);

assert(
  'coverage breakdown in operational maturity',
  assessment.operationalMaturity.coverageEvidence.verificationCoverage.count >= 15,
  `${assessment.operationalMaturity.coverageEvidence.verificationCoverage.count}/15`,
);

assert(
  'assessment version v3.1',
  assessment.version === 'V3.1',
  assessment.version,
);

assert(
  'assessment pass token v3.1',
  assessment.passToken === AIDEVENGINE_CAPABILITY_AUDIT_V3_1_PASS_TOKEN,
  assessment.passToken,
);

assert(
  'UVL pass token in prior tokens',
  PRIOR_PASS_TOKENS.includes('UVL_VERIFICATION_EXECUTION_V1_PASS'),
  'UVL_VERIFICATION_EXECUTION_V1_PASS',
);

assert(
  'UVL Verification Execution V1 in inventory',
  CAPABILITY_INVENTORY_V3.some((entry) => entry.name === 'UVL Verification Execution V1'),
  'UVL Verification Execution V1',
);

assert(
  'world2 is not next phase',
  assessment.world2Assessment.shouldBeNextPhase === false,
  assessment.world2Assessment.nextPhaseRationale.slice(0, 80),
);

assert(
  'real build execution marked complete',
  roadmap.some((p) => p.phase === 'Real Build Execution Pipeline' && p.action === 'COMPLETE'),
  'COMPLETE action',
);

assert(
  'UVL verification execution marked complete',
  roadmap.some((p) => p.phase === 'UVL Verification Execution' && p.action === 'COMPLETE'),
  'COMPLETE action',
);

assert(
  'operational maturity score valid',
  assessment.operationalMaturity.operationalMaturityScore >= 70 &&
    assessment.operationalMaturity.operationalMaturityScore <= 100,
  String(assessment.operationalMaturity.operationalMaturityScore),
);

assert(
  'inventory covers all audit categories',
  AUDIT_CATEGORIES_V3.every((cat) =>
    CAPABILITY_INVENTORY_V3.some((entry) => entry.category === cat),
  ),
  `${AUDIT_CATEGORIES_V3.length} categories`,
);

for (const name of REQUIRED_INVENTORY_V3) {
  assert(
    `required inventory: ${name}`,
    CAPABILITY_INVENTORY_V3.some((entry) => entry.name === name),
    name,
  );
}

assert(
  'audit answers: UVL not missing',
  reportBody.includes('| Is UVL Verification Execution still missing? | No |'),
  'report audit answers',
);

const failed = results.filter((r) => !r.passed);
console.log('\n--- AiDevEngine Capability Audit V3.1 Validation (UVL Evidence Refresh) ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

console.log('\n--- Audit V3.1 Summary ---');
console.log(`Capabilities: ${assessment.capabilityCount}`);
console.log(
  `Build: ${assessment.operationalMaturity.coverageEvidence.buildCoverage.count}/15 | Preview: ${assessment.operationalMaturity.coverageEvidence.previewCoverage.count}/15 | Verification: ${assessment.operationalMaturity.coverageEvidence.verificationCoverage.count}/15 | AFLA: ${assessment.operationalMaturity.coverageEvidence.aflaReviewCoverage.count}/15`,
);
console.log(`Operational maturity: ${assessment.operationalMaturity.operationalMaturityScore}`);
console.log(`World2 next phase: ${assessment.world2Assessment.shouldBeNextPhase ? 'YES' : 'NO'}`);
console.log(`Next priority: ${nextPriority}`);
console.log(`Highest gap: ${assessment.highestPriorityGap}`);
console.log(`Report: ${CAPABILITY_AUDIT_V3_REPORT_TITLE}`);
console.log(`Artifacts: .capability-audit-v3-1/ (and .capability-audit-v3/)`);

if (failed.length === 0) {
  console.log(`\n${AIDEVENGINE_CAPABILITY_AUDIT_V3_1_PASS_TOKEN}`);
  console.log(`${AIDEVENGINE_CAPABILITY_AUDIT_V3_PASS_TOKEN}`);
  process.exit(0);
}

console.error(`\n${failed.length} check(s) failed.`);
process.exit(1);
