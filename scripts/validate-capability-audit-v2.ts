/**
 * AiDevEngine Capability Audit V2 — validation (read-only).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AIDEVENGINE_CAPABILITY_AUDIT_V2_PASS_TOKEN,
  AUDIT_CATEGORIES_V2,
  CAPABILITY_AUDIT_V2_REPORT_TITLE,
  CAPABILITY_INVENTORY_V2,
  NEW_V2_CAPABILITIES,
  PRIOR_PASS_TOKENS,
  buildCapabilityAuditV2Assessment,
  buildCapabilityAuditV2ReportMarkdown,
  buildDuplicateRiskAnalysis,
  buildMaturityMatrix,
  buildMissingCapabilitiesReport,
  buildRecommendedRoadmap,
} from '../src/capability-audit-v2/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const REPORT_PATH = join(ROOT, CAPABILITY_AUDIT_V2_REPORT_TITLE);
const ASSESSMENT_DIR = join(ROOT, '.capability-audit-v2');

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

assert(
  'capability audit v2 module exists',
  existsSync(join(ROOT, 'src/capability-audit-v2/index.ts')),
  'src/capability-audit-v2/index.ts',
);

const assessment = buildCapabilityAuditV2Assessment();
const duplicateRisk = buildDuplicateRiskAnalysis();
const missingCapabilities = buildMissingCapabilitiesReport();
const { priorities: roadmap } = buildRecommendedRoadmap();
const maturityMatrix = buildMaturityMatrix(assessment);

const reportMarkdown = buildCapabilityAuditV2ReportMarkdown({
  assessment,
  duplicateRisk,
  missingCapabilities,
  roadmap,
});

mkdirSync(ASSESSMENT_DIR, { recursive: true });
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
  join(ASSESSMENT_DIR, 'recommended-roadmap.json'),
  `${JSON.stringify({ generatedAt: assessment.generatedAt, world2IsNextPhase: false, priorities: roadmap }, null, 2)}\n`,
  'utf8',
);
writeFileSync(
  join(ASSESSMENT_DIR, 'missing-capabilities.json'),
  `${JSON.stringify(missingCapabilities, null, 2)}\n`,
  'utf8',
);
writeFileSync(REPORT_PATH, reportMarkdown, 'utf8');

assert('report written', existsSync(REPORT_PATH), CAPABILITY_AUDIT_V2_REPORT_TITLE);
assert(
  'assessment artifacts written',
  [
    'assessment.json',
    'maturity-matrix.json',
    'duplicate-risk-analysis.json',
    'recommended-roadmap.json',
    'missing-capabilities.json',
  ].every((file) => existsSync(join(ASSESSMENT_DIR, file))),
  '.capability-audit-v2/',
);

const reportBody = readFileSync(REPORT_PATH, 'utf8');
assert(
  'report contains pass token',
  reportBody.includes(AIDEVENGINE_CAPABILITY_AUDIT_V2_PASS_TOKEN),
  AIDEVENGINE_CAPABILITY_AUDIT_V2_PASS_TOKEN,
);

const requiredSections = [
  '## Executive Summary',
  '## Capability Inventory',
  '## New Capability Inventory (Since V1)',
  '## Duplicate Risk Analysis',
  '## Missing Capability Report',
  '## Recommended Roadmap',
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
];

for (const section of requiredSections) {
  assert(`report section: ${section}`, reportBody.includes(section), section);
}

assert(
  'inventory covers all audit categories',
  AUDIT_CATEGORIES_V2.every((cat) =>
    CAPABILITY_INVENTORY_V2.some((entry) => entry.category === cat),
  ),
  `${AUDIT_CATEGORIES_V2.length} categories`,
);

assert(
  'minimum capability count',
  CAPABILITY_INVENTORY_V2.length >= 80,
  `${CAPABILITY_INVENTORY_V2.length} capabilities`,
);

assert(
  'new v2 capabilities present',
  NEW_V2_CAPABILITIES.length >= 6,
  `${NEW_V2_CAPABILITIES.length} new capabilities`,
);

const requiredNewCapabilities = [
  'Product Architect Intelligence V1',
  'UVL Verification Hub V1',
  'AFLA Trust Calibration V1',
  'Large-Scale Multi-App Validation V1',
  'Founder Review Operator Dashboard V1',
  'Canonical Capability Ownership V1',
];

for (const name of requiredNewCapabilities) {
  assert(
    `new capability: ${name}`,
    CAPABILITY_INVENTORY_V2.some((entry) => entry.name === name),
    name,
  );
}

assert(
  'assessment JSON valid',
  assessment.passToken === AIDEVENGINE_CAPABILITY_AUDIT_V2_PASS_TOKEN,
  assessment.passToken,
);

assert(
  'assessment category count',
  assessment.categoryCount === 15,
  String(assessment.categoryCount),
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
  missingCapabilities.entries.length >= 10,
  `${missingCapabilities.entries.length} gaps`,
);

assert(
  'roadmap priorities documented',
  roadmap.length >= 10,
  `${roadmap.length} priorities`,
);

assert(
  'world2 is not next phase',
  assessment.world2Assessment.shouldBeNextPhase === false,
  assessment.world2Assessment.nextPhaseRationale.slice(0, 80),
);

assert(
  'real build execution is rank 1',
  roadmap[0]?.phase === 'Real Build Execution Pipeline',
  roadmap[0]?.phase ?? 'missing',
);

assert(
  'prior pass tokens referenced',
  PRIOR_PASS_TOKENS.length >= 7,
  String(PRIOR_PASS_TOKENS.length),
);

const aflaArtifact = join(ROOT, '.autonomous-founder-launch-authority/suite-summary.json');
if (existsSync(aflaArtifact)) {
  const aflaSummary = JSON.parse(readFileSync(aflaArtifact, 'utf8')) as Array<{ passed: boolean }>;
  const allPassed = aflaSummary.every((entry) => entry.passed);
  assert(
    'AFLA suite evidence',
    allPassed,
    `${aflaSummary.filter((e) => e.passed).length}/${aflaSummary.length} profiles passed`,
  );
}

const canonicalArtifact = join(ROOT, '.canonical-capability-ownership-v1/assessment.json');
if (existsSync(canonicalArtifact)) {
  const canonical = JSON.parse(readFileSync(canonicalArtifact, 'utf8')) as {
    consolidationGroupsComplete?: number;
    consolidationGroupCount?: number;
  };
  assert(
    'canonical ownership evidence',
    (canonical.consolidationGroupsComplete ?? 0) >= 5,
    `${canonical.consolidationGroupsComplete}/${canonical.consolidationGroupCount} groups`,
  );
}

const failed = results.filter((r) => !r.passed);
console.log('\n--- AiDevEngine Capability Audit V2 Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

console.log('\n--- Audit V2 Summary ---');
console.log(`Capabilities: ${assessment.capabilityCount}`);
console.log(
  `Mature: ${assessment.matureCount} | Partial: ${assessment.partialCount} | Experimental: ${assessment.experimentalCount} | Missing: ${assessment.missingCount}`,
);
console.log(`High duplicate risk: ${assessment.highDuplicateRiskCount}`);
console.log(`Duplicate risk count: ${duplicateRisk.duplicateRiskCount}`);
console.log(`World2 next phase: ${assessment.world2Assessment.shouldBeNextPhase ? 'YES' : 'NO'}`);
console.log(`Next priority: ${roadmap[0]?.phase}`);
console.log(`Report: ${CAPABILITY_AUDIT_V2_REPORT_TITLE}`);
console.log(`Artifacts: .capability-audit-v2/`);

if (failed.length === 0) {
  console.log(`\n${AIDEVENGINE_CAPABILITY_AUDIT_V2_PASS_TOKEN}`);
  process.exit(0);
}

console.error(`\n${failed.length} check(s) failed.`);
process.exit(1);
