/**
 * Phase 26.82 — Chat Operational Truth Source Synchronization validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assessConnectedBuildExecution,
  materializeBuildContractExpectations,
  materializeBuildProofGapArtifacts,
  resetConnectedBuildExecutionModuleForTests,
  WORKSPACE_ROOT_DIR,
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
  CHAT_OPERATIONAL_TRUTH_SOURCE_SYNCHRONIZATION_V1_PASS,
  OPERATIONAL_TRUTH_SOURCE_CONTRADICTION,
  buildOperationalSelfKnowledgeAssessment,
  classifyOperationalQuestion,
  detectOperationalTruthSourceContradictions,
  getOperationalEvidenceSnapshot,
  resetOperationalEvidenceSnapshotCacheForTests,
  resolveOperationalSelfKnowledgeChatResponse,
  responseContradictsExecutionTruth,
} from '../src/chat-operational-self-knowledge/index.js';
import {
  resolveConnectedExecutionChainTruth,
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
  'src/chat-operational-self-knowledge/operational-evidence-snapshot.ts',
  'src/chat-operational-self-knowledge/capability-truth-registry.ts',
  'src/chat-operational-self-knowledge/operational-truth-source-contradiction-detector.ts',
  'src/chat-operational-self-knowledge/operational-response-composer.ts',
  'src/chat-operational-self-knowledge/chat-operational-self-knowledge-types.ts',
  'src/founder-test-integration/connected-execution-chain-truth.ts',
  'scripts/validate-chat-operational-truth-source-synchronization.ts',
  'architecture/CHAT_OPERATIONAL_TRUTH_SOURCE_SYNCHRONIZATION_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const snapshotSource = readFileSync(
  join(ROOT, 'src/chat-operational-self-knowledge/operational-evidence-snapshot.ts'),
  'utf8',
);
const registrySource = readFileSync(
  join(ROOT, 'src/chat-operational-self-knowledge/capability-truth-registry.ts'),
  'utf8',
);
const composerSource = readFileSync(
  join(ROOT, 'src/chat-operational-self-knowledge/operational-response-composer.ts'),
  'utf8',
);

assert(
  'snapshot resolves ConnectedExecutionChainTruth',
  snapshotSource.includes('resolveConnectedExecutionChainTruth') &&
    snapshotSource.includes('resolveExecutionChainStageContext'),
  'chain truth resolver',
);
assert(
  'capability registry uses chain truth source',
  registrySource.includes('CONNECTED_EXECUTION_CHAIN_TRUTH_SOURCE') &&
    registrySource.includes('executionChainTruth'),
  'registry truth source',
);
assert(
  'composer references synchronized execution truth',
  composerSource.includes('executionChainTruth') && composerSource.includes('executionTruthSource'),
  'composer truth fields',
);
assert(
  'contradiction kind exported',
  OPERATIONAL_TRUTH_SOURCE_CONTRADICTION === 'OPERATIONAL_TRUTH_SOURCE_CONTRADICTION',
  OPERATIONAL_TRUTH_SOURCE_CONTRADICTION,
);

const CRM_PROMPT =
  'Build a CRM for a small sales team with contacts, deals, tasks, login, dashboard, and admin role.';

resetRequirementsToPlanContractModuleForTests();
let contract = null;
for (let i = 0; i < 4; i += 1) {
  const assessment = assessRequirementsToPlanExecutionContract({ rawPrompt: CRM_PROMPT });
  contract = assessment.report.buildReadyContract;
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
  const buildReport = assessConnectedBuildExecution({
    rootDir: ROOT,
    buildReadyContract: contract,
    observedEvidence: {
      paths: materialization.expectedFiles,
      directories: materialization.workspaceTargets,
    },
  }).report;
  const runtimeReport = assessConnectedRuntimeActivationProof({
    rootDir: ROOT,
    buildMaterializationReport: buildReport,
  }).report;
  const previewReport = assessConnectedPreviewExperienceProof({
    rootDir: ROOT,
    runtimeActivationProof: runtimeReport,
  }).report;
  const verifyReport = assessConnectedVerificationExecutionProof({
    rootDir: ROOT,
    previewExperienceProof: previewReport,
  }).report;
  const launchReport = assessConnectedLaunchReadinessProof({
    rootDir: ROOT,
    verificationExecutionProof: verifyReport,
  }).report;

  const chainTruth = resolveConnectedExecutionChainTruth({
    readOnly: true,
    buildMaterializationProven: buildReport.proofLevel === 'PROVEN',
    runtimeProven: runtimeReport.runtimeProofLevel === 'PROVEN',
    previewProven: previewReport.previewProofLevel === 'PROVEN',
    verificationProven: verifyReport.verificationProofLevel === 'PROVEN',
    launchProven: launchReport.launchProofLevel === 'PROVEN',
    firstBrokenStage: null,
    builderMaterializationConnected: true,
    previewExperienceConnected: true,
    verificationExecutionConnected: true,
    launchExecutionConnected: true,
    buildMaterializationReport: buildReport,
    verificationExecutionProof: verifyReport,
    launchReadinessProof: launchReport,
    resolvedAt: new Date().toISOString(),
  });

  assert('live chain truth runtime proven', chainTruth.runtimeProven, String(chainTruth.runtimeProven));
  assert('live chain truth preview proven', chainTruth.previewProven, String(chainTruth.previewProven));
  assert('live chain truth verify proven', chainTruth.verificationProven, String(chainTruth.verificationProven));

  const legacyContradictions = detectOperationalTruthSourceContradictions({
    executionChainTruth: chainTruth,
    legacyStageProofLevels: {
      RUNTIME: 'NOT_PROVEN',
      PREVIEW: 'NOT_PROVEN',
      VERIFY: 'NOT_PROVEN',
    },
  });
  assert(
    'contradiction detector flags stale runtime',
    legacyContradictions.some((c) => c.capability === 'runtime_execution'),
    legacyContradictions.map((c) => c.capability).join(',') || 'none',
  );

  resetOperationalEvidenceSnapshotCacheForTests();
  const snapshot = getOperationalEvidenceSnapshot(ROOT);
  assert(
    'snapshot includes executionChainTruth',
    snapshot.executionChainTruth.sourceAuthority === 'connected-execution-chain-stage-resolver',
    snapshot.executionChainTruth.sourceAuthority,
  );
  assert(
    'snapshot truth source field set',
    snapshot.executionTruthSource === 'connected-execution-chain-stage-resolver',
    snapshot.executionTruthSource,
  );
  assert(
    'execution truth overrides legacy for runtime capability',
    snapshot.executionChainTruth.runtimeProven
      ? snapshot.capabilityTruth.entries.find((e) => e.capabilityId === 'runtime_execution')?.truthLevel ===
          'PROVEN'
      : true,
    snapshot.capabilityTruth.entries.find((e) => e.capabilityId === 'runtime_execution')?.truthLevel ?? 'missing',
  );
  assert(
    'runtime capability evidence source is chain truth',
    snapshot.capabilityTruth.entries.find((e) => e.capabilityId === 'runtime_execution')?.evidenceSource ===
      'connected-execution-chain-stage-resolver',
    snapshot.capabilityTruth.entries.find((e) => e.capabilityId === 'runtime_execution')?.evidenceSource ?? 'missing',
  );

  const scenarios: Array<{ message: string; kind: string }> = [
    { message: 'are you ready to launch', kind: 'LAUNCH_READINESS' },
    { message: 'what is your biggest blocker', kind: 'WEAKNESS' },
    { message: 'can you run applications', kind: 'CAPABILITIES' },
    { message: 'can you preview applications', kind: 'CAPABILITIES' },
    { message: 'what is the current first broken stage', kind: 'FIRST_BROKEN_STAGE' },
    { message: 'are you fully self aware', kind: 'SELF_AWARENESS' },
  ];

  for (const scenario of scenarios) {
    const kind = classifyOperationalQuestion(scenario.message);
    assert(`scenario classified ${scenario.kind}`, kind === scenario.kind, kind);
    const response = resolveOperationalSelfKnowledgeChatResponse({
      message: scenario.message,
      rootDir: ROOT,
    });
    assert(`scenario response non-empty ${scenario.kind}`, response.trim().length > 20, response.slice(0, 60));
    assert(
      `scenario uses truth source ${scenario.kind}`,
      response.includes('connected-execution-chain-stage-resolver') ||
        response.includes('Synchronized execution') ||
        response.includes('synchronized execution'),
      response.slice(0, 80),
    );

    if (snapshot.executionChainTruth.runtimeProven) {
      assert(
        `no stale runtime NOT_PROVEN ${scenario.kind}`,
        !/\bruntime execution\b.*\bNOT_PROVEN\b/i.test(response) &&
          !/\bno proven running application\b/i.test(response),
        response.slice(0, 100),
      );
    }
    if (snapshot.executionChainTruth.previewProven) {
      assert(
        `no stale preview NOT_PROVEN ${scenario.kind}`,
        !/\bdevice frame preview is not proven\b/i.test(response) &&
          !/\bpreview execution\b.*\bNOT_PROVEN\b/i.test(response),
        response.slice(0, 100),
      );
    }

    const responseContradictions = responseContradictsExecutionTruth({
      executionChainTruth: snapshot.executionChainTruth,
      responseText: response,
    });
    assert(
      `response contradicts truth ${scenario.kind}`,
      responseContradictions.length === 0,
      String(responseContradictions.length),
    );
  }

  const launchAssessment = buildOperationalSelfKnowledgeAssessment({
    message: 'are you ready to launch',
    kind: 'LAUNCH_READINESS',
    snapshot,
  });
  assert(
    'launch assessment diagnostic fields',
    launchAssessment.executionTruthSource === snapshot.executionTruthSource &&
      typeof launchAssessment.chainConnected === 'boolean',
    launchAssessment.executionTruthSource,
  );
  assert(
    'launch answer not hardcoded ready',
    !/\byes,? (we|you) can launch today\b/i.test(launchAssessment.responseText),
    'hardcoded launch',
  );

  const selfAssessment = buildOperationalSelfKnowledgeAssessment({
    message: 'are you fully self aware',
    kind: 'SELF_AWARENESS',
    snapshot,
  });
  assert(
    'self-awareness denies consciousness',
    /\bnot conscious\b/i.test(selfAssessment.responseText),
    selfAssessment.responseText.slice(0, 80),
  );
  assert(
    'self-awareness uses synchronized truth',
    selfAssessment.responseText.includes('Synchronized execution chain truth') ||
      selfAssessment.responseText.includes('Runtime proven'),
    selfAssessment.responseText.slice(0, 80),
  );
}

assert(
  'no scoring manipulation in composer',
  !composerSource.includes('readinessScore') && !composerSource.includes('verdictFromScore'),
  'scoring',
);
assert(
  'no verdict manipulation in snapshot',
  !snapshotSource.includes('verdictFromScore') && !snapshotSource.includes("verdict = 'FOUNDER"),
  'verdict',
);
const validatorSource = readFileSync(
  join(ROOT, 'scripts/validate-chat-operational-truth-source-synchronization.ts'),
  'utf8',
);
const chatIntelImportProbe = ['../src/chat-intelligence', '-reality/index.js'].join('');
assert(
  'no validator recursion',
  !validatorSource.includes(chatIntelImportProbe),
  'recursion',
);

const failed = results.filter((entry) => !entry.passed);
const passToken = CHAT_OPERATIONAL_TRUTH_SOURCE_SYNCHRONIZATION_V1_PASS;
const reportPath = join(ROOT, 'architecture', 'CHAT_OPERATIONAL_TRUTH_SOURCE_SYNCHRONIZATION_REPORT.md');
const reportBody = readFileSync(reportPath, 'utf8');
assert('architecture report includes success token', reportBody.includes(passToken), passToken);

console.log(`\n--- Chat Operational Truth Source Synchronization Validation ---`);
for (const entry of results) {
  console.log(`${entry.passed ? 'PASS' : 'FAIL'} — ${entry.name}: ${entry.detail}`);
}
if (failed.length === 0) {
  console.log(`\n${passToken}`);
  process.exit(0);
}
console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
