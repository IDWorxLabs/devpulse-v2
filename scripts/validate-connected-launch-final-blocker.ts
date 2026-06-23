/**
 * Phase 26.85 — Connected Launch Stage Final Blocker Repair validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assessConnectedBuildExecution,
  materializeBuildContractExpectations,
  materializeBuildProofGapArtifacts,
  resetConnectedBuildExecutionModuleForTests,
} from '../src/connected-build-execution/index.js';
import {
  assessConnectedPreviewExperienceProof,
  resetConnectedPreviewExperienceProofModuleForTests,
} from '../src/connected-preview-experience-proof/index.js';
import {
  assessConnectedRuntimeActivationProof,
  resetConnectedRuntimeActivationProofModuleForTests,
} from '../src/connected-runtime-activation-proof/index.js';
import {
  assessConnectedVerificationExecutionProof,
  resetConnectedVerificationExecutionProofModuleForTests,
} from '../src/connected-verification-execution-proof/index.js';
import {
  assessConnectedLaunchReadinessProof,
  resetConnectedLaunchReadinessProofModuleForTests,
  CONNECTED_LAUNCH_STAGE_FINAL_BLOCKER_REPAIR_V1_PASS,
  LAUNCH_PROOF_CONTRADICTION,
  buildLaunchNotProvenAnswer,
  buildLaunchProofDependencyGraph,
  detectLaunchProofContradictions,
  getLaunchProofDiagnostics,
  resolveFirstLaunchBlocker,
} from '../src/connected-launch-readiness-proof/index.js';
import {
  enhanceChatWithOperationalSelfKnowledge,
  isExecutionStageOperationalQuestion,
  resetOperationalEvidenceSnapshotCacheForTests,
  tryResolveLiveOperationalTruthAnswer,
} from '../src/chat-operational-self-knowledge/index.js';
import { resetExecutionChainStageResolverCacheForTests } from '../src/founder-test-integration/index.js';
import {
  assessRequirementsToPlanExecutionContract,
  resetRequirementsToPlanContractModuleForTests,
} from '../src/requirements-to-plan-execution-contract/index.js';

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

const REQUIRED = [
  'src/connected-launch-readiness-proof/launch-proof-dependency-graph.ts',
  'src/connected-launch-readiness-proof/launch-proof-contradiction-detector.ts',
  'scripts/validate-connected-launch-final-blocker.ts',
  'architecture/CONNECTED_LAUNCH_STAGE_FINAL_BLOCKER_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const graphSource = readFileSync(join(ROOT, 'src/connected-launch-readiness-proof/launch-proof-dependency-graph.ts'), 'utf8');
const contradictionSource = readFileSync(
  join(ROOT, 'src/connected-launch-readiness-proof/launch-proof-contradiction-detector.ts'),
  'utf8',
);
const builderSource = readFileSync(join(ROOT, 'src/chat-operational-self-knowledge/operational-status-builder.ts'), 'utf8');
const composerSource = readFileSync(join(ROOT, 'src/chat-operational-self-knowledge/operational-response-composer.ts'), 'utf8');
const handlerSource = readFileSync(join(ROOT, 'server/brain-api-handler.ts'), 'utf8');
const validatorSource = readFileSync(join(ROOT, 'scripts/validate-connected-launch-final-blocker.ts'), 'utf8');

assert('LaunchProofDependencyGraph builder', graphSource.includes('buildLaunchProofDependencyGraph'), 'graph');
assert('resolveFirstLaunchBlocker', graphSource.includes('resolveFirstLaunchBlocker'), 'blocker');
assert('buildLaunchNotProvenExplanation', graphSource.includes('buildLaunchNotProvenExplanation'), 'explanation');
assert('LAUNCH_PROOF_CONTRADICTION', contradictionSource.includes('LAUNCH_PROOF_CONTRADICTION'), 'contradiction');
assert('chat uses dependency graph', builderSource.includes('buildLaunchProofDependencyGraph'), 'chat graph');
assert('composer LAUNCH_NOT_PROVEN', composerSource.includes("'LAUNCH_NOT_PROVEN'"), 'composer kind');
assert('diagnostics launchProof', handlerSource.includes('getLaunchProofDiagnostics'), 'diagnostics');
assert('no scoring manipulation', !graphSource.includes('readinessScore =') && !graphSource.includes('verdictFromScore'), 'scoring');
assert('no verdict manipulation', !graphSource.includes('FOUNDER_READY') || graphSource.includes('getLatestFounderTestAssessment'), 'verdict');
const chatIntelImportProbe = ['../src/chat-intelligence', '-reality/index.js'].join('');
assert('no validator recursion', !validatorSource.includes(chatIntelImportProbe), 'recursion');

const CRM_PROMPT =
  'Build a CRM for a small sales team with contacts, deals, tasks, login, dashboard, and admin role.';

resetRequirementsToPlanContractModuleForTests();
let contract = null;
for (let i = 0; i < 4; i += 1) {
  contract = assessRequirementsToPlanExecutionContract({ rawPrompt: CRM_PROMPT }).report.buildReadyContract;
}
assert('build-ready contract available', contract != null, contract?.contractId ?? 'missing');

resetExecutionChainStageResolverCacheForTests();
resetConnectedBuildExecutionModuleForTests();
resetConnectedRuntimeActivationProofModuleForTests();
resetConnectedPreviewExperienceProofModuleForTests();
resetConnectedVerificationExecutionProofModuleForTests();
resetConnectedLaunchReadinessProofModuleForTests();
resetOperationalEvidenceSnapshotCacheForTests();

if (contract) {
  const materialization = materializeBuildContractExpectations(contract);
  materializeBuildProofGapArtifacts({ projectRootDir: ROOT, contract });
  assessConnectedBuildExecution({
    rootDir: ROOT,
    buildReadyContract: contract,
    observedEvidence: {
      paths: materialization.expectedFiles,
      directories: materialization.workspaceTargets,
    },
  });
  assessConnectedRuntimeActivationProof({ rootDir: ROOT });
  assessConnectedPreviewExperienceProof({ rootDir: ROOT });
  assessConnectedVerificationExecutionProof({ rootDir: ROOT });
  assessConnectedLaunchReadinessProof({ rootDir: ROOT });
}

resetOperationalEvidenceSnapshotCacheForTests();
const graph = buildLaunchProofDependencyGraph({ rootDir: ROOT });

assert('launch dependency graph exists', graph.dependencies.length >= 10, String(graph.dependencies.length));
assert('launch dependency count', graph.launchDependencyCount === graph.dependencies.length, String(graph.launchDependencyCount));
assert('execution stages in graph', graph.dependencies.some((d) => d.dependencyId === 'build'), 'build');
assert('verification in graph', graph.dependencies.some((d) => d.dependencyId === 'verification'), 'verify');
assert('typecheck in graph', graph.dependencies.some((d) => d.dependencyId === 'typecheck-reality'), 'typecheck');

if (!graph.launchProven) {
  assert('first launch blocker exists', graph.firstLaunchBlocker != null, graph.firstLaunchBlocker?.blockerId ?? 'missing');
  assert('launch explanation exists', graph.notProvenExplanation != null && graph.notProvenExplanation.conditions.length > 0, String(graph.notProvenExplanation?.conditions.length));
  assert('explanation lists conditions', graph.notProvenExplanation!.conditions.every((c) => c.length > 5), 'conditions');
  const answer = buildLaunchNotProvenAnswer(graph);
  assert('launch answer not generic', answer.includes('Launch is NOT_PROVEN because'), answer.slice(0, 80));
  assert('launch answer cites primary blocker', graph.firstLaunchBlocker ? answer.includes(graph.firstLaunchBlocker.blockerName) : true, answer.slice(0, 120));
} else {
  assert('launch proven when graph complete', graph.launchProofLevel === 'PROVEN', graph.launchProofLevel);
}

const primary = resolveFirstLaunchBlocker({
  launchReport: graph.launchReport,
  launchProofLevel: graph.launchProofLevel,
  launchProven: graph.launchProven,
  dependencies: graph.dependencies,
});
assert(
  'resolveFirstLaunchBlocker matches graph',
  (primary?.blockerId ?? null) === (graph.firstLaunchBlocker?.blockerId ?? null),
  `${primary?.blockerId ?? 'none'} vs ${graph.firstLaunchBlocker?.blockerId ?? 'none'}`,
);

const diagnostics = getLaunchProofDiagnostics(ROOT);
assert('diagnostics launchDependencyCount', diagnostics.launchDependencyCount >= 10, String(diagnostics.launchDependencyCount));
assert('diagnostics launchTruthGeneratedAt', diagnostics.launchTruthGeneratedAt.length > 0, diagnostics.launchTruthGeneratedAt);

const launchQuestions = [
  'Why is launch not proven?',
  'What is preventing launch?',
  'What is the first launch blocker?',
  'What do I need to fix before launch?',
];

for (const message of launchQuestions) {
  assert(`launch question routed: ${message.slice(0, 30)}`, isExecutionStageOperationalQuestion(message), message);
  resetOperationalEvidenceSnapshotCacheForTests();
  const live = tryResolveLiveOperationalTruthAnswer({ message, rootDir: ROOT });
  assert(`live resolves: ${message.slice(0, 30)}`, live?.usedOperationalSelfKnowledge === true, String(live?.usedOperationalSelfKnowledge));
  assert(
    `answer uses dependency graph: ${message.slice(0, 30)}`,
    graph.launchProven
      ? (live?.finalAnswer ?? '').includes('PROVEN')
      : (live?.finalAnswer ?? '').includes('LaunchProofDependencyGraph') ||
        (live?.finalAnswer ?? '').includes('Launch is NOT_PROVEN because') ||
        (live?.finalAnswer ?? '').includes('Primary launch blocker') ||
        (live?.finalAnswer ?? '').includes('Fix before launch'),
    (live?.finalAnswer ?? '').slice(0, 120),
  );
  assert(
    `no generic unknown reason: ${message.slice(0, 30)}`,
    !/\breason unknown\b/i.test(live?.finalAnswer ?? ''),
    (live?.finalAnswer ?? '').slice(0, 80),
  );
}

assert('LAUNCH_PROOF_CONTRADICTION exported', LAUNCH_PROOF_CONTRADICTION === 'LAUNCH_PROOF_CONTRADICTION', LAUNCH_PROOF_CONTRADICTION);
assert('contradiction detector callable', typeof detectLaunchProofContradictions === 'function', 'fn');

const staleDraft = enhanceChatWithOperationalSelfKnowledge({
  message: 'Why is launch not proven?',
  draftAnswer: 'Launch is not proven. Reason unknown. Everything looks fine.',
  rootDir: ROOT,
  forceLivePath: true,
  forceSnapshotRefresh: true,
});
assert('stale launch draft not merged', !staleDraft.finalAnswer.includes('Reason unknown'), staleDraft.finalAnswer.slice(0, 120));

const partialGraph = buildLaunchProofDependencyGraph({
  rootDir: ROOT,
  launchReport: assessConnectedLaunchReadinessProof({
    rootDir: ROOT,
    launchReadinessFixture: { forceReadinessState: 'NOT_READY' },
  }).report,
});
assert('NOT_PROVEN fixture graph', !partialGraph.launchProven, partialGraph.launchProofLevel);
assert('NOT_PROVEN fixture has blocker', partialGraph.firstLaunchBlocker != null, partialGraph.firstLaunchBlocker?.blockerId ?? 'missing');
assert(
  'NOT_PROVEN fixture explanation',
  (partialGraph.notProvenExplanation?.conditions.length ?? 0) > 0,
  String(partialGraph.notProvenExplanation?.conditions.length),
);
assert(
  'NOT_PROVEN fixture answer',
  buildLaunchNotProvenAnswer(partialGraph).includes('Launch is NOT_PROVEN because'),
  buildLaunchNotProvenAnswer(partialGraph).slice(0, 80),
);

const reportBody = readFileSync(join(ROOT, 'architecture/CONNECTED_LAUNCH_STAGE_FINAL_BLOCKER_REPORT.md'), 'utf8');
assert('architecture report token', reportBody.includes(CONNECTED_LAUNCH_STAGE_FINAL_BLOCKER_REPAIR_V1_PASS), CONNECTED_LAUNCH_STAGE_FINAL_BLOCKER_REPAIR_V1_PASS);

console.log('\n--- Connected Launch Stage Final Blocker Validation ---');
for (const entry of results) {
  console.log(`${entry.passed ? 'PASS' : 'FAIL'} — ${entry.name}: ${entry.detail}`);
}
const failed = results.filter((entry) => !entry.passed);
if (failed.length === 0) {
  console.log(`\n${CONNECTED_LAUNCH_STAGE_FINAL_BLOCKER_REPAIR_V1_PASS}`);
  process.exit(0);
}
console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
