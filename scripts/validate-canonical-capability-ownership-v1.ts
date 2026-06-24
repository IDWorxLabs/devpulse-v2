/**
 * Canonical Capability Ownership V1 — validation.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildCanonicalOwnershipAssessment,
  buildConsolidationReportMarkdown,
  CANONICAL_CAPABILITY_OWNERSHIP_V1_PASS_TOKEN,
  CONSOLIDATION_GROUPS,
  CONSOLIDATION_REPORT_TITLE,
  isNavigationReviewCapabilityRemoved,
  listCanonicalOwnerEntries,
  listMergedCapabilities,
  listRemovedCapabilities,
  validateCanonicalCapabilityOwnership,
} from '../src/canonical-capability-ownership/index.js';
import { getAutonomousFounderLaunchConsolidationOwnership } from '../src/autonomous-founder-launch-authority/index.js';
import { getClarifyingQuestionConsolidationOwnership } from '../src/clarifying-question-intelligence/index.js';
import { resolveAuthoritativeLaunchReadiness } from '../src/launch-readiness-authority/index.js';
import { resolveAuthoritativeRequirementIntelligence } from '../src/requirement-completeness-intelligence/index.js';
import { getUnifiedVerificationLabConsolidationOwnership } from '../src/unified-verification-lab/index.js';
import { resolveAuthoritativeVerificationOrchestration } from '../src/verification-orchestrator/index.js';
import { getWorld2DisposableWorkspaceConsolidationOwnership } from '../src/world2-disposable-workspace/index.js';
import { resolveAuthoritativeWorld2Execution } from '../src/world2-execution-engine/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const REPORT_PATH = join(ROOT, CONSOLIDATION_REPORT_TITLE);
const ASSESSMENT_DIR = join(ROOT, '.canonical-capability-ownership-v1');
const ASSESSMENT_PATH = join(ASSESSMENT_DIR, 'assessment.json');

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

assert(
  'canonical capability ownership module exists',
  existsSync(join(ROOT, 'src/canonical-capability-ownership/index.ts')),
  'src/canonical-capability-ownership/index.ts',
);

const validation = validateCanonicalCapabilityOwnership(ROOT);
const assessment = buildCanonicalOwnershipAssessment(ROOT);
const reportMarkdown = buildConsolidationReportMarkdown(assessment);

mkdirSync(ASSESSMENT_DIR, { recursive: true });
writeFileSync(ASSESSMENT_PATH, `${JSON.stringify(assessment, null, 2)}\n`, 'utf8');
writeFileSync(REPORT_PATH, reportMarkdown, 'utf8');

assert('consolidation report written', existsSync(REPORT_PATH), CONSOLIDATION_REPORT_TITLE);
assert('assessment written', existsSync(ASSESSMENT_PATH), '.canonical-capability-ownership-v1/assessment.json');
assert(
  'report contains pass token',
  reportMarkdown.includes(CANONICAL_CAPABILITY_OWNERSHIP_V1_PASS_TOKEN),
  CANONICAL_CAPABILITY_OWNERSHIP_V1_PASS_TOKEN,
);

assert(
  'five consolidation groups registered',
  CONSOLIDATION_GROUPS.length === 5,
  `${CONSOLIDATION_GROUPS.length} groups`,
);

assert('ownership validation passes', validation.valid, [
  validation.multipleOwnerViolations.length > 0
    ? `multiple owners: ${validation.multipleOwnerViolations.join('; ')}`
    : null,
  validation.duplicateOwnershipViolations.length > 0
    ? `duplicate ownership: ${validation.duplicateOwnershipViolations.join('; ')}`
    : null,
  validation.removedCapabilityReappearances.length > 0
    ? `removed reappeared: ${validation.removedCapabilityReappearances.join('; ')}`
    : null,
  validation.remediationViolations.length > 0
    ? `remediation: ${validation.remediationViolations.join('; ')}`
    : null,
  validation.consolidationGroupViolations.length > 0
    ? `groups: ${validation.consolidationGroupViolations.join('; ')}`
    : null,
]
  .filter(Boolean)
  .join(' | ') || 'valid');

assert(
  'assessment pass token',
  assessment.passToken === CANONICAL_CAPABILITY_OWNERSHIP_V1_PASS_TOKEN,
  assessment.passToken,
);

assert(
  'all consolidation groups complete',
  assessment.consolidationGroupsComplete === assessment.consolidationGroupsTotal,
  `${assessment.consolidationGroupsComplete}/${assessment.consolidationGroupsTotal}`,
);

assert(
  'merged capabilities documented',
  listMergedCapabilities().length >= 4,
  `${listMergedCapabilities().length} merged`,
);

assert(
  'navigation review removed',
  isNavigationReviewCapabilityRemoved() && listRemovedCapabilities().includes('Navigation Review (Dedicated)'),
  'REMOVED',
);

assert(
  'remaining duplicate-risk count is zero',
  assessment.remainingDuplicateRiskCount === 0,
  String(assessment.remainingDuplicateRiskCount),
);

const aflaOwnership = getAutonomousFounderLaunchConsolidationOwnership();
assert(
  'AFLA canonical launch owner',
  aflaOwnership.status === 'CANONICAL' &&
    aflaOwnership.consolidatedCapabilities.includes('Launch Readiness Authority'),
  aflaOwnership.capability,
);

const launchBridge = resolveAuthoritativeLaunchReadiness();
assert(
  'launch readiness delegates to AFLA',
  launchBridge.authoritativeOwner === 'Autonomous Founder Launch Authority' &&
    launchBridge.noDuplicateLaunchVerdictGeneration,
  launchBridge.authoritativeOwner,
);

const uvlOwnership = getUnifiedVerificationLabConsolidationOwnership();
const orchestratorBridge = resolveAuthoritativeVerificationOrchestration();
assert(
  'UVL canonical verification owner',
  uvlOwnership.status === 'CANONICAL' &&
    orchestratorBridge.noSeparateOrchestrationAuthority &&
    orchestratorBridge.authoritativeOwner === 'Unified Verification Lab (UVL)',
  uvlOwnership.capability,
);

const cqiOwnership = getClarifyingQuestionConsolidationOwnership();
const requirementBridge = resolveAuthoritativeRequirementIntelligence();
assert(
  'CQI canonical requirement intelligence owner',
  cqiOwnership.status === 'CANONICAL' &&
    requirementBridge.singleRequirementIntelligencePath &&
    requirementBridge.authoritativeOwner === 'Clarifying Question Intelligence',
  cqiOwnership.capability,
);

const pipelineOwnership = getWorld2DisposableWorkspaceConsolidationOwnership();
const world2Bridge = resolveAuthoritativeWorld2Execution();
assert(
  'World2 pipeline canonical execution owner',
  pipelineOwnership.status === 'CANONICAL' &&
    world2Bridge.singleWorld2ExecutionOwnershipPath &&
    world2Bridge.authoritativeOwner === 'World2 Disposable Workspace Pipeline (24E–24Y)',
  pipelineOwnership.capability,
);

assert(
  'canonical owners registered',
  listCanonicalOwnerEntries().length >= 7,
  `${listCanonicalOwnerEntries().length} canonical owners`,
);

const requiredSections = [
  '## Completed Merges',
  '## Removed Capabilities',
  '## Canonical Ownership Map',
  '## Remaining Duplicate-Risk Count',
  '## Future Consolidation Recommendations',
];

for (const section of requiredSections) {
  assert(`report section: ${section}`, reportMarkdown.includes(section), section);
}

const failed = results.filter((r) => !r.passed);
console.log('\n--- Canonical Capability Ownership V1 Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

console.log('\n--- Consolidation Summary ---');
console.log(`Groups: ${assessment.consolidationGroupsComplete}/${assessment.consolidationGroupsTotal}`);
console.log(`Merged: ${assessment.mergedCapabilities.join(', ')}`);
console.log(`Removed: ${assessment.removedCapabilities.join(', ')}`);
console.log(`Remaining duplicate-risk: ${assessment.remainingDuplicateRiskCount}`);
console.log(`Report: ${CONSOLIDATION_REPORT_TITLE}`);
console.log(`Assessment: .canonical-capability-ownership-v1/assessment.json`);

if (failed.length === 0) {
  console.log(`\n${CANONICAL_CAPABILITY_OWNERSHIP_V1_PASS_TOKEN}`);
  process.exit(0);
}

console.error(`\n${failed.length} check(s) failed.`);
process.exit(1);
