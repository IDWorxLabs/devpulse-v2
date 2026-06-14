/**
 * Phase 26.84 — Chat Routing Consistency and Truth Unification validation.
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
  CHAT_OPERATIONAL_CONTRADICTION,
  CHAT_ROUTING_CONSISTENCY_AND_TRUTH_UNIFICATION_V1_PASS,
  OPERATIONAL_TRUTH_CONTEXT_VERSION,
  buildOperationalTruthContext,
  detectChatOperationalContradictions,
  enhanceChatWithOperationalSelfKnowledge,
  getLiveOperationalTruthDiagnostics,
  getOperationalEvidenceSnapshot,
  isExecutionStageOperationalQuestion,
  resetOperationalEvidenceSnapshotCacheForTests,
  tryResolveLiveOperationalTruthAnswer,
} from '../src/chat-operational-self-knowledge/index.js';
import { generateLocalChatFallback } from '../src/llm-chat-brain/local-chat-fallback.js';
import { generateWorldClassChatResponse } from '../src/world-class-chat-brain/index.js';
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
  'src/chat-operational-self-knowledge/operational-truth-context.ts',
  'src/chat-operational-self-knowledge/operational-status-builder.ts',
  'src/chat-operational-self-knowledge/chat-operational-contradiction-detector.ts',
  'src/chat-operational-self-knowledge/live-operational-truth-path.ts',
  'src/chat-operational-self-knowledge/operational-response-composer.ts',
  'scripts/validate-chat-routing-consistency.ts',
  'architecture/CHAT_ROUTING_CONSISTENCY_AND_TRUTH_UNIFICATION_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const contextSource = readFileSync(join(ROOT, 'src/chat-operational-self-knowledge/operational-truth-context.ts'), 'utf8');
const builderSource = readFileSync(join(ROOT, 'src/chat-operational-self-knowledge/operational-status-builder.ts'), 'utf8');
const contradictionSource = readFileSync(
  join(ROOT, 'src/chat-operational-self-knowledge/chat-operational-contradiction-detector.ts'),
  'utf8',
);
const composerSource = readFileSync(join(ROOT, 'src/chat-operational-self-knowledge/operational-response-composer.ts'), 'utf8');
const livePathSource = readFileSync(join(ROOT, 'src/chat-operational-self-knowledge/live-operational-truth-path.ts'), 'utf8');
const classifierSource = readFileSync(join(ROOT, 'src/chat-operational-self-knowledge/operational-question-classifier.ts'), 'utf8');
const validatorSource = readFileSync(join(ROOT, 'scripts/validate-chat-routing-consistency.ts'), 'utf8');

assert('OperationalTruthContext module', contextSource.includes('buildOperationalTruthContext'), 'context builder');
assert('shared status builder', builderSource.includes('buildExecutionStageInventoryAnswer'), 'inventory builder');
assert('shared truth source builder', builderSource.includes('buildTruthSourceAnswer'), 'truth source builder');
assert('CHAT_OPERATIONAL_CONTRADICTION kind', contradictionSource.includes('CHAT_OPERATIONAL_CONTRADICTION'), 'contradiction kind');
assert('composer uses shared builder', composerSource.includes('buildExecutionStageInventoryAnswer'), 'composer wiring');
assert('composer uses truth context', composerSource.includes('resolveTruthContext'), 'truth context');
assert('classifier TRUTH_SOURCE kind', classifierSource.includes("'TRUTH_SOURCE'"), 'truth source kind');
assert('classifier EXECUTION_STAGE_INVENTORY kind', classifierSource.includes("'EXECUTION_STAGE_INVENTORY'"), 'inventory kind');
assert('live path routes truth source', livePathSource.includes('TRUTH_SOURCE'), 'live truth source');
assert('live path routes stage inventory', livePathSource.includes('EXECUTION_STAGE_INVENTORY'), 'live inventory');
assert('diagnostics expose context version', livePathSource.includes('operationalTruthContextVersion'), 'diagnostics');
assert('no hardcoded proven answers', !composerSource.includes('Runtime proven: true') && !builderSource.includes('Runtime proven: true'), 'hardcode');
assert('no scoring manipulation', !contextSource.includes('readinessScore') && !builderSource.includes('readinessScore'), 'scoring');
assert('no verdict manipulation', !contextSource.includes('verdictFromScore') && !builderSource.includes('verdictFromScore'), 'verdict');
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
const snapshot = getOperationalEvidenceSnapshot(ROOT, { forceRefresh: true });
const context = snapshot.operationalTruthContext ?? buildOperationalTruthContext(snapshot);

assert('snapshot has operationalTruthContext', snapshot.operationalTruthContext != null, snapshot.operationalTruthContext?.version ?? 'missing');
assert('context version', context.version === OPERATIONAL_TRUTH_CONTEXT_VERSION, context.version);
assert('stage inventory from chain truth', context.stageInventory.length >= 7, String(context.stageInventory.length));

const internalContradictions = detectChatOperationalContradictions({
  context: {
    executionChainTruth: context.executionChainTruth,
    stageInventory: context.stageInventory,
    executionTruthSource: context.executionTruthSource,
    capabilityTruth: snapshot.capabilityTruth,
  },
});
assert('same-snapshot stage inventory agrees with chain', internalContradictions.length === 0, String(internalContradictions.length));

const diagnostics = getLiveOperationalTruthDiagnostics(ROOT);
assert('diagnostics operationalTruthContextVersion', diagnostics.operationalTruthContextVersion === OPERATIONAL_TRUTH_CONTEXT_VERSION, diagnostics.operationalTruthContextVersion);
assert('diagnostics operationalTruthSource', diagnostics.operationalTruthSource === context.executionTruthSource, diagnostics.operationalTruthSource);
assert('diagnostics contradictionCount', typeof diagnostics.contradictionCount === 'number', String(diagnostics.contradictionCount));

const scenarios = [
  'What is your current first broken stage?',
  'Can you run applications?',
  'Can you preview applications?',
  'What execution truth source are you using?',
  'List all execution stages and their current status.',
];

const answers: Record<string, string> = {};

for (const message of scenarios) {
  assert(`unified operational detected: ${message.slice(0, 40)}`, isExecutionStageOperationalQuestion(message), message);
  resetOperationalEvidenceSnapshotCacheForTests();

  const live = tryResolveLiveOperationalTruthAnswer({ message, rootDir: ROOT });
  assert(`live gate resolves: ${message.slice(0, 40)}`, live?.usedOperationalSelfKnowledge === true, String(live?.usedOperationalSelfKnowledge));
  assert(
    `connected truth path: ${message.slice(0, 40)}`,
    live?.operationalTruthPath === 'connected-execution-truth',
    live?.operationalTruthPath ?? 'missing',
  );

  const answer = live?.finalAnswer ?? '';
  answers[message] = answer;

  assert(
    `no truth-source denial: ${message.slice(0, 40)}`,
    !/\b(do not have access|don't have access|no connected execution truth)\b/i.test(answer),
    answer.slice(0, 120),
  );
  assert(
    `no autonomous-build stale source: ${message.slice(0, 40)}`,
    !/\bautonomous-build-execution-proof\b/i.test(answer),
    answer.slice(0, 120),
  );
  assert(
    `cites synchronized truth source: ${message.slice(0, 40)}`,
    answer.includes(context.executionTruthSource),
    answer.slice(0, 120),
  );

  const responseContradictions = detectChatOperationalContradictions({
    context: {
      executionChainTruth: context.executionChainTruth,
      stageInventory: context.stageInventory,
      executionTruthSource: context.executionTruthSource,
      capabilityTruth: snapshot.capabilityTruth,
    },
    responseText: answer,
    questionCategory: live?.questionKind ?? 'scenario',
  });
  assert(
    `no response contradictions: ${message.slice(0, 40)}`,
    responseContradictions.length === 0,
    responseContradictions.map((c) => c.detail).join('; ') || 'ok',
  );

  const fallback = generateLocalChatFallback({
    message,
    rootDir: ROOT,
    reason: 'validator disconnected path',
    mode: 'disconnected',
  });
  assert(
    `fallback unified path: ${message.slice(0, 40)}`,
    fallback.finalAnswer.includes(context.executionTruthSource) ||
      !/\b(do not have access|autonomous-build-execution-proof)\b/i.test(fallback.finalAnswer),
    fallback.finalAnswer.slice(0, 120),
  );

  const worldClass = generateWorldClassChatResponse({ message, rootDir: ROOT });
  assert(
    `world-class unified path: ${message.slice(0, 40)}`,
    worldClass.finalAnswer.includes(context.executionTruthSource) ||
      !/\b(do not have access|autonomous-build-execution-proof)\b/i.test(worldClass.finalAnswer),
    worldClass.finalAnswer.slice(0, 120),
  );
}

const runtimeAnswer = answers['Can you run applications?'] ?? '';
const previewAnswer = answers['Can you preview applications?'] ?? '';
const inventoryAnswer = answers['List all execution stages and their current status.'] ?? '';
const truthSourceAnswer = answers['What execution truth source are you using?'] ?? '';

if (context.executionChainTruth.runtimeProven) {
  assert('runtime answer reflects proven chain truth', /\b(PROVEN|Runtime proven: true)\b/i.test(runtimeAnswer), runtimeAnswer.slice(0, 120));
  assert('inventory runtime not unproven when chain proven', !/\bRuntime\b[^.\n]{0,40}\bNot proven\b/i.test(inventoryAnswer), inventoryAnswer.slice(0, 160));
  assert('inventory runtime not unproven label', !/\bRuntime:\s*Unproven\b/i.test(inventoryAnswer), inventoryAnswer.slice(0, 160));
}

if (context.executionChainTruth.previewProven) {
  assert('preview answer reflects proven chain truth', /\b(PROVEN|Preview proven: true)\b/i.test(previewAnswer), previewAnswer.slice(0, 120));
  assert('inventory preview not unproven when chain proven', !/\bPreview\b[^.\n]{0,40}\bNot proven\b/i.test(inventoryAnswer), inventoryAnswer.slice(0, 160));
  assert('inventory preview not partially proven when chain proven', !/\bPartially Proven\b/i.test(inventoryAnswer), inventoryAnswer.slice(0, 160));
}

assert(
  'truth source answer names connected resolver',
  truthSourceAnswer.includes(context.executionTruthSource),
  truthSourceAnswer.slice(0, 160),
);

if (context.firstBrokenStage) {
  const brokenStageAnswer = answers['What is your current first broken stage?'] ?? '';
  assert('first broken stage consistent', brokenStageAnswer.includes(context.firstBrokenStage), brokenStageAnswer.slice(0, 120));
}

assert('CHAT_OPERATIONAL_CONTRADICTION exported', CHAT_OPERATIONAL_CONTRADICTION === 'CHAT_OPERATIONAL_CONTRADICTION', CHAT_OPERATIONAL_CONTRADICTION);

const staleDraft = enhanceChatWithOperationalSelfKnowledge({
  message: 'List all execution stages and their current status.',
  draftAnswer: 'Build: Unproven\nRuntime: Unproven\nPreview: Partially Proven\nSource: autonomous-build-execution-proof',
  rootDir: ROOT,
  forceLivePath: true,
  forceSnapshotRefresh: true,
});
assert('stale inventory draft not merged', !staleDraft.finalAnswer.includes('Partially Proven'), staleDraft.finalAnswer.slice(0, 160));
assert('stale inventory draft bypassed', !staleDraft.finalAnswer.includes('autonomous-build-execution-proof'), staleDraft.finalAnswer.slice(0, 160));

const reportBody = readFileSync(join(ROOT, 'architecture/CHAT_ROUTING_CONSISTENCY_AND_TRUTH_UNIFICATION_REPORT.md'), 'utf8');
assert('architecture report token', reportBody.includes(CHAT_ROUTING_CONSISTENCY_AND_TRUTH_UNIFICATION_V1_PASS), CHAT_ROUTING_CONSISTENCY_AND_TRUTH_UNIFICATION_V1_PASS);

console.log('\n--- Chat Routing Consistency and Truth Unification Validation ---');
for (const entry of results) {
  console.log(`${entry.passed ? 'PASS' : 'FAIL'} — ${entry.name}: ${entry.detail}`);
}
const failed = results.filter((entry) => !entry.passed);
if (failed.length === 0) {
  console.log(`\n${CHAT_ROUTING_CONSISTENCY_AND_TRUTH_UNIFICATION_V1_PASS}`);
  process.exit(0);
}
console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
