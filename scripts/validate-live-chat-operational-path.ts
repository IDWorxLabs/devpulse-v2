/**
 * Phase 26.83 — Live Chat Operational Path Bypass Repair validation.
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
} from '../src/connected-launch-readiness-proof/index.js';
import {
  LIVE_CHAT_OPERATIONAL_PATH_BYPASS_REPAIR_V1_PASS,
  LIVE_OPERATIONAL_TRUTH_BYPASS,
  enhanceChatWithOperationalSelfKnowledge,
  getLiveOperationalTruthDiagnostics,
  isExecutionStageOperationalQuestion,
  resetOperationalEvidenceSnapshotCacheForTests,
  tryResolveLiveOperationalTruthAnswer,
} from '../src/chat-operational-self-knowledge/index.js';
import { generateLocalChatFallback } from '../src/llm-chat-brain/local-chat-fallback.js';
import { generateWorldClassChatResponse } from '../src/world-class-chat-brain/index.js';
import {
  resetExecutionChainStageResolverCacheForTests,
} from '../src/founder-test-integration/index.js';
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
  'src/chat-operational-self-knowledge/live-operational-truth-path.ts',
  'src/chat-operational-self-knowledge/chat-operational-self-knowledge-authority.ts',
  'src/llm-chat-brain/local-chat-fallback.ts',
  'src/world-class-chat-brain/chat-brain-orchestrator.ts',
  'src/llm-chat-brain/llm-chat-orchestrator.ts',
  'server/brain-api-handler.ts',
  'scripts/validate-live-chat-operational-path.ts',
  'architecture/LIVE_CHAT_OPERATIONAL_PATH_BYPASS_REPAIR_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const livePathSource = readFileSync(join(ROOT, 'src/chat-operational-self-knowledge/live-operational-truth-path.ts'), 'utf8');
const fallbackSource = readFileSync(join(ROOT, 'src/llm-chat-brain/local-chat-fallback.ts'), 'utf8');
const worldClassSource = readFileSync(join(ROOT, 'src/world-class-chat-brain/chat-brain-orchestrator.ts'), 'utf8');
const orchestratorSource = readFileSync(join(ROOT, 'src/llm-chat-brain/llm-chat-orchestrator.ts'), 'utf8');
const handlerSource = readFileSync(join(ROOT, 'server/brain-api-handler.ts'), 'utf8');
const serverSource = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8');

assert('live path module defines operationalTruthPath', livePathSource.includes('OperationalTruthPath'), 'path type');
assert('live path defines LIVE_OPERATIONAL_TRUTH_BYPASS', livePathSource.includes('LIVE_OPERATIONAL_TRUTH_BYPASS'), 'bypass kind');
assert('local fallback uses tryResolveLiveOperationalTruthAnswer', fallbackSource.includes('tryResolveLiveOperationalTruthAnswer'), 'fallback gate');
assert('world-class uses live operational gate', worldClassSource.includes('tryResolveLiveOperationalTruthAnswer'), 'world-class gate');
assert('llm orchestrator forceLivePath', orchestratorSource.includes('forceLivePath: true'), 'llm force');
assert('diagnostic endpoint handler', handlerSource.includes('sendBrainOperationalTruth'), 'handler');
assert('diagnostic route registered', serverSource.includes('/api/brain/operational-truth'), 'route');

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

const diagnostics = getLiveOperationalTruthDiagnostics(ROOT);
assert('diagnostics operationalTruthPath connected', diagnostics.operationalTruthPath === 'connected-execution-truth', diagnostics.operationalTruthPath);
assert('diagnostics executionTruthSource set', diagnostics.executionTruthSource === 'connected-execution-chain-stage-resolver', diagnostics.executionTruthSource);

const scenarios = [
  'What is your current first broken stage?',
  'Can you run applications?',
  'Can you preview applications?',
  'What are your top three launch blockers?',
  'Are you ready to launch?',
];

for (const message of scenarios) {
  assert(`execution-stage detected: ${message.slice(0, 32)}`, isExecutionStageOperationalQuestion(message), message);
  resetOperationalEvidenceSnapshotCacheForTests();

  const live = tryResolveLiveOperationalTruthAnswer({ message, rootDir: ROOT });
  assert(`live gate resolves: ${message.slice(0, 32)}`, live?.usedOperationalSelfKnowledge === true, String(live?.usedOperationalSelfKnowledge));
  assert(
    `live path connected truth: ${message.slice(0, 32)}`,
    live?.operationalTruthPath === 'connected-execution-truth',
    live?.operationalTruthPath ?? 'missing',
  );
  assert(
    `no autonomous-build in live answer: ${message.slice(0, 32)}`,
    !/\bautonomous-build-execution-proof\b/i.test(live?.finalAnswer ?? ''),
    (live?.finalAnswer ?? '').slice(0, 80),
  );

  const fallback = generateLocalChatFallback({
    message,
    rootDir: ROOT,
    reason: 'validator disconnected path',
    mode: 'disconnected',
  });
  assert(
    `fallback path no autonomous-build: ${message.slice(0, 32)}`,
    !/\bautonomous-build-execution-proof\b/i.test(fallback.finalAnswer),
    fallback.finalAnswer.slice(0, 80),
  );

  const worldClass = generateWorldClassChatResponse({ message, rootDir: ROOT });
  assert(
    `world-class path no autonomous-build: ${message.slice(0, 32)}`,
    !/\bautonomous-build-execution-proof\b/i.test(worldClass.finalAnswer),
    worldClass.finalAnswer.slice(0, 80),
  );

  if (message.toLowerCase().includes('run applications') && live?.assessment?.snapshot.executionChainTruth.runtimeProven) {
    assert(
      'run applications reflects runtime proven',
      /\b(PROVEN|Runtime proven: yes)\b/i.test(live.finalAnswer),
      live.finalAnswer.slice(0, 100),
    );
  }
}

const bypassProbe = enhanceChatWithOperationalSelfKnowledge({
  message: 'What is your current first broken stage?',
  draftAnswer: 'First broken execution stage: BUILD.\nEvidence source: autonomous-build-execution-proof.',
  rootDir: ROOT,
  forceLivePath: true,
  forceSnapshotRefresh: true,
});
assert(
  'stale draft not merged for execution question',
  !bypassProbe.finalAnswer.includes('autonomous-build-execution-proof'),
  bypassProbe.finalAnswer.slice(0, 100),
);
assert(
  'bypass detector kind exported',
  LIVE_OPERATIONAL_TRUTH_BYPASS === 'LIVE_OPERATIONAL_TRUTH_BYPASS',
  LIVE_OPERATIONAL_TRUTH_BYPASS,
);

assert('no scoring manipulation', !livePathSource.includes('readinessScore'), 'scoring');
assert('no verdict manipulation', !livePathSource.includes('verdictFromScore'), 'verdict');
const validatorSource = readFileSync(join(ROOT, 'scripts/validate-live-chat-operational-path.ts'), 'utf8');
const chatIntelImportProbe = ['../src/chat-intelligence', '-reality/index.js'].join('');
assert('no validator recursion', !validatorSource.includes(chatIntelImportProbe), 'recursion');

const reportBody = readFileSync(join(ROOT, 'architecture/LIVE_CHAT_OPERATIONAL_PATH_BYPASS_REPAIR_REPORT.md'), 'utf8');
assert('architecture report token', reportBody.includes(LIVE_CHAT_OPERATIONAL_PATH_BYPASS_REPAIR_V1_PASS), LIVE_CHAT_OPERATIONAL_PATH_BYPASS_REPAIR_V1_PASS);

console.log('\n--- Live Chat Operational Path Bypass Repair Validation ---');
for (const entry of results) {
  console.log(`${entry.passed ? 'PASS' : 'FAIL'} — ${entry.name}: ${entry.detail}`);
}
const failed = results.filter((entry) => !entry.passed);
if (failed.length === 0) {
  console.log(`\n${LIVE_CHAT_OPERATIONAL_PATH_BYPASS_REPAIR_V1_PASS}`);
  process.exit(0);
}
console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
