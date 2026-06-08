/**
 * DevPulse V2 Project Vault Foundation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { runDevPulseV2BuildGate } from '../src/foundation/build-gate.js';
import { formatFounderGateReportText } from '../src/foundation/founder-report.js';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import { HARNESS_OWNER_MODULE } from '../src/browser-verification/types.js';
import { assertSingleAnswerAuthorityRegistered } from '../src/chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../src/chat/types.js';
import {
  DevPulseV2ProjectVaultAuthority,
  formatProjectVaultReport,
  resetDevPulseV2ProjectVaultAuthorityForTests,
  VAULT_OWNER_MODULE,
  VAULT_PASS_TOKEN,
} from '../src/project-vault/index.js';
import {
  resetDevPulseV2Phase1StabilitySoakAuthorityForTests,
} from '../src/stability-soak/index.js';
import {
  resetDevPulseV2TrustEngineAuthorityForTests,
  TRUST_OWNER_MODULE,
} from '../src/trust-engine/index.js';

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
  console.log('DevPulse V2 — Project Vault Foundation Validation');
  console.log('==================================================');
  console.log('');

  const buildGate = runDevPulseV2BuildGate({
    phase: 2,
    systems: ['project_vault'],
    eagerModuleCount: 3,
    answerAuthorities: ['devpulse_v2_chat_authority'],
    browserVerificationPresent: true,
    buildStage: 'foundation',
  });

  assert(
    '1. Build gate accepts Phase 2 project_vault packet',
    buildGate.buildAllowed && buildGate.violationCount === 0,
    buildGate.summary,
  );

  if (!buildGate.buildAllowed) {
    console.log(formatFounderGateReportText(buildGate));
    failAndExit();
  }

  const vault = resetDevPulseV2ProjectVaultAuthorityForTests();

  assert(
    '2. Project Vault Authority exists',
    vault instanceof DevPulseV2ProjectVaultAuthority,
    `ownerModule=${DevPulseV2ProjectVaultAuthority.ownerModule}`,
  );

  const owner = getDevPulseV2Owner('project_vault');
  assert(
    '3. Ownership registry contains project_vault',
    owner.ownerModule === VAULT_OWNER_MODULE &&
      DevPulseV2ProjectVaultAuthority.assertRegistryOwnership(),
    `registered=${owner.ownerModule}`,
  );

  const emptyState = vault.getVaultState();
  assert(
    '4. Vault starts empty',
    emptyState.projectCount === 0 &&
      emptyState.factCount === 0 &&
      emptyState.latestProjectId === null,
    `projects=${emptyState.projectCount}`,
  );

  const created = vault.createProject('DevPulse V2', 'Foundation project memory');
  assert(
    '5. createProject works',
    created.projectId.length > 0 &&
      created.name === 'DevPulse V2' &&
      created.status === 'ACTIVE',
    `id=${created.projectId}`,
  );

  const fetched = vault.getProject(created.projectId);
  assert(
    '6. getProject works',
    fetched !== null && fetched.projectId === created.projectId,
    fetched?.name ?? 'missing',
  );

  const listed = vault.listProjects();
  assert(
    '7. listProjects works',
    listed.length === 1 && listed[0]?.projectId === created.projectId,
    `count=${listed.length}`,
  );

  const userFact = vault.addProjectFact(created.projectId, {
    source: 'USER',
    label: 'goal',
    value: 'Prove Phase 2 project memory foundation',
    confidence: 'HIGH',
  });
  assert(
    '8. addProjectFact works',
    userFact !== null &&
      userFact.source === 'USER' &&
      vault.getProject(created.projectId)?.facts.length === 1,
    userFact?.label ?? 'missing',
  );

  const snapshot = vault.createProjectSnapshot(created.projectId);
  assert(
    '9. createProjectSnapshot works',
    snapshot !== null &&
      snapshot.projectId === created.projectId &&
      snapshot.factCount === 1,
    snapshot?.snapshotId ?? 'missing',
  );

  const vaultState = vault.getVaultState();
  assert(
    '10. getVaultState works',
    vaultState.projectCount === 1 &&
      vaultState.activeProjectCount === 1 &&
      vaultState.factCount === 1 &&
      vaultState.snapshotCount === 1,
    `projects=${vaultState.projectCount} facts=${vaultState.factCount}`,
  );

  await resetDevPulseV2Phase1StabilitySoakAuthorityForTests().runSoak(3);
  const trustEngine = resetDevPulseV2TrustEngineAuthorityForTests();
  const trustResult = await trustEngine.evaluateTrust();
  const trustFacts = vault.storeTrustEngineSummaryFacts(created.projectId, trustResult);

  assert(
    '11. Trust Engine summary fact can be stored',
    trustFacts.length >= 3 &&
      trustFacts.every((f) => f.source === 'TRUST_ENGINE') &&
      vault.getProject(created.projectId)!.facts.some((f) => f.label === 'trust_score'),
    `stored=${trustFacts.length} score=${trustResult.trustScore}`,
  );

  const vaultProto = Object.getPrototypeOf(vault) as Record<string, unknown>;
  assert(
    '12. Project Vault does not calculate trust',
    typeof (vault as { evaluateTrust?: unknown }).evaluateTrust === 'undefined' &&
      typeof (vault as { calculateTrustScore?: unknown }).calculateTrustScore === 'undefined' &&
      !('runFoundationTrustChecks' in vaultProto),
    'no trust calculation methods on vault',
  );

  const answerOwners = listDevPulseV2Owners().filter(
    (o) => o.domain === 'chat_authority' || o.domain === 'chat_answer_authority',
  );
  assert(
    '13. Project Vault does not become answer authority',
    assertSingleAnswerAuthorityRegistered() &&
      !answerOwners.some((o) => o.ownerModule === VAULT_OWNER_MODULE) &&
      answerOwners.every((o) => o.ownerModule === CHAT_OWNER_MODULE),
    `vault=${VAULT_OWNER_MODULE}`,
  );

  assert(
    '14. Project Vault does not replace Trust Engine',
    DevPulseV2ProjectVaultAuthority.assertDoesNotReplaceTrustEngine() &&
      getDevPulseV2Owner('trust_engine').ownerModule === TRUST_OWNER_MODULE,
    `trust=${TRUST_OWNER_MODULE}`,
  );

  const reportText = formatProjectVaultReport(
    vault.getVaultState(),
    vault.getProject(created.projectId),
  );
  assert(
    '14b. Vault report generated',
    reportText.includes('Project Vault Report') &&
      reportText.includes(VAULT_OWNER_MODULE) &&
      vault.formatReport().includes('Recommendation:'),
    `facts=${vaultState.factCount}`,
  );

  assert(
    '15. Trust Engine ownership unchanged (local boundary check)',
    DevPulseV2ProjectVaultAuthority.assertDoesNotReplaceTrustEngine() &&
      getDevPulseV2Owner('trust_engine').ownerModule === TRUST_OWNER_MODULE,
    `trust=${TRUST_OWNER_MODULE}`,
  );

  assert(
    '16. Browser harness ownership unchanged (local boundary check)',
    getDevPulseV2Owner('browser_verification_harness').ownerModule === HARNESS_OWNER_MODULE,
    `harness=${HARNESS_OWNER_MODULE}`,
  );

  assert(
    '17. Chat Authority ownership unchanged (local boundary check)',
    getDevPulseV2Owner('chat_authority').ownerModule === CHAT_OWNER_MODULE,
    `chat=${CHAT_OWNER_MODULE}`,
  );

  assert(
    '18. Foundation Enforcement ownership present (local boundary check)',
    getDevPulseV2Owner('law_enforcement').ownerModule === 'devpulse_v2_foundation_enforcement',
    'law_enforcement registered',
  );

  assert(
    '19. No duplicate answer authority exists',
    assertSingleAnswerAuthorityRegistered() &&
      new Set(answerOwners.map((o) => o.ownerModule)).size === 1,
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
    console.log('==================================================');
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(VAULT_PASS_TOKEN);
    console.log('');
    process.exit(0);
  }

  failAndExit();
}

function failAndExit(): never {
  console.error('PROJECT VAULT FOUNDATION VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
