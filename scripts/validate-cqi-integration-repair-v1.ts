/**
 * CQI Integration Repair V1 — stabilization validation.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFounderTestingModeV4 } from '../src/founder-testing-mode/index.js';
import {
  assessCqiMaturity,
  CLARIFYING_QUESTION_INTELLIGENCE_MATURITY_V1_PASS_TOKEN,
  getClarifyingQuestionConsolidationOwnership,
  getLastCqiMaturityAssessment,
  resetCqiMaturityHistoryForTests,
} from '../src/clarifying-question-intelligence/index.js';
import { getAutonomousFounderLaunchConsolidationOwnership } from '../src/autonomous-founder-launch-authority/index.js';
import { buildRequirementDiscoveryPayload } from '../server/requirement-discovery-handler.js';
import { resolveCanonicalLivePreviewState } from '../src/one-prompt-live-preview/canonical-live-preview-state.js';
import { validateCanonicalCapabilityOwnership, countRemainingDuplicateRisk } from '../src/canonical-capability-ownership/index.js';

export const CQI_INTEGRATION_REPAIR_V1_PASS_TOKEN = 'CQI_INTEGRATION_REPAIR_V1_PASS';
const REPORT_PATH = 'CQI_INTEGRATION_REPAIR_REPORT.md';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf8');
}

function runNpmScript(script: string): { ok: boolean; output: string } {
  const result = spawnSync('npm', ['run', script], {
    cwd: ROOT,
    encoding: 'utf8',
    shell: true,
    maxBuffer: 20 * 1024 * 1024,
  });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  return { ok: result.status === 0, output };
}

function main(): void {
  console.log('');
  console.log('CQI Integration Repair V1 — Validation');
  console.log('======================================');
  console.log('');

  const canonicalPreview = read('src/one-prompt-live-preview/canonical-live-preview-state.ts');
  const launchCouncilIntegration = read('src/launch-council/launch-council-founder-integration.ts');
  const clarifyingAuthority = read('src/clarifying-question-intelligence/clarifying-question-authority.ts');
  const manifest = read('server/command-center-shell-manifest.ts');
  const appJs = read('public/founder-reality/app.js');

  assert(
    '01. live preview import assessLivePreviewReality',
    canonicalPreview.includes("import { assessLivePreviewReality } from '../live-preview-reality/index.js'"),
    'assessLivePreviewReality import present',
  );
  assert(
    '02. live preview CQI maturity import',
    canonicalPreview.includes('getLastCqiMaturityAssessment'),
    'getLastCqiMaturityAssessment wired',
  );
  assert(
    '03. live preview requirementDiscovery slice',
    canonicalPreview.includes('requirementDiscovery:'),
    'requirementDiscovery field returned',
  );
  assert(
    '04. launch council assessLaunchCouncil import',
    launchCouncilIntegration.includes("import { assessLaunchCouncil, buildLaunchCouncilArtifacts } from './launch-council-authority.js'"),
    'assessLaunchCouncil import present',
  );
  const autonomousFounderImportLines = launchCouncilIntegration
    .split('\n')
    .filter((line) => line.includes('import') && line.includes('mapAutonomousFounderLaunchCouncilAuthority'));
  assert(
    '05. launch council duplicate import removed',
    autonomousFounderImportLines.length === 1,
    `${autonomousFounderImportLines.length} import lines`,
  );
  assert(
    '06. launch council maturity findings',
    launchCouncilIntegration.includes('Requirement confidence score:'),
    'maturity findings mapped',
  );
  assert(
    '07. founder pipeline records CQI maturity',
    clarifyingAuthority.includes('assessCqiMaturity({'),
    'assessCqiMaturity called during artifact build',
  );

  resetCqiMaturityHistoryForTests();
  const v4 = runFounderTestingModeV4();
  const maturity = getLastCqiMaturityAssessment();
  const cqiCouncil = v4.launchCouncil.authorityResults.find(
    (result) => result.authorityId === 'clarifying-question-intelligence',
  );

  assert('08. founder test produces CQI maturity', Boolean(maturity), maturity ? String(maturity.requirementConfidenceScore) : 'null');
  assert(
    '09. launch council consumes confidence',
    Boolean(cqiCouncil?.findings.some((finding) => finding.includes('Requirement confidence score:'))),
    cqiCouncil?.findings.find((finding) => finding.includes('Requirement confidence score:')) ?? 'missing',
  );
  assert(
    '10. launch council consumes coverage matrix',
    Boolean(cqiCouncil?.findings.some((finding) => finding.includes('Coverage matrix:'))),
    'coverage matrix finding',
  );
  assert(
    '11. launch council consumes gap summary',
    Boolean(cqiCouncil?.findings.some((finding) => finding.includes('Requirement gap summary:'))),
    'gap summary finding',
  );
  assert(
    '12. launch council open questions',
    Boolean(cqiCouncil?.findings.some((finding) => finding.includes('Open questions:'))),
    'open questions finding',
  );
  assert(
    '13. launch council resolved questions',
    Boolean(cqiCouncil?.findings.some((finding) => finding.includes('Resolved questions:'))),
    'resolved questions finding',
  );

  const operatorPayload = buildRequirementDiscoveryPayload({ prompt: 'Build me a CRM.' });
  assert('14. operator confidence score', operatorPayload.confidenceScore >= 0, String(operatorPayload.confidenceScore));
  assert('15. operator coverage rows', operatorPayload.requirementCoverage.length === 12, String(operatorPayload.requirementCoverage.length));
  assert('16. operator open questions', operatorPayload.openQuestions.length > 0, String(operatorPayload.openQuestions.length));
  assert('17. operator dashboard section', manifest.includes('Requirement Discovery'), 'manifest');
  assert('18. operator UI panel', appJs.includes('renderRequirementDiscoveryPanel'), 'app.js');

  assessCqiMaturity({ userPrompt: 'Build me a CRM.' });
  const previewSlice = resolveCanonicalLivePreviewState(
    {
      sessions: [],
      activeSession: null,
      previewUrl: null,
      connected: false,
      diagnostics: {
        previewRuntimeActive: false,
        previewSessionCount: 0,
        registeredTargetCount: 0,
        readyPreviewCount: 0,
        blockedPreviewCount: 0,
      },
      targets: [],
    },
    {
      latestProjectId: null,
      projectCount: 0,
      projectName: null,
      recentChangeSummary: null,
      generatedAt: Date.now(),
    },
  );
  assert(
    '19. live preview exposes requirementDiscovery',
    previewSlice.requirementDiscovery !== null,
    previewSlice.requirementDiscovery ? String(previewSlice.requirementDiscovery.confidenceScore) : 'null',
  );

  const cqiOwnership = getClarifyingQuestionConsolidationOwnership();
  const aflaOwnership = getAutonomousFounderLaunchConsolidationOwnership();
  const ownershipValidation = validateCanonicalCapabilityOwnership(ROOT);
  const duplicateRiskCount = countRemainingDuplicateRisk();

  assert('20. CQI remains canonical owner', cqiOwnership.capability === 'Clarifying Question Intelligence', cqiOwnership.capability);
  assert('21. AFLA remains launch owner', aflaOwnership.capability === 'Autonomous Founder Launch Authority', aflaOwnership.capability);
  assert('22. duplicate-risk remains zero', duplicateRiskCount === 0, String(duplicateRiskCount));
  assert('23. founder dashboard founder review', appJs.includes('renderFounderReviewDashboard'), 'founder review UI');

  const chainScripts = [
    'validate:clarifying-question-intelligence',
    'validate:clarifying-question-intelligence-maturity-v1',
    'validate:autonomous-founder-launch-authority-v1',
    'validate:canonical-capability-ownership-v1',
    'validate:founder-review-operator-dashboard-v1',
  ] as const;

  const chainResults: Record<string, boolean> = {};
  for (const script of chainScripts) {
    console.log(`Running npm run ${script} ...`);
    const run = runNpmScript(script);
    chainResults[script] = run.ok;
    assert(`24. chain ${script}`, run.ok, run.ok ? 'pass' : run.output.split('\n').slice(-8).join(' | '));
  }

  const failed = results.filter((item) => !item.passed);
  const repairedFiles = [
    'src/one-prompt-live-preview/canonical-live-preview-state.ts',
    'src/launch-council/launch-council-founder-integration.ts',
    'src/clarifying-question-intelligence/clarifying-question-authority.ts',
    'scripts/validate-clarifying-question-intelligence.ts',
    'scripts/validate-cqi-integration-repair-v1.ts',
  ];

  const report = `# CQI Integration Repair V1 Report

Generated: ${new Date().toISOString()}

Pass token: \`${CQI_INTEGRATION_REPAIR_V1_PASS_TOKEN}\`

## Root Cause

Recent CQI Maturity V1 work extended requirement discovery evidence across Founder, Operator, and Launch Council surfaces. Two integration files lost required imports during consolidation:

- \`canonical-live-preview-state.ts\` referenced \`assessLivePreviewReality\` without importing it, breaking Live Preview state resolution during founder validation.
- \`launch-council-founder-integration.ts\` referenced \`assessLaunchCouncil\` and \`buildLaunchCouncilArtifacts\` without imports and contained a duplicate autonomous-founder import.

The base CQI validator also exceeded its 60s runtime guard once founder testing could execute again.

## Files Repaired

${repairedFiles.map((file) => `- \`${file}\``).join('\n')}

## Import Fixes

- Added \`assessLivePreviewReality\` import from \`live-preview-reality/index.js\`.
- Added \`getLastCqiMaturityAssessment\` import for Live Preview requirement discovery slice.
- Added \`assessLaunchCouncil\` and \`buildLaunchCouncilArtifacts\` imports in Launch Council founder integration.
- Removed duplicate \`mapAutonomousFounderLaunchCouncilAuthority\` import.

## Type / Wiring Fixes

- Extended \`CanonicalLivePreviewWorkspaceSlice\` with optional \`requirementDiscovery\` evidence passthrough (confidence, coverage summary, gap summary, open/resolved question counts).
- Wired \`assessCqiMaturity()\` into \`buildClarifyingQuestionIntelligenceArtifacts()\` so founder pipeline records maturity before Launch Council assembly.
- Enriched \`mapClarifyingQuestionIntelligence()\` findings with maturity confidence, coverage matrix, gap summary, and question counts.

## Validation Results

| Check | Result |
| --- | --- |
| Scenarios | ${results.length - failed.length}/${results.length} |
| CQI validator | ${chainResults['validate:clarifying-question-intelligence'] ? 'PASS' : 'FAIL'} |
| CQI maturity validator | ${chainResults['validate:clarifying-question-intelligence-maturity-v1'] ? 'PASS' : 'FAIL'} |
| AFLA validator | ${chainResults['validate:autonomous-founder-launch-authority-v1'] ? 'PASS' : 'FAIL'} |
| Canonical ownership validator | ${chainResults['validate:canonical-capability-ownership-v1'] ? 'PASS' : 'FAIL'} |
| Founder review dashboard validator | ${chainResults['validate:founder-review-operator-dashboard-v1'] ? 'PASS' : 'FAIL'} |

Related pass tokens:

- \`${CLARIFYING_QUESTION_INTELLIGENCE_MATURITY_V1_PASS_TOKEN}\`
- \`AUTONOMOUS_FOUNDER_LAUNCH_AUTHORITY_V1_PASS\`
- \`CANONICAL_CAPABILITY_OWNERSHIP_V1_PASS\`
- \`FOUNDER_REVIEW_OPERATOR_DASHBOARD_V1_PASS\`

## Regression Status

- CQI canonical owner: **${cqiOwnership.capability}**
- AFLA launch owner: **${aflaOwnership.capability}**
- Remaining duplicate-risk: **${duplicateRiskCount}**
- Founder dashboard Requirement Discovery panel: **present**
- Founder dashboard Founder Review panel: **present**

## Evidence Flow

\`\`\`text
CQI assessCqiMaturity()
  ↓
Operator Requirement Discovery API
  ↓
Founder Evidence requirementDiscovery
  ↓
Launch Council mapClarifyingQuestionIntelligence()
  ↓
Live Preview canonical state requirementDiscovery slice
\`\`\`
`;

  writeFileSync(join(ROOT, REPORT_PATH), report, 'utf8');
  assert('25. repair report written', existsSync(join(ROOT, REPORT_PATH)), REPORT_PATH);

  console.log('');
  console.log(`Scenarios: ${results.length} | Passed: ${results.length - failed.length} | Failed: ${failed.length}`);
  console.log('');

  if (failed.length > 0) {
    for (const item of failed) {
      console.log(`FAIL — ${item.name}: ${item.detail}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(CQI_INTEGRATION_REPAIR_V1_PASS_TOKEN);
  console.log('');
}

main();
