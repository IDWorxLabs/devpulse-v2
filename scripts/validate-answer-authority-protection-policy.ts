/**
 * DevPulse V2 Answer Authority Protection Policy — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { runDevPulseV2BuildGate } from '../src/foundation/build-gate.js';
import { formatFounderGateReportText } from '../src/foundation/founder-report.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { assertSingleAnswerAuthorityRegistered } from '../src/chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../src/chat/types.js';
import {
  DevPulseV2AnswerAuthorityProtectionAuthority,
  detectAnswerAuthorityViolations,
  formatAnswerAuthorityProtectionReport,
  PROTECTION_OWNER_MODULE,
  PROTECTION_PASS_TOKEN,
  resetDevPulseV2AnswerAuthorityProtectionAuthorityForTests,
  runHiddenAnswerAuthorityDetection,
  runMultipleAnswerAuthorityDetection,
  simulateMultipleAnswerAuthorityViolation,
  validateAnswerContractIntegrity,
  validateSingleAnswerAuthority,
  validateVisibleAnswerOwner,
  verifyChatAuthorityRegistered,
} from '../src/answer-authority-protection/index.js';
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
  console.log('DevPulse V2 — Answer Authority Protection Policy Validation');
  console.log('==========================================================');
  console.log('');

  const buildGate = runDevPulseV2BuildGate({
    phase: 3,
    systems: ['answer_authority_protection_policy'],
    eagerModuleCount: 2,
    answerAuthorities: ['devpulse_v2_chat_authority'],
    browserVerificationPresent: true,
    buildStage: 'foundation',
  });

  assert(
    '1. Build gate accepts answer_authority_protection_policy packet',
    buildGate.buildAllowed && buildGate.violationCount === 0,
    buildGate.summary,
  );

  if (!buildGate.buildAllowed) {
    console.log(formatFounderGateReportText(buildGate));
    failAndExit();
  }

  const protection = resetDevPulseV2AnswerAuthorityProtectionAuthorityForTests();

  assert(
    '2. Protection authority exists',
    protection instanceof DevPulseV2AnswerAuthorityProtectionAuthority,
    `ownerModule=${DevPulseV2AnswerAuthorityProtectionAuthority.ownerModule}`,
  );

  const owner = getDevPulseV2Owner('answer_authority_protection_policy');
  assert(
    '3. Ownership registry contains answer_authority_protection_policy',
    owner.ownerModule === PROTECTION_OWNER_MODULE &&
      DevPulseV2AnswerAuthorityProtectionAuthority.assertRegistryOwnership(),
    `registered=${owner.ownerModule}`,
  );

  assert(
    '4. Chat Authority is registered',
    verifyChatAuthorityRegistered() &&
      getDevPulseV2Owner('chat_authority').ownerModule === CHAT_OWNER_MODULE,
    `chat=${CHAT_OWNER_MODULE}`,
  );

  const singleCheck = validateSingleAnswerAuthority();
  assert(
    '5. Single answer authority validation passes',
    singleCheck.passed,
    singleCheck.message,
  );

  const visibleCheck = validateVisibleAnswerOwner();
  assert(
    '6. Visible answer owner is Chat Authority',
    visibleCheck.passed && visibleCheck.message.includes('Chat Authority'),
    visibleCheck.message,
  );

  assert(
    '7. Trust Engine cannot become answer authority',
    DevPulseV2AnswerAuthorityProtectionAuthority.assertSystemCannotBecomeAnswerAuthority(
      'trust_engine',
    ),
    getDevPulseV2Owner('trust_engine').ownerModule,
  );

  assert(
    '8. Central Brain cannot become answer authority',
    DevPulseV2AnswerAuthorityProtectionAuthority.assertSystemCannotBecomeAnswerAuthority(
      'central_brain',
    ),
    getDevPulseV2Owner('central_brain').ownerModule,
  );

  assert(
    '9. Intent Architecture cannot become answer authority',
    DevPulseV2AnswerAuthorityProtectionAuthority.assertSystemCannotBecomeAnswerAuthority(
      'intent_architecture',
    ),
    getDevPulseV2Owner('intent_architecture').ownerModule,
  );

  assert(
    '10. Context Arbitration cannot become answer authority',
    DevPulseV2AnswerAuthorityProtectionAuthority.assertSystemCannotBecomeAnswerAuthority(
      'context_arbitration',
    ),
    getDevPulseV2Owner('context_arbitration').ownerModule,
  );

  assert(
    '11. Evidence Registry cannot become answer authority',
    DevPulseV2AnswerAuthorityProtectionAuthority.assertSystemCannotBecomeAnswerAuthority(
      'evidence_registry',
    ),
    getDevPulseV2Owner('evidence_registry').ownerModule,
  );

  assert(
    '12. Timeline Ledger cannot become answer authority',
    DevPulseV2AnswerAuthorityProtectionAuthority.assertSystemCannotBecomeAnswerAuthority(
      'timeline_event_ledger',
    ),
    getDevPulseV2Owner('timeline_event_ledger').ownerModule,
  );

  assert(
    '13. Project Vault cannot become answer authority',
    DevPulseV2AnswerAuthorityProtectionAuthority.assertSystemCannotBecomeAnswerAuthority(
      'project_vault',
    ),
    getDevPulseV2Owner('project_vault').ownerModule,
  );

  const hiddenDetected = runHiddenAnswerAuthorityDetection([
    'devpulse_v2_chat_authority',
    'devpulse_v2_hidden_answer_module',
  ]);
  assert(
    '14. Hidden answer authority detection works',
    hiddenDetected,
    'competing hidden module detected',
  );

  const multipleDetected = runMultipleAnswerAuthorityDetection(
    simulateMultipleAnswerAuthorityViolation(),
  );
  assert(
    '15. Multiple answer authority detection works',
    multipleDetected,
    simulateMultipleAnswerAuthorityViolation().join(', '),
  );

  const contractCheck = validateAnswerContractIntegrity();
  const violations = detectAnswerAuthorityViolations();
  assert(
    '16. Answer contract validation works',
    contractCheck.passed &&
      violations.filter((v) => !v.passed).length === 0,
    contractCheck.message,
  );

  const report = protection.runProtectionCheck();
  const reportText = formatAnswerAuthorityProtectionReport(report);
  assert(
    '17. Protection report generated',
    report.status === 'SINGLE_AUTHORITY' &&
      reportText.includes('Answer Authority Protection Report') &&
      protection.formatReport().includes('Recommendation:'),
    `status=${report.status}`,
  );

  assert(
    '18. Policy does not become answer authority',
    DevPulseV2AnswerAuthorityProtectionAuthority.assertDoesNotBecomeAnswerAuthority() &&
      assertSingleAnswerAuthorityRegistered(),
    `protection=${PROTECTION_OWNER_MODULE}`,
  );

  assert(
    '19. Validation Budget Policy still passes',
    DevPulseV2AnswerAuthorityProtectionAuthority.assertValidationBudgetCompatible() &&
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
  assert('20. Typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? '✓' : '✗';
    console.log(`${icon} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
    if (!r.passed) allPassed = false;
  }

  if (allPassed) {
    console.log('==========================================================');
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(PROTECTION_PASS_TOKEN);
    console.log('');
    process.exit(0);
  }

  failAndExit();
}

function failAndExit(): never {
  console.error('ANSWER AUTHORITY PROTECTION POLICY VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
