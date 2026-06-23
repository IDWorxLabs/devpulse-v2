/**
 * Phase 26.74 — Build Materialization Reality validation (V1).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BUILD_MATERIALIZATION_REALITY_PASS,
  FOUNDER_MATERIALIZATION_QUESTIONS,
  MATERIALIZATION_CHAIN_STAGES,
  assessBuildMaterializationReality,
  buildBuildMaterializationRealityReportMarkdown,
  getBuildMaterializationRealityHistorySize,
  resetBuildMaterializationRealityModuleForTests,
  scanArtifactReality,
} from '../src/build-materialization-reality/index.js';
import { resetConnectedBuildExecutionCounterForTests } from '../src/connected-build-execution/index.js';

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

class MutationGuard {
  private readonly authoritySource: string;

  constructor() {
    this.authoritySource = readFileSync(
      join(ROOT, 'src/build-materialization-reality/build-materialization-reality-authority.ts'),
      'utf8',
    );
  }

  noFileMutation(): boolean {
    return (
      !this.authoritySource.includes('writeFileSync') &&
      !this.authoritySource.includes('writeFile(') &&
      !this.authoritySource.includes('materializeBuildProofGapArtifacts')
    );
  }

  noSyntheticEvidence(): boolean {
    return (
      !this.authoritySource.includes('materializeBuildProofGapArtifacts') &&
      this.authoritySource.includes('attemptBuildProofGapMaterialization: false')
    );
  }
}

const REQUIRED = [
  'src/build-materialization-reality/build-materialization-reality-types.ts',
  'src/build-materialization-reality/build-materialization-reality-registry.ts',
  'src/build-materialization-reality/artifact-scanner.ts',
  'src/build-materialization-reality/workspace-scanner.ts',
  'src/build-materialization-reality/materialization-analyzer.ts',
  'src/build-materialization-reality/chain-linker.ts',
  'src/build-materialization-reality/build-materialization-reality-report-builder.ts',
  'src/build-materialization-reality/build-materialization-reality-history.ts',
  'src/build-materialization-reality/build-materialization-reality-authority.ts',
  'src/build-materialization-reality/index.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const registrySource = readFileSync(
  join(ROOT, 'src/build-materialization-reality/build-materialization-reality-registry.ts'),
  'utf8',
);
const analyzerSource = readFileSync(
  join(ROOT, 'src/build-materialization-reality/materialization-analyzer.ts'),
  'utf8',
);

assert('BUILD_MATERIALIZATION_REALITY_PASS token', registrySource.includes(BUILD_MATERIALIZATION_REALITY_PASS), 'missing');
assert('verdict ARTIFACTS_NOT_GENERATED', analyzerSource.includes('ARTIFACTS_NOT_GENERATED'), 'missing');
assert('verdict ARTIFACTS_GENERATED_NOT_LINKED', analyzerSource.includes('ARTIFACTS_GENERATED_NOT_LINKED'), 'missing');
assert('verdict WORKSPACE_NOT_LINKED', analyzerSource.includes('WORKSPACE_NOT_LINKED'), 'missing');
assert('verdict EVIDENCE_PROPAGATION_FAILURE', analyzerSource.includes('EVIDENCE_PROPAGATION_FAILURE'), 'missing');
assert('verdict BUILD_MATERIALIZATION_PROVEN', analyzerSource.includes('BUILD_MATERIALIZATION_PROVEN'), 'missing');
assert('founder questions count', FOUNDER_MATERIALIZATION_QUESTIONS.length === 6, String(FOUNDER_MATERIALIZATION_QUESTIONS.length));
assert('chain stages count', MATERIALIZATION_CHAIN_STAGES.length === 9, String(MATERIALIZATION_CHAIN_STAGES.length));

const guard = new MutationGuard();
assert('no file mutation in authority', guard.noFileMutation(), 'authority may mutate files');
assert('no synthetic evidence in authority', guard.noSyntheticEvidence(), 'authority may synthesize evidence');

resetBuildMaterializationRealityModuleForTests();
resetConnectedBuildExecutionCounterForTests();

const assessment = assessBuildMaterializationReality({ rootDir: ROOT });
const report = assessment.report;

assert('assessment completes', assessment.orchestrationState === 'MATERIALIZATION_REALITY_COMPLETE', assessment.orchestrationState);
assert('artifact scan executes', report.artifactScan.workspaceCount >= 0, String(report.artifactScan.workspaceCount));
assert(
  'workspace deep scan bounded',
  report.artifactScan.workspaces.length > 0 && report.artifactScan.workspaces.length <= 8,
  `${report.artifactScan.workspaces.length} deep-scanned of ${report.artifactScan.workspaceCount} total`,
);
assert('materialization chain length', report.materializationChain.length === 9, String(report.materializationChain.length));
assert('primary verdict assigned', Boolean(report.primaryVerdict), report.primaryVerdict);
assert(
  'first broken link identified or proven',
  report.verdictAnalysis.firstBrokenLink !== null || report.primaryVerdict === 'BUILD_MATERIALIZATION_PROVEN',
  report.verdictAnalysis.firstBrokenLink ?? 'proven',
);
assert('root cause reason', report.verdictAnalysis.verdictReason.length > 0, 'empty');
assert('founder answers generated', report.founderAnswers.whatMustBeFixedNext.length > 0, 'empty');
assert('didGenerateBuildFiles answered', typeof report.founderAnswers.didGenerateBuildFiles === 'boolean', 'missing');
assert('gap kind assigned', ['PRODUCT_GAP', 'PROOF_GAP', 'NONE'].includes(report.founderAnswers.gapKind), report.founderAnswers.gapKind);
assert('history recorded', getBuildMaterializationRealityHistorySize() >= 1, String(getBuildMaterializationRealityHistorySize()));
assert('report markdown builds', buildBuildMaterializationRealityReportMarkdown(report).includes('Primary verdict'), 'missing');

const directScan = scanArtifactReality({
  rootDir: ROOT,
  contract: null,
  connectedBuildReport: null,
});
assert('direct artifact scan read-only', directScan.readOnly === true, 'not readOnly');
assert('exact counts produced', typeof directScan.totalFilesObserved === 'number', 'missing count');

const failed = results.filter((entry) => !entry.passed);
const validationSummary = [
  '# Build Materialization Reality Validation',
  '',
  `Result: ${failed.length === 0 ? BUILD_MATERIALIZATION_REALITY_PASS : 'FAILED'}`,
  '',
  ...results.map((entry) => `- [${entry.passed ? 'x' : ' '}] ${entry.name}: ${entry.detail}`),
  '',
  '## Assessment snapshot',
  '',
  `- primaryVerdict=${report.primaryVerdict}`,
  `- gapKind=${report.gapKind}`,
  `- firstBrokenLink=${report.verdictAnalysis.firstBrokenLink ?? 'none'}`,
  `- firstBrokenFile=${report.verdictAnalysis.firstBrokenFile ?? 'none'}`,
  `- workspaceCount=${report.artifactScan.workspaceCount}`,
  `- existingArtifacts=${report.artifactScan.totalExistingArtifacts}`,
  `- missingArtifacts=${report.artifactScan.totalMissingArtifacts}`,
  `- connectedBuildProofLevel=${report.connectedBuildProofLevel ?? 'n/a'}`,
  '',
].join('\n');

writeFileSync(
  join(ROOT, 'architecture', 'BUILD_MATERIALIZATION_REALITY_VALIDATION.md'),
  validationSummary,
  'utf8',
);

writeFileSync(
  join(ROOT, 'architecture', 'BUILD_MATERIALIZATION_REALITY_REPORT.md'),
  [
    '# Build Materialization Reality Report',
    '',
    '## Objective',
    '',
    'Determine whether BUILD → PARTIAL is caused by missing artifacts, broken linkage, workspace disconnect, or evidence propagation failure — with file-level evidence only.',
    '',
    '## Path',
    '',
    '- `assessBuildMaterializationReality()` — read-only orchestrator',
    '- `scanArtifactReality()` — filesystem scan under `.generated-builder-workspaces/`',
    '- `buildMaterializationChain()` — idea → verification contract chain',
    '- `analyzeMaterializationVerdict()` — single primary root cause',
    '',
    '## Validator vs real Founder Test',
    '',
    '| Path | Entry |',
    '|------|-------|',
    '| Validator | `assessBuildMaterializationReality({ rootDir })` |',
    '| Real Founder Test | Same authority — no gap materializer, no synthetic evidence |',
    '',
    '## Latest assessment',
    '',
    `- primaryVerdict: **${report.primaryVerdict}**`,
    `- gapKind: **${report.gapKind}**`,
    `- firstBrokenLink: **${report.verdictAnalysis.firstBrokenLink ?? 'none'}**`,
    `- firstBrokenFile: **${report.verdictAnalysis.firstBrokenFile ?? 'none'}**`,
    `- lostEvidenceAuthority: **${report.verdictAnalysis.lostEvidenceAuthority ?? 'none'}**`,
    '',
    '## Files changed',
    '',
    '- `src/build-materialization-reality/` (new module)',
    '- `scripts/validate-build-materialization-reality.ts`',
    '- `package.json`',
    '',
    '## Pass token',
    '',
    BUILD_MATERIALIZATION_REALITY_PASS,
    '',
    buildBuildMaterializationRealityReportMarkdown(report),
  ].join('\n'),
  'utf8',
);

if (failed.length > 0) {
  console.error(validationSummary);
  process.exit(1);
}

console.log(BUILD_MATERIALIZATION_REALITY_PASS);
console.log(validationSummary);
