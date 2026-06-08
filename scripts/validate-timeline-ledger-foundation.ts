/**
 * DevPulse V2 Timeline Ledger Foundation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { runDevPulseV2BuildGate } from '../src/foundation/build-gate.js';
import { formatFounderGateReportText } from '../src/foundation/founder-report.js';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import { assertSingleAnswerAuthorityRegistered } from '../src/chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../src/chat/types.js';
import { REGISTRY_OWNER_MODULE } from '../src/evidence-registry/types.js';
import { VAULT_OWNER_MODULE } from '../src/project-vault/types.js';
import {
  DevPulseV2TimelineLedgerAuthority,
  formatTimelineLedgerReport,
  LEDGER_OWNER_MODULE,
  LEDGER_PASS_TOKEN,
  recordEvidenceEvent,
  recordProjectEvent,
  recordProjectSnapshotEvent,
  resetDevPulseV2TimelineLedgerAuthorityForTests,
} from '../src/timeline-ledger/index.js';
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
  console.log('DevPulse V2 — Timeline Ledger Foundation Validation');
  console.log('=====================================================');
  console.log('');

  const buildGate = runDevPulseV2BuildGate({
    phase: 2,
    systems: ['timeline_event_ledger'],
    eagerModuleCount: 2,
    answerAuthorities: ['devpulse_v2_chat_authority'],
    browserVerificationPresent: true,
    buildStage: 'foundation',
  });

  assert(
    '1. Build gate accepts timeline_event_ledger packet',
    buildGate.buildAllowed && buildGate.violationCount === 0,
    buildGate.summary,
  );

  if (!buildGate.buildAllowed) {
    console.log(formatFounderGateReportText(buildGate));
    failAndExit();
  }

  const ledger = resetDevPulseV2TimelineLedgerAuthorityForTests();

  assert(
    '2. Timeline Ledger Authority exists',
    ledger instanceof DevPulseV2TimelineLedgerAuthority,
    `ownerModule=${DevPulseV2TimelineLedgerAuthority.ownerModule}`,
  );

  const owner = getDevPulseV2Owner('timeline_event_ledger');
  assert(
    '3. Ownership registry contains timeline_event_ledger',
    owner.ownerModule === LEDGER_OWNER_MODULE &&
      DevPulseV2TimelineLedgerAuthority.assertRegistryOwnership(),
    `registered=${owner.ownerModule}`,
  );

  const emptyState = ledger.getLedgerState();
  assert(
    '4. Ledger starts empty',
    emptyState.eventCount === 0 && emptyState.snapshotCount === 0,
    `events=${emptyState.eventCount}`,
  );

  const first = ledger.addEvent({
    source: 'FOUNDATION',
    category: 'SYSTEM',
    title: 'Foundation check recorded',
    summary: 'Initial timeline event',
    relatedEvidenceIds: [],
    status: 'PASS',
    warnings: [],
    errors: [],
    createdAt: 1000,
  });

  const second = ledger.addEvent({
    source: 'CHAT',
    category: 'USER',
    title: 'User message submitted',
    summary: 'Chat turn recorded',
    relatedEvidenceIds: [],
    status: 'INFO',
    warnings: [],
    errors: [],
    createdAt: 2000,
  });

  assert(
    '5. addEvent works',
    first.eventId.length > 0 && second.eventId.length > 0,
    `${first.eventId}, ${second.eventId}`,
  );

  assert(
    '6. getEvent works',
    ledger.getEvent(first.eventId)?.title === 'Foundation check recorded',
    ledger.getEvent(first.eventId)?.title ?? 'missing',
  );

  const listed = ledger.listEvents();
  assert(
    '7. listEvents works',
    listed.length === 2,
    `count=${listed.length}`,
  );

  assert(
    '8. Events are chronological',
    listed[0]?.createdAt === 1000 && listed[1]?.createdAt === 2000,
    `order=${listed.map((e) => e.createdAt).join(',')}`,
  );

  assert(
    '9. listEventsBySource works',
    ledger.listEventsBySource('FOUNDATION').length === 1,
    `count=${ledger.listEventsBySource('FOUNDATION').length}`,
  );

  assert(
    '10. listEventsByCategory works',
    ledger.listEventsByCategory('USER').length === 1,
    `count=${ledger.listEventsByCategory('USER').length}`,
  );

  const projectId = 'project-sample-001';
  ledger.addEvent({
    source: 'PROJECT_VAULT',
    category: 'PROJECT',
    title: 'Project linked event',
    summary: 'Project timeline reference',
    relatedEvidenceIds: [],
    relatedProjectId: projectId,
    status: 'INFO',
    warnings: [],
    errors: [],
    createdAt: 3000,
  });

  assert(
    '11. listEventsForProject works',
    ledger.listEventsForProject(projectId).length === 1,
    `count=${ledger.listEventsForProject(projectId).length}`,
  );

  const snapshot = ledger.createLedgerSnapshot();
  assert(
    '12. createLedgerSnapshot works',
    snapshot.eventCount === 3 && snapshot.events.length === 3,
    snapshot.snapshotId,
  );

  const state = ledger.getLedgerState();
  assert(
    '13. getLedgerState works',
    state.eventCount === 3 && state.snapshotCount === 1 && state.ledgerId.length > 0,
    `events=${state.eventCount} snapshots=${state.snapshotCount}`,
  );

  const evidenceInput = recordEvidenceEvent({
    evidenceId: 'evidence-sample-001',
    createdAt: Date.now(),
    source: 'TRUST_ENGINE',
    label: 'trust_score',
    summary: 'Trust score reference',
    status: 'PASS',
    relatedSystemId: 'trust_engine',
    relatedRecordId: 'trust-sample',
    tags: ['trust'],
    warnings: [],
    errors: [],
  });
  const evidenceEvent = ledger.addEvent({ ...evidenceInput, createdAt: 4000 });
  assert(
    '14. Evidence Registry record can create timeline event',
    evidenceEvent.source === 'EVIDENCE_REGISTRY' &&
      evidenceEvent.relatedEvidenceIds.includes('evidence-sample-001'),
    evidenceEvent.title,
  );

  const projectRecord = {
    projectId: 'project-vault-001',
    name: 'DevPulse V2',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'ACTIVE' as const,
    phase: 'foundation',
    summary: 'Vault project',
    facts: [],
    warnings: [],
    errors: [],
  };
  const projectCreated = ledger.addEvent({
    ...recordProjectEvent('project_created', projectRecord),
    createdAt: 5000,
  });
  const projectSnapshot = ledger.addEvent({
    ...recordProjectSnapshotEvent({
      snapshotId: 'snap-001',
      projectId: projectRecord.projectId,
      capturedAt: Date.now(),
      name: projectRecord.name,
      status: 'ACTIVE',
      phase: 'foundation',
      summary: projectRecord.summary,
      factCount: 0,
      facts: [],
    }),
    createdAt: 6000,
  });

  assert(
    '15. Project Vault record can create timeline event',
    projectCreated.category === 'PROJECT' &&
      projectSnapshot.relatedProjectId === projectRecord.projectId,
    `${projectCreated.title} | ${projectSnapshot.title}`,
  );

  assert(
    '16. Ledger does not calculate trust',
    typeof (ledger as { evaluateTrust?: unknown }).evaluateTrust === 'undefined' &&
      typeof (ledger as { calculateTrustScore?: unknown }).calculateTrustScore === 'undefined',
    'no trust scoring on ledger',
  );

  const answerOwners = listDevPulseV2Owners().filter(
    (o) => o.domain === 'chat_authority' || o.domain === 'chat_answer_authority',
  );
  assert(
    '17. Ledger does not become answer authority',
    !answerOwners.some((o) => o.ownerModule === LEDGER_OWNER_MODULE) &&
      assertSingleAnswerAuthorityRegistered(),
    `ledger=${LEDGER_OWNER_MODULE}`,
  );

  assert(
    '18. Ledger does not replace Evidence Registry',
    DevPulseV2TimelineLedgerAuthority.assertDoesNotReplaceEvidenceRegistry() &&
      getDevPulseV2Owner('evidence_registry').ownerModule === REGISTRY_OWNER_MODULE,
    `registry=${REGISTRY_OWNER_MODULE}`,
  );

  assert(
    '19. Ledger does not replace Project Vault',
    DevPulseV2TimelineLedgerAuthority.assertDoesNotReplaceProjectVault() &&
      getDevPulseV2Owner('project_vault').ownerModule === VAULT_OWNER_MODULE,
    `vault=${VAULT_OWNER_MODULE}`,
  );

  const reportText = formatTimelineLedgerReport(state, ledger.listEvents());
  assert(
    '20. Ledger report generated',
    reportText.includes('Timeline / Event Ledger Report') &&
      ledger.formatReport().includes('Recommendation:'),
    `events=${ledger.getLedgerState().eventCount}`,
  );

  assert(
    '21. Validation Budget Policy ownership unchanged (local boundary check)',
    getDevPulseV2Owner('validation_budget_policy').ownerModule === POLICY_OWNER_MODULE,
    `policy=${POLICY_OWNER_MODULE}`,
  );

  assert(
    '22. Evidence Registry ownership unchanged (local boundary check)',
    getDevPulseV2Owner('evidence_registry').ownerModule === REGISTRY_OWNER_MODULE,
    `registry=${REGISTRY_OWNER_MODULE}`,
  );

  let typecheckOk = false;
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), encoding: 'utf8', stdio: 'pipe' });
    typecheckOk = true;
  } catch {
    typecheckOk = false;
  }
  assert('23. Typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? '✓' : '✗';
    console.log(`${icon} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
    if (!r.passed) allPassed = false;
  }

  if (allPassed) {
    console.log('=====================================================');
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(LEDGER_PASS_TOKEN);
    console.log('');
    process.exit(0);
  }

  failAndExit();
}

function failAndExit(): never {
  console.error('TIMELINE LEDGER FOUNDATION VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
