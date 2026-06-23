/**
 * AiDevEngine Capability Audit V1 — validation (read-only).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AIDEVENGINE_CAPABILITY_AUDIT_V1_PASS_TOKEN,
  AUDIT_CATEGORIES,
  CAPABILITY_AUDIT_REPORT_TITLE,
  CAPABILITY_INVENTORY,
  MISSING_CAPABILITIES,
  PROPOSED_AUTHORITY_OVERLAPS,
  ROADMAP_PRIORITIES,
  buildCapabilityAuditAssessment,
  buildCapabilityAuditReportMarkdown,
  validateHighDuplicateRiskRemediations,
} from '../src/capability-audit-v1/index.js';
import { listLaunchCouncilAuthorities } from '../src/launch-council/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const REPORT_PATH = join(ROOT, CAPABILITY_AUDIT_REPORT_TITLE);
const ASSESSMENT_DIR = join(ROOT, '.capability-audit-v1');
const ASSESSMENT_PATH = join(ASSESSMENT_DIR, 'assessment.json');

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

assert(
  'capability audit module exists',
  existsSync(join(ROOT, 'src/capability-audit-v1/index.ts')),
  'src/capability-audit-v1/index.ts',
);

const assessment = buildCapabilityAuditAssessment();
const reportMarkdown = buildCapabilityAuditReportMarkdown(assessment);

mkdirSync(ASSESSMENT_DIR, { recursive: true });
writeFileSync(ASSESSMENT_PATH, `${JSON.stringify(assessment, null, 2)}\n`, 'utf8');
writeFileSync(REPORT_PATH, reportMarkdown, 'utf8');

assert('report written', existsSync(REPORT_PATH), CAPABILITY_AUDIT_REPORT_TITLE);
assert('assessment written', existsSync(ASSESSMENT_PATH), '.capability-audit-v1/assessment.json');

const reportBody = readFileSync(REPORT_PATH, 'utf8');
assert(
  'report contains pass token',
  reportBody.includes(AIDEVENGINE_CAPABILITY_AUDIT_V1_PASS_TOKEN),
  AIDEVENGINE_CAPABILITY_AUDIT_V1_PASS_TOKEN,
);

const requiredSections = [
  '## Executive Summary',
  '## Capability Inventory',
  '## High Duplicate-Risk Remediation Decisions',
  '## Duplicate Detection',
  '## Missing Capabilities',
  '## Recommended Roadmap',
  'Idea Intake',
  'Requirement Intelligence',
  'Planning Intelligence',
  'Code Generation',
  'Blueprint Systems',
  'Feature Validation',
  'Engineering Review',
  'Founder Review',
  'Product Intelligence',
  'UI / UX Intelligence',
  'Self-Evolution',
  'Multi-Project Execution',
];

for (const section of requiredSections) {
  assert(`report section: ${section}`, reportBody.includes(section), section);
}

assert(
  'inventory covers all audit categories',
  AUDIT_CATEGORIES.every((cat) =>
    CAPABILITY_INVENTORY.some((entry) => entry.category === cat),
  ),
  `${AUDIT_CATEGORIES.length} categories`,
);

assert(
  'minimum capability count',
  CAPABILITY_INVENTORY.length >= 60,
  `${CAPABILITY_INVENTORY.length} capabilities`,
);

assert(
  'proposed authority overlap analyses',
  PROPOSED_AUTHORITY_OVERLAPS.length >= 8,
  `${PROPOSED_AUTHORITY_OVERLAPS.length} analyses`,
);

for (const overlap of PROPOSED_AUTHORITY_OVERLAPS) {
  const totalOverlap = overlap.overlaps.reduce((sum, item) => sum + item.percentage, 0);
  assert(
    `overlap math: ${overlap.proposedAuthority}`,
    totalOverlap + overlap.netNewCapability >= 95 && totalOverlap + overlap.netNewCapability <= 105,
    `overlaps=${totalOverlap}% netNew=${overlap.netNewCapability}%`,
  );
  assert(
    `overlap recommends extend/merge: ${overlap.proposedAuthority}`,
    overlap.recommendation !== 'Create New Authority',
    overlap.recommendation,
  );
}

assert(
  'missing capabilities documented',
  MISSING_CAPABILITIES.length >= 8,
  `${MISSING_CAPABILITIES.length} gaps`,
);

assert(
  'roadmap priorities documented',
  ROADMAP_PRIORITIES.length >= 8,
  `${ROADMAP_PRIORITIES.length} priorities`,
);

assert(
  'assessment JSON valid',
  assessment.passToken === AIDEVENGINE_CAPABILITY_AUDIT_V1_PASS_TOKEN,
  assessment.passToken,
);

assert(
  'assessment category count',
  assessment.categoryCount === 12,
  String(assessment.categoryCount),
);

const remediationValidation = validateHighDuplicateRiskRemediations(CAPABILITY_INVENTORY);

assert(
  'high duplicate risk count is 10',
  remediationValidation.highRiskCapabilities.length === 10,
  `${remediationValidation.highRiskCapabilities.length} high-risk capabilities`,
);

assert(
  'all high duplicate risks have remediation decisions',
  remediationValidation.complete,
  [
    remediationValidation.missingRemediations.length > 0
      ? `missing: ${remediationValidation.missingRemediations.join(', ')}`
      : null,
    remediationValidation.orphanRemediations.length > 0
      ? `orphan: ${remediationValidation.orphanRemediations.join(', ')}`
      : null,
    remediationValidation.invalidDecisions.length > 0
      ? `invalid: ${remediationValidation.invalidDecisions.join(', ')}`
      : null,
    remediationValidation.recommendationMismatches.length > 0
      ? `mismatch: ${remediationValidation.recommendationMismatches.join('; ')}`
      : null,
  ]
    .filter(Boolean)
    .join(' | ') || 'complete',
);

assert(
  'assessment remediations complete flag',
  assessment.highDuplicateRiskRemediationsComplete === true,
  String(assessment.highDuplicateRiskRemediationsComplete),
);

for (const remediation of assessment.highDuplicateRiskRemediations) {
  assert(
    `remediation decision: ${remediation.capabilityName}`,
    ['KEEP', 'EXTEND', 'MERGE', 'REPLACE', 'REMOVE'].includes(remediation.decision),
    `${remediation.decision} → ${remediation.target ?? '—'}`,
  );
}

const launchCouncilAuthorities = listLaunchCouncilAuthorities();
assert(
  'launch council authorities registered',
  launchCouncilAuthorities.length >= 26,
  `${launchCouncilAuthorities.length} authorities`,
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

const engineeringArtifact = join(ROOT, '.engineering-reality-authority/suite-summary.json');
if (existsSync(engineeringArtifact)) {
  const engineeringSummary = JSON.parse(readFileSync(engineeringArtifact, 'utf8')) as Array<{
    passed: boolean;
  }>;
  const allPassed = engineeringSummary.every((entry) => entry.passed);
  assert(
    'engineering reality suite evidence',
    allPassed,
    `${engineeringSummary.filter((e) => e.passed).length}/${engineeringSummary.length} profiles passed`,
  );
}

const failed = results.filter((r) => !r.passed);
console.log('\n--- AiDevEngine Capability Audit V1 Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

console.log('\n--- Audit Summary ---');
console.log(`Capabilities: ${assessment.capabilityCount}`);
console.log(`Mature: ${assessment.matureCount} | Partial: ${assessment.partialCount}`);
console.log(`High duplicate risk: ${assessment.highDuplicateRiskCount}`);
console.log(
  `High duplicate risk remediations: ${assessment.highDuplicateRiskRemediationsComplete ? 'COMPLETE' : 'INCOMPLETE'}`,
);
for (const remediation of assessment.highDuplicateRiskRemediations) {
  console.log(`  ${remediation.decision} — ${remediation.capabilityName}`);
}
console.log(`Report: ${CAPABILITY_AUDIT_REPORT_TITLE}`);
console.log(`Assessment: .capability-audit-v1/assessment.json`);

if (failed.length === 0) {
  console.log(`\n${AIDEVENGINE_CAPABILITY_AUDIT_V1_PASS_TOKEN}`);
  process.exit(0);
}

console.error(`\n${failed.length} check(s) failed.`);
process.exit(1);
