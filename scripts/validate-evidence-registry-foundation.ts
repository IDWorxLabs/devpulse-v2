/**
 * DevPulse V2 Evidence Registry Foundation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 * Local scenarios only — no nested npm run validate:* dependency chain.
 */

import { runDevPulseV2BuildGate } from '../src/foundation/build-gate.js';
import { formatFounderGateReportText } from '../src/foundation/founder-report.js';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import type { BrowserVerificationResult } from '../src/browser-verification/types.js';
import { HARNESS_OWNER_MODULE } from '../src/browser-verification/types.js';
import type { DevPulseV2Answer } from '../src/chat/answer-contract.js';
import { assertSingleAnswerAuthorityRegistered } from '../src/chat/chat-report.js';
import { CHAT_ANSWER_SOURCE, CHAT_OWNER_MODULE } from '../src/chat/types.js';
import {
  DevPulseV2EvidenceRegistryAuthority,
  formatEvidenceRegistryReport,
  fromBrowserVerificationResult,
  fromChatAnswer,
  fromProjectVaultSnapshot,
  fromShellReport,
  fromTrustEngineResult,
  REGISTRY_OWNER_MODULE,
  REGISTRY_PASS_TOKEN,
  resetDevPulseV2EvidenceRegistryAuthorityForTests,
} from '../src/evidence-registry/index.js';
import type { ProjectSnapshot } from '../src/project-vault/types.js';
import { VAULT_OWNER_MODULE } from '../src/project-vault/types.js';
import type { ShellReport } from '../src/shell/types.js';
import type { TrustResult } from '../src/trust-engine/types.js';
import { TRUST_OWNER_MODULE } from '../src/trust-engine/types.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function sampleBrowserResult(): BrowserVerificationResult {
  return {
    verificationId: 'browser-verify-sample',
    startedAt: Date.now(),
    completedAt: Date.now(),
    status: 'PASS',
    checks: [],
    warnings: [],
    errors: [],
    runnerUsed: 'real-browser',
    realBrowserRunnerStatus: 'ATTACHED',
  };
}

function sampleTrustResult(): TrustResult {
  return {
    trustId: 'trust-sample',
    createdAt: Date.now(),
    status: 'PASS',
    trustScore: 95,
    confidence: 'HIGH',
    checks: [],
    evidence: [],
    warnings: [],
    errors: [],
  };
}

function sampleVaultSnapshot(): ProjectSnapshot {
  return {
    snapshotId: 'snapshot-sample',
    projectId: 'project-sample',
    capturedAt: Date.now(),
    name: 'Sample Project',
    status: 'ACTIVE',
    phase: 'foundation',
    summary: 'Sample vault snapshot',
    factCount: 2,
    facts: [],
  };
}

function sampleChatAnswer(): DevPulseV2Answer {
  return {
    answerId: 'answer-sample',
    createdAt: Date.now(),
    source: CHAT_ANSWER_SOURCE,
    visibleAnswerText: 'Sample visible answer text',
    status: 'READY',
    warnings: [],
    errors: [],
  };
}

function sampleShellReport(): ShellReport {
  return {
    startupId: 'shell-sample',
    startupStartedAt: Date.now(),
    status: 'READY',
    shellVisibleAt: Date.now(),
    shellClickableAt: Date.now(),
    visibleMs: 5,
    clickableMs: 10,
    warnings: [],
    errors: [],
    constitutionalTargets: { visibleTargetMs: 800, clickableTargetMs: 2000 },
    visibleTargetMet: true,
    clickableTargetMet: true,
    readinessStatus: 'READY',
    recommendation: 'Shell healthy',
    summary: 'Shell READY | visible=5ms | clickable=10ms | governor=yes',
    governorUsage: {
      tasksScheduled: 3,
      p0Tasks: 1,
      p1Tasks: 2,
      p3Tasks: 0,
      p4Tasks: 0,
      usedTaskGovernor: true,
    },
  };
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Evidence Registry Foundation Validation');
  console.log('======================================================');
  console.log('');

  const buildGate = runDevPulseV2BuildGate({
    phase: 2,
    systems: ['evidence_registry'],
    eagerModuleCount: 3,
    answerAuthorities: ['devpulse_v2_chat_authority'],
    browserVerificationPresent: true,
    buildStage: 'foundation',
  });

  assert(
    '1. Build gate accepts Phase 2 evidence_registry packet',
    buildGate.buildAllowed && buildGate.violationCount === 0,
    buildGate.summary,
  );

  if (!buildGate.buildAllowed) {
    console.log(formatFounderGateReportText(buildGate));
    failAndExit();
  }

  const registry = resetDevPulseV2EvidenceRegistryAuthorityForTests();

  assert(
    '2. Evidence Registry Authority exists',
    registry instanceof DevPulseV2EvidenceRegistryAuthority,
    `ownerModule=${DevPulseV2EvidenceRegistryAuthority.ownerModule}`,
  );

  const owner = getDevPulseV2Owner('evidence_registry');
  assert(
    '3. Ownership registry contains evidence_registry',
    owner.ownerModule === REGISTRY_OWNER_MODULE &&
      DevPulseV2EvidenceRegistryAuthority.assertRegistryOwnership(),
    `registered=${owner.ownerModule}`,
  );

  const emptyState = registry.getRegistryState();
  assert(
    '4. Registry starts empty',
    emptyState.evidenceCount === 0 && emptyState.latestEvidenceId === null,
    `count=${emptyState.evidenceCount}`,
  );

  const added = registry.addEvidence({
    source: 'FOUNDATION_ENFORCEMENT',
    label: 'constitutional_pass',
    summary: 'Sample foundation evidence',
    status: 'PASS',
    relatedSystemId: 'foundation_enforcement',
    tags: ['foundation'],
    warnings: [],
    errors: [],
  });

  assert(
    '5. addEvidence works',
    added.evidenceId.length > 0 && added.source === 'FOUNDATION_ENFORCEMENT',
    added.evidenceId,
  );

  const fetched = registry.getEvidence(added.evidenceId);
  assert(
    '6. getEvidence works',
    fetched !== null && fetched.label === 'constitutional_pass',
    fetched?.label ?? 'missing',
  );

  assert(
    '7. listEvidence works',
    registry.listEvidence().length === 1,
    `count=${registry.listEvidence().length}`,
  );

  assert(
    '8. listEvidenceBySource works',
    registry.listEvidenceBySource('FOUNDATION_ENFORCEMENT').length === 1,
    `count=${registry.listEvidenceBySource('FOUNDATION_ENFORCEMENT').length}`,
  );

  assert(
    '9. listEvidenceBySystem works',
    registry.listEvidenceBySystem('foundation_enforcement').length === 1,
    `count=${registry.listEvidenceBySystem('foundation_enforcement').length}`,
  );

  const snapshot = registry.createEvidenceSnapshot();
  assert(
    '10. createEvidenceSnapshot works',
    snapshot.evidenceCount === 1 && snapshot.records.length === 1,
    snapshot.snapshotId,
  );

  const state = registry.getRegistryState();
  assert(
    '11. getRegistryState works',
    state.evidenceCount === 1 && state.snapshotCount === 1,
    `evidence=${state.evidenceCount} snapshots=${state.snapshotCount}`,
  );

  const browserEvidence = registry.addEvidence(fromBrowserVerificationResult(sampleBrowserResult()));
  assert(
    '12. Browser verification result can be stored as evidence',
    browserEvidence.source === 'BROWSER_VERIFICATION' &&
      browserEvidence.relatedSystemId === 'browser_verification_harness',
    browserEvidence.label,
  );

  const trustEvidence = registry.addEvidence(fromTrustEngineResult(sampleTrustResult()));
  assert(
    '13. Trust Engine result can be stored as evidence',
    trustEvidence.source === 'TRUST_ENGINE' && trustEvidence.relatedRecordId === 'trust-sample',
    trustEvidence.summary,
  );

  const vaultEvidence = registry.addEvidence(fromProjectVaultSnapshot(sampleVaultSnapshot()));
  assert(
    '14. Project Vault snapshot can be stored as evidence',
    vaultEvidence.source === 'PROJECT_VAULT' && vaultEvidence.status === 'INFO',
    vaultEvidence.label,
  );

  const chatEvidence = registry.addEvidence(fromChatAnswer(sampleChatAnswer()));
  assert(
    '15. Chat answer can be stored as evidence',
    chatEvidence.source === 'CHAT_AUTHORITY' && chatEvidence.status === 'PASS',
    chatEvidence.label,
  );

  const shellEvidence = registry.addEvidence(fromShellReport(sampleShellReport()));
  assert(
    '16. Shell report can be stored as evidence',
    shellEvidence.source === 'SHELL_AUTHORITY' && shellEvidence.status === 'PASS',
    shellEvidence.label,
  );

  assert(
    '17. Evidence Registry does not calculate trust',
    typeof (registry as { evaluateTrust?: unknown }).evaluateTrust === 'undefined' &&
      typeof (registry as { calculateTrustScore?: unknown }).calculateTrustScore === 'undefined',
    'no trust scoring on registry',
  );

  const answerOwners = listDevPulseV2Owners().filter(
    (o) => o.domain === 'chat_authority' || o.domain === 'chat_answer_authority',
  );
  assert(
    '18. Evidence Registry does not become answer authority',
    !answerOwners.some((o) => o.ownerModule === REGISTRY_OWNER_MODULE),
    `registry=${REGISTRY_OWNER_MODULE}`,
  );

  assert(
    '19. Evidence Registry does not replace Trust Engine',
    DevPulseV2EvidenceRegistryAuthority.assertDoesNotReplaceTrustEngine() &&
      getDevPulseV2Owner('trust_engine').ownerModule === TRUST_OWNER_MODULE,
    `trust=${TRUST_OWNER_MODULE}`,
  );

  assert(
    '20. Evidence Registry does not replace Project Vault',
    DevPulseV2EvidenceRegistryAuthority.assertDoesNotReplaceProjectVault() &&
      getDevPulseV2Owner('project_vault').ownerModule === VAULT_OWNER_MODULE,
    `vault=${VAULT_OWNER_MODULE}`,
  );

  const reportText = formatEvidenceRegistryReport(state, fetched);
  assert(
    '20b. Evidence report generated',
    reportText.includes('Evidence Registry Report') &&
      registry.formatReport().includes('Recommendation:'),
    `evidence=${registry.getRegistryState().evidenceCount}`,
  );

  assert(
    '21. Project Vault ownership unchanged (local boundary check)',
    getDevPulseV2Owner('project_vault').ownerModule === VAULT_OWNER_MODULE,
    `vault=${VAULT_OWNER_MODULE}`,
  );

  assert(
    '22. Trust Engine ownership unchanged (local boundary check)',
    getDevPulseV2Owner('trust_engine').ownerModule === TRUST_OWNER_MODULE,
    `trust=${TRUST_OWNER_MODULE}`,
  );

  assert(
    '23. Browser harness ownership unchanged (local boundary check)',
    getDevPulseV2Owner('browser_verification_harness').ownerModule === HARNESS_OWNER_MODULE,
    `harness=${HARNESS_OWNER_MODULE}`,
  );

  assert(
    '24. Chat Authority ownership unchanged (local boundary check)',
    getDevPulseV2Owner('chat_authority').ownerModule === CHAT_OWNER_MODULE &&
      getDevPulseV2Owner('chat_answer_authority').ownerModule === CHAT_OWNER_MODULE,
    `chat=${CHAT_OWNER_MODULE}`,
  );

  assert(
    '25. Foundation Enforcement ownership present (local boundary check)',
    getDevPulseV2Owner('law_enforcement').ownerModule === 'devpulse_v2_foundation_enforcement',
    'law_enforcement registered',
  );

  assert(
    '26. No duplicate answer authority exists',
    assertSingleAnswerAuthorityRegistered() &&
      new Set(answerOwners.map((o) => o.ownerModule)).size === 1 &&
      answerOwners[0]?.ownerModule === CHAT_OWNER_MODULE,
    `owner=${CHAT_OWNER_MODULE}`,
  );

  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? '✓' : '✗';
    console.log(`${icon} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
    if (!r.passed) allPassed = false;
  }

  if (allPassed) {
    console.log('======================================================');
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(REGISTRY_PASS_TOKEN);
    console.log('');
    process.exit(0);
  }

  failAndExit();
}

function failAndExit(): never {
  console.error('EVIDENCE REGISTRY FOUNDATION VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
