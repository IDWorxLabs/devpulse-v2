/**
 * DevPulse V2 Central Brain Foundation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { runDevPulseV2BuildGate } from '../src/foundation/build-gate.js';
import { formatFounderGateReportText } from '../src/foundation/founder-report.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { assertSingleAnswerAuthorityRegistered } from '../src/chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../src/chat/types.js';
import {
  buildBrainCoordinationSummary,
  CENTRAL_BRAIN_OWNER_MODULE,
  CENTRAL_BRAIN_PASS_TOKEN,
  DevPulseV2CentralBrainAuthority,
  formatCentralBrainReport,
  resetDevPulseV2CentralBrainAuthorityForTests,
} from '../src/central-brain/index.js';
import {
  resetDevPulseV2EvidenceRegistryAuthorityForTests,
} from '../src/evidence-registry/index.js';
import { REGISTRY_OWNER_MODULE } from '../src/evidence-registry/types.js';
import {
  resetDevPulseV2ProjectVaultAuthorityForTests,
} from '../src/project-vault/index.js';
import { VAULT_OWNER_MODULE } from '../src/project-vault/types.js';
import {
  resetDevPulseV2Phase1StabilitySoakAuthorityForTests,
} from '../src/stability-soak/index.js';
import {
  resetDevPulseV2TimelineLedgerAuthorityForTests,
} from '../src/timeline-ledger/index.js';
import { LEDGER_OWNER_MODULE } from '../src/timeline-ledger/types.js';
import {
  resetDevPulseV2TrustEngineAuthorityForTests,
} from '../src/trust-engine/index.js';
import { TRUST_OWNER_MODULE } from '../src/trust-engine/types.js';
import { DevPulseV2ValidationBudgetPolicyAuthority } from '../src/validation-budget/validation-budget-policy-authority.js';
import { POLICY_OWNER_MODULE } from '../src/validation-budget/types.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Central Brain Foundation Validation');
  console.log('==================================================');
  console.log('');

  const buildGate = runDevPulseV2BuildGate({
    phase: 3,
    systems: ['central_brain'],
    eagerModuleCount: 3,
    answerAuthorities: ['devpulse_v2_chat_authority'],
    browserVerificationPresent: true,
    buildStage: 'foundation',
  });

  assert(
    '1. Build gate accepts central_brain packet',
    buildGate.buildAllowed && buildGate.violationCount === 0,
    buildGate.summary,
  );

  if (!buildGate.buildAllowed) {
    console.log(formatFounderGateReportText(buildGate));
    failAndExit();
  }

  await resetDevPulseV2Phase1StabilitySoakAuthorityForTests().runSoak(3);

  const brain = resetDevPulseV2CentralBrainAuthorityForTests();

  assert(
    '2. Central Brain Authority exists',
    brain instanceof DevPulseV2CentralBrainAuthority,
    `ownerModule=${DevPulseV2CentralBrainAuthority.ownerModule}`,
  );

  const owner = getDevPulseV2Owner('central_brain');
  assert(
    '3. Ownership registry contains central_brain',
    owner.ownerModule === CENTRAL_BRAIN_OWNER_MODULE &&
      DevPulseV2CentralBrainAuthority.assertRegistryOwnership(),
    `registered=${owner.ownerModule}`,
  );

  const emptyState = brain.getBrainState();
  assert(
    '4. Brain starts empty',
    emptyState.systems.length === 0,
    `systems=${emptyState.systems.length}`,
  );

  const trustEngine = resetDevPulseV2TrustEngineAuthorityForTests();
  await trustEngine.evaluateTrust();
  const trustSummary = brain.getSystemSummary('trust_engine');
  assert(
    '5. Trust Engine summary can be collected',
    trustSummary !== null &&
      trustSummary.systemId === 'trust_engine' &&
      trustSummary.owner === TRUST_OWNER_MODULE,
    trustSummary?.summary ?? 'missing',
  );

  const vault = resetDevPulseV2ProjectVaultAuthorityForTests();
  vault.createProject('DevPulse V2', 'Central Brain test project');
  const vaultSummary = brain.getSystemSummary('project_vault');
  assert(
    '6. Project Vault summary can be collected',
    vaultSummary !== null &&
      vaultSummary.systemId === 'project_vault' &&
      vaultSummary.owner === VAULT_OWNER_MODULE,
    vaultSummary?.summary ?? 'missing',
  );

  const registry = resetDevPulseV2EvidenceRegistryAuthorityForTests();
  registry.addEvidence({
    source: 'FOUNDATION_ENFORCEMENT',
    label: 'Central Brain test evidence',
    summary: 'Evidence for awareness read',
    status: 'PASS',
    tags: ['central-brain-test'],
    warnings: [],
    errors: [],
  });
  const evidenceSummary = brain.getSystemSummary('evidence_registry');
  assert(
    '7. Evidence Registry summary can be collected',
    evidenceSummary !== null &&
      evidenceSummary.systemId === 'evidence_registry' &&
      evidenceSummary.owner === REGISTRY_OWNER_MODULE,
    evidenceSummary?.summary ?? 'missing',
  );

  const ledger = resetDevPulseV2TimelineLedgerAuthorityForTests();
  ledger.addEvent({
    source: 'FOUNDATION',
    category: 'SYSTEM',
    title: 'Central Brain awareness test',
    summary: 'Timeline event for brain read',
    relatedEvidenceIds: [],
    status: 'PASS',
    warnings: [],
    errors: [],
  });
  const timelineSummary = brain.getSystemSummary('timeline_event_ledger');
  assert(
    '8. Timeline Ledger summary can be collected',
    timelineSummary !== null &&
      timelineSummary.systemId === 'timeline_event_ledger' &&
      timelineSummary.owner === LEDGER_OWNER_MODULE,
    timelineSummary?.summary ?? 'missing',
  );

  const allSummaries = brain.collectSystemSummaries();
  assert(
    '9. collectSystemSummaries works',
    allSummaries.length === 4,
    `count=${allSummaries.length}`,
  );

  const oneSummary = brain.getSystemSummary('trust_engine');
  assert(
    '10. getSystemSummary works',
    oneSummary !== null && oneSummary.systemId === 'trust_engine',
    oneSummary?.status ?? 'missing',
  );

  const brainState = brain.getBrainState();
  assert(
    '11. getBrainState works',
    brainState.systems.length >= 4 && brainState.brainId.length > 0,
    `systems=${brainState.systems.length}`,
  );

  const coordination = buildBrainCoordinationSummary(brainState.systems);
  assert(
    '12. Coordination summary generated',
    coordination.totalSystems === 4 &&
      coordination.readySystems + coordination.warningSystems + coordination.failedSystems <= 4,
    `overall=${coordination.overallStatus}`,
  );

  const reportText = formatCentralBrainReport(brainState);
  assert(
    '13. Report generated',
    reportText.includes('Central Brain Report') &&
      brain.formatReport().includes('Recommendation:'),
    `systems=${brainState.systems.length}`,
  );

  assert(
    '14. Central Brain does not become answer authority',
    DevPulseV2CentralBrainAuthority.assertDoesNotBecomeAnswerAuthority() &&
      getDevPulseV2Owner('chat_authority').ownerModule === CHAT_OWNER_MODULE &&
      assertSingleAnswerAuthorityRegistered(),
    `brain=${CENTRAL_BRAIN_OWNER_MODULE}`,
  );

  assert(
    '15. Central Brain does not calculate trust',
    DevPulseV2CentralBrainAuthority.assertDoesNotCalculateTrust() &&
      typeof (brain as { evaluateTrust?: unknown }).evaluateTrust === 'undefined' &&
      typeof (brain as { calculateTrustScore?: unknown }).calculateTrustScore === 'undefined',
    'read-only trust observation',
  );

  assert(
    '16. Central Brain does not execute actions',
    DevPulseV2CentralBrainAuthority.assertDoesNotExecuteActions(),
    'no execute methods',
  );

  assert(
    '17. Central Brain does not replace other authorities',
    DevPulseV2CentralBrainAuthority.assertDoesNotReplaceOtherAuthorities(),
    `trust=${TRUST_OWNER_MODULE}`,
  );

  assert(
    '18. Validation Budget Policy still passes',
    DevPulseV2CentralBrainAuthority.assertValidationBudgetCompatible() &&
      DevPulseV2ValidationBudgetPolicyAuthority.assertRegistryOwnership() &&
      getDevPulseV2Owner('validation_budget_policy').ownerModule === POLICY_OWNER_MODULE,
    `policy=${POLICY_OWNER_MODULE}`,
  );

  let typecheckOk = false;
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), encoding: 'utf8', stdio: 'pipe' });
    typecheckOk = true;
  } catch {
    typecheckOk = false;
  }
  assert('19. Typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? '✓' : '✗';
    console.log(`${icon} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
    if (!r.passed) allPassed = false;
  }

  if (allPassed) {
    console.log('==================================================');
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(CENTRAL_BRAIN_PASS_TOKEN);
    console.log('');
    process.exit(0);
  }

  failAndExit();
}

function failAndExit(): never {
  console.error('CENTRAL BRAIN FOUNDATION VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
