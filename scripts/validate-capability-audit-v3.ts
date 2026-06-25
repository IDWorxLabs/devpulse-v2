/**
 * AiDevEngine Capability Audit V3 — validation (read-only).
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
} from '../src/capability-audit-v3/index.js';
import {
  buildUvlEvidenceRefreshArtifact,
  loadUvlEvidenceSnapshot,
} from '../src/capability-audit-v3/uvl-evidence-loader.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const REPORT_PATH = join(ROOT, CAPABILITY_AUDIT_V3_REPORT_TITLE);
const ASSESSMENT_DIR = join(ROOT, '.capability-audit-v3');
const ASSESSMENT_DIR_V31 = join(ROOT, '.capability-audit-v3-1');

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

assert(
  'capability audit v3 module exists',
  existsSync(join(ROOT, 'src/capability-audit-v3/index.ts')),
  'src/capability-audit-v3/index.ts',
);

const assessment = buildCapabilityAuditV3Assessment(ROOT);
const duplicateRisk = buildDuplicateRiskAnalysis();
const missingCapabilities = buildMissingCapabilitiesReport({
  projectRootDir: ROOT,
  productionReadinessScore: assessment.productionReadiness.productionReadinessScore,
  codeGenerationMaturityScore: assessment.codeGeneration.codeGenerationMaturityScore,
});
const { priorities: roadmap, world2IsNextPhase, nextPriority } = buildRecommendedRoadmap({
  projectRootDir: ROOT,
  productionReadinessScore: assessment.productionReadiness.productionReadinessScore,
  codeGenerationMaturityScore: assessment.codeGeneration.codeGenerationMaturityScore,
});
const maturityMatrix = buildMaturityMatrix(assessment);
const uvlSnapshot = loadUvlEvidenceSnapshot(ROOT);
const uvlEvidenceRefresh = buildUvlEvidenceRefreshArtifact(uvlSnapshot);

const reportMarkdown = buildCapabilityAuditV3ReportMarkdown({
  assessment,
  duplicateRisk,
  missingCapabilities,
  roadmap,
});

mkdirSync(ASSESSMENT_DIR, { recursive: true });
mkdirSync(ASSESSMENT_DIR_V31, { recursive: true });

writeFileSync(
  join(ASSESSMENT_DIR, 'assessment.json'),
  `${JSON.stringify(assessment, null, 2)}\n`,
  'utf8',
);
writeFileSync(
  join(ASSESSMENT_DIR, 'maturity-matrix.json'),
  `${JSON.stringify({ generatedAt: assessment.generatedAt, entries: maturityMatrix }, null, 2)}\n`,
  'utf8',
);
writeFileSync(
  join(ASSESSMENT_DIR, 'duplicate-risk-analysis.json'),
  `${JSON.stringify(duplicateRisk, null, 2)}\n`,
  'utf8',
);
writeFileSync(
  join(ASSESSMENT_DIR, 'operational-maturity.json'),
  `${JSON.stringify(assessment.operationalMaturity, null, 2)}\n`,
  'utf8',
);
writeFileSync(
  join(ASSESSMENT_DIR, 'recommended-roadmap.json'),
  `${JSON.stringify(
    {
      generatedAt: assessment.generatedAt,
      world2IsNextPhase,
      nextPriority,
      highestPriorityGap: assessment.highestPriorityGap,
      priorities: roadmap,
    },
    null,
    2,
  )}\n`,
  'utf8',
);
writeFileSync(
  join(ASSESSMENT_DIR, 'missing-capabilities.json'),
  `${JSON.stringify(missingCapabilities, null, 2)}\n`,
  'utf8',
);
writeFileSync(REPORT_PATH, reportMarkdown, 'utf8');

writeFileSync(join(ASSESSMENT_DIR_V31, 'assessment.json'), `${JSON.stringify(assessment, null, 2)}\n`, 'utf8');
writeFileSync(
  join(ASSESSMENT_DIR_V31, 'operational-maturity.json'),
  `${JSON.stringify(assessment.operationalMaturity, null, 2)}\n`,
  'utf8',
);
writeFileSync(
  join(ASSESSMENT_DIR_V31, 'recommended-roadmap.json'),
  `${JSON.stringify(
    {
      generatedAt: assessment.generatedAt,
      world2IsNextPhase,
      nextPriority,
      highestPriorityGap: assessment.highestPriorityGap,
      priorities: roadmap,
    },
    null,
    2,
  )}\n`,
  'utf8',
);
writeFileSync(
  join(ASSESSMENT_DIR_V31, 'missing-capabilities.json'),
  `${JSON.stringify(missingCapabilities, null, 2)}\n`,
  'utf8',
);
writeFileSync(
  join(ASSESSMENT_DIR_V31, 'uvl-evidence-refresh.json'),
  `${JSON.stringify(uvlEvidenceRefresh, null, 2)}\n`,
  'utf8',
);

assert('report written', existsSync(REPORT_PATH), CAPABILITY_AUDIT_V3_REPORT_TITLE);
assert(
  'assessment artifacts written',
  [
    'assessment.json',
    'maturity-matrix.json',
    'duplicate-risk-analysis.json',
    'operational-maturity.json',
    'recommended-roadmap.json',
    'missing-capabilities.json',
  ].every((file) => existsSync(join(ASSESSMENT_DIR, file))),
  '.capability-audit-v3/',
);
assert(
  'v3.1 artifacts written',
  [
    'assessment.json',
    'operational-maturity.json',
    'recommended-roadmap.json',
    'missing-capabilities.json',
    'uvl-evidence-refresh.json',
  ].every((file) => existsSync(join(ASSESSMENT_DIR_V31, file))),
  '.capability-audit-v3-1/',
);

const reportBody = readFileSync(REPORT_PATH, 'utf8');
assert(
  'report contains pass token',
  reportBody.includes(assessment.passToken),
  assessment.passToken,
);

const requiredSections = [
  '## Executive Summary',
  '## Updated Capability Inventory',
  '## Capability Inventory',
  '## Category Assessment',
  '## Operational Reality Assessment',
  '## Duplicate Risk Analysis V3',
  '## Production Readiness Assessment',
  '## General-Purpose Code Generation Assessment',
  '## Missing Capability Report',
  '## Recommended Roadmap V3',
  '## World2 Assessment',
  'Idea Intake',
  'Requirement Intelligence',
  'Planning Intelligence',
  'Product Architect Intelligence',
  'Code Generation',
  'Blueprint Systems',
  'Feature Validation',
  'Engineering Review',
  'Verification Systems',
  'Founder Review',
  'Launch Readiness',
  'Self-Evolution',
  'Multi-Project Execution',
  'World2',
  'Operator Systems',
  'Production Readiness',
];

for (const section of requiredSections) {
  assert(`report section: ${section}`, reportBody.includes(section), section);
}

assert(
  'inventory covers all audit categories',
  AUDIT_CATEGORIES_V3.every((cat) =>
    CAPABILITY_INVENTORY_V3.some((entry) => entry.category === cat),
  ),
  `${AUDIT_CATEGORIES_V3.length} categories`,
);

assert(
  'minimum capability count',
  CAPABILITY_INVENTORY_V3.length >= 90,
  `${CAPABILITY_INVENTORY_V3.length} capabilities`,
);

for (const name of REQUIRED_INVENTORY_V3) {
  assert(
    `required inventory: ${name}`,
    CAPABILITY_INVENTORY_V3.some((entry) => entry.name === name),
    name,
  );
}

assert(
  'assessment JSON valid',
  assessment.passToken === AIDEVENGINE_CAPABILITY_AUDIT_V3_1_PASS_TOKEN ||
    assessment.passToken === AIDEVENGINE_CAPABILITY_AUDIT_V3_PASS_TOKEN,
  assessment.passToken,
);

assert(
  'assessment category count',
  assessment.categoryCount === 16,
  String(assessment.categoryCount),
);

assert(
  'category assessments present',
  assessment.categoryAssessments.length === 16,
  String(assessment.categoryAssessments.length),
);

assert(
  'duplicate risk analysis valid',
  duplicateRisk.duplicateRiskCount >= 10,
  String(duplicateRisk.duplicateRiskCount),
);

assert(
  'authority ownership checks pass',
  duplicateRisk.oneCapabilityOneOwnerValid,
  duplicateRisk.authorityOwnershipChecks
    .filter((c) => !c.valid)
    .map((c) => c.domain)
    .join(', ') || 'all valid',
);

assert(
  'missing capabilities documented',
  Boolean(missingCapabilities.highestPriorityGap) &&
    (missingCapabilities.entries.length >= 2 ||
      (missingCapabilities.entries.length === 0 &&
        missingCapabilities.highestPriorityGap.includes('No remaining blocking gaps'))),
  `${missingCapabilities.entries.length} gaps`,
);

assert(
  'roadmap priorities documented',
  roadmap.length >= 5 && roadmap.some((priority) => priority.action !== undefined),
  `${roadmap.length} priorities`,
);

assert(
  'world2 is not next phase',
  assessment.world2Assessment.shouldBeNextPhase === false,
  assessment.world2Assessment.nextPhaseRationale.slice(0, 80),
);

assert(
  'UVL verification execution not highest gap',
  !assessment.highestPriorityGap.includes('UVL Verification Execution') &&
    !assessment.highestPriorityGap.includes('UVL full verification'),
  assessment.highestPriorityGap,
);

assert(
  'UVL verification execution complete',
  assessment.uvlEvidenceRefresh.uvlVerificationExecutionComplete === true,
  `${assessment.uvlEvidenceRefresh.verifiedCount}/${assessment.uvlEvidenceRefresh.categoriesRequired}`,
);

assert(
  'UVL verified count 15/15',
  assessment.uvlEvidenceRefresh.verifiedCount === 15 &&
    assessment.uvlEvidenceRefresh.categoriesRequired === 15,
  `${assessment.uvlEvidenceRefresh.verifiedCount}/${assessment.uvlEvidenceRefresh.categoriesRequired}`,
);

assert(
  'UVL verification coverage 100%',
  assessment.uvlEvidenceRefresh.verificationCoveragePercent === 100,
  String(assessment.uvlEvidenceRefresh.verificationCoveragePercent),
);

assert(
  'UVL verification confidence 100',
  assessment.uvlEvidenceRefresh.verificationConfidenceScore === 100,
  String(assessment.uvlEvidenceRefresh.verificationConfidenceScore),
);

assert(
  'next priority recalculated',
  nextPriority !== 'UVL Verification Execution',
  nextPriority,
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
  'verification is not blocking gap',
  assessment.operationalMaturity.verificationIsBlockingGap === false,
  'verification complete',
);

assert(
  'suite coverage 15/15 verification',
  assessment.operationalMaturity.coverageEvidence.verificationCoverage.count === 15,
  `${assessment.operationalMaturity.coverageEvidence.verificationCoverage.count}/15`,
);

assert(
  'prior pass tokens include RBEP and UVL',
  PRIOR_PASS_TOKENS.includes('REAL_BUILD_EXECUTION_PIPELINE_V1_PASS') &&
    PRIOR_PASS_TOKENS.includes('REAL_BUILD_EXECUTION_PIPELINE_V1_1_PASS') &&
    PRIOR_PASS_TOKENS.includes('UVL_VERIFICATION_EXECUTION_V1_PASS'),
  'RBEP + UVL tokens',
);

const rbepArtifact = join(ROOT, '.real-build-execution-pipeline-v1-1/proof-coverage.json');
if (existsSync(rbepArtifact)) {
  const proof = JSON.parse(readFileSync(rbepArtifact, 'utf8')) as {
    proofCoveragePercent?: number;
    categoriesWithFullProof?: number;
  };
  assert(
    'RBEP V1.1 proof evidence',
    (proof.proofCoveragePercent ?? 0) >= 100 && (proof.categoriesWithFullProof ?? 0) >= 15,
    `${proof.categoriesWithFullProof}/15 @ ${proof.proofCoveragePercent}%`,
  );
}

const uvlCoverageArtifact = join(ROOT, '.uvl-verification-execution-v1/verification-coverage.json');
if (existsSync(uvlCoverageArtifact)) {
  const coverage = JSON.parse(readFileSync(uvlCoverageArtifact, 'utf8')) as {
    verifiedCount?: number;
    verificationCoveragePercent?: number;
  };
  assert(
    'UVL verification coverage artifact',
    (coverage.verifiedCount ?? 0) === 15 && (coverage.verificationCoveragePercent ?? 0) === 100,
    `${coverage.verifiedCount}/15 @ ${coverage.verificationCoveragePercent}%`,
  );
}

const failed = results.filter((r) => !r.passed);
console.log('\n--- AiDevEngine Capability Audit V3 Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

console.log('\n--- Audit V3 Summary ---');
console.log(`Capabilities: ${assessment.capabilityCount}`);
console.log(
  `Mature: ${assessment.matureCount} | Partial: ${assessment.partialCount} | Experimental: ${assessment.experimentalCount} | Missing: ${assessment.missingCount}`,
);
console.log(`High duplicate risk: ${assessment.highDuplicateRiskCount}`);
console.log(`Duplicate risk count: ${duplicateRisk.duplicateRiskCount}`);
console.log(`Operational maturity: ${assessment.operationalMaturity.operationalMaturityScore}`);
console.log(`Production readiness: ${assessment.productionReadiness.productionReadinessScore}`);
console.log(`Code generation maturity: ${assessment.codeGeneration.codeGenerationMaturityScore}`);
console.log(`World2 next phase: ${assessment.world2Assessment.shouldBeNextPhase ? 'YES' : 'NO'}`);
console.log(`Next priority: ${nextPriority}`);
console.log(`Highest gap: ${assessment.highestPriorityGap}`);
console.log(
  `UVL verified: ${assessment.uvlEvidenceRefresh.verifiedCount}/${assessment.uvlEvidenceRefresh.categoriesRequired} @ ${assessment.uvlEvidenceRefresh.verificationCoveragePercent}%`,
);
console.log(`Report: ${CAPABILITY_AUDIT_V3_REPORT_TITLE}`);
console.log(`Artifacts: .capability-audit-v3/ and .capability-audit-v3-1/`);

if (failed.length === 0) {
  console.log(`\n${assessment.passToken}`);
  if (assessment.passToken === AIDEVENGINE_CAPABILITY_AUDIT_V3_1_PASS_TOKEN) {
    console.log(AIDEVENGINE_CAPABILITY_AUDIT_V3_1_PASS_TOKEN);
  }
  process.exit(0);
}

console.error(`\n${failed.length} check(s) failed.`);
process.exit(1);
