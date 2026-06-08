/**
 * DevPulse V2 Validation Budget Policy — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { runDevPulseV2BuildGate } from '../src/foundation/build-gate.js';
import { formatFounderGateReportText } from '../src/foundation/founder-report.js';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../src/foundation/ownership-registry.js';
import { assertSingleAnswerAuthorityRegistered } from '../src/chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../src/chat/types.js';
import { REGISTRY_OWNER_MODULE } from '../src/evidence-registry/types.js';
import { TRUST_OWNER_MODULE } from '../src/trust-engine/types.js';
import {
  DevPulseV2ValidationBudgetPolicyAuthority,
  POLICY_OWNER_MODULE,
  POLICY_PASS_TOKEN,
  resetDevPulseV2ValidationBudgetPolicyAuthorityForTests,
} from '../src/validation-budget/index.js';

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
  console.log('DevPulse V2 — Validation Budget Policy Validation');
  console.log('===================================================');
  console.log('');

  const buildGate = runDevPulseV2BuildGate({
    phase: 2,
    systems: ['validation_budget_policy'],
    eagerModuleCount: 2,
    answerAuthorities: ['devpulse_v2_chat_authority'],
    browserVerificationPresent: true,
    buildStage: 'foundation',
  });

  assert(
    '1. Build gate accepts validation_budget_policy packet',
    buildGate.buildAllowed && buildGate.violationCount === 0,
    buildGate.summary,
  );

  if (!buildGate.buildAllowed) {
    console.log(formatFounderGateReportText(buildGate));
    failAndExit();
  }

  const policy = resetDevPulseV2ValidationBudgetPolicyAuthorityForTests();

  assert(
    '2. Validation Budget Policy Authority exists',
    policy instanceof DevPulseV2ValidationBudgetPolicyAuthority,
    `ownerModule=${DevPulseV2ValidationBudgetPolicyAuthority.ownerModule}`,
  );

  const owner = getDevPulseV2Owner('validation_budget_policy');
  assert(
    '3. Ownership registry contains validation_budget_policy',
    owner.ownerModule === POLICY_OWNER_MODULE &&
      DevPulseV2ValidationBudgetPolicyAuthority.assertRegistryOwnership(),
    `registered=${owner.ownerModule}`,
  );

  const featureRec = policy.getRecommendation(
    'FEATURE_LOCAL_CHANGE',
    'npm run validate:validation-budget',
  );
  assert(
    '4. FEATURE_LOCAL_CHANGE recommends FAST_FEATURE_CHECK',
    featureRec.mode === 'FAST_FEATURE_CHECK',
    `mode=${featureRec.mode}`,
  );

  assert(
    '5. FAST_FEATURE_CHECK requires current feature validator + typecheck',
    featureRec.requiredCommands.includes('npm run validate:validation-budget') &&
      featureRec.requiredCommands.includes('npm run typecheck'),
    featureRec.requiredCommands.join(', '),
  );

  assert(
    '6. FAST_FEATURE_CHECK forbids full-stack chain',
    featureRec.forbiddenCommands.some((c) => c.includes('nested npm run validate:')),
    `forbidden=${featureRec.forbiddenCommands.length}`,
  );

  const ownershipRec = policy.getRecommendation('OWNERSHIP_REGISTRY_CHANGE');
  assert(
    '7. OWNERSHIP_REGISTRY_CHANGE recommends FULL_STACK_CHECK',
    ownershipRec.mode === 'FULL_STACK_CHECK',
    `mode=${ownershipRec.mode}`,
  );

  assert(
    '8. ANSWER_AUTHORITY_CHANGE recommends FULL_STACK_CHECK',
    policy.getRecommendation('ANSWER_AUTHORITY_CHANGE').mode === 'FULL_STACK_CHECK',
    'FULL_STACK_CHECK',
  );

  assert(
    '9. BROWSER_RUNNER_CHANGE recommends FULL_STACK_CHECK',
    policy.getRecommendation('BROWSER_RUNNER_CHANGE').mode === 'FULL_STACK_CHECK',
    'FULL_STACK_CHECK',
  );

  assert(
    '10. TASK_GOVERNOR_CHANGE recommends FULL_STACK_CHECK',
    policy.getRecommendation('TASK_GOVERNOR_CHANGE').mode === 'FULL_STACK_CHECK',
    'FULL_STACK_CHECK',
  );

  assert(
    '11. FOUNDATION_ENFORCEMENT_CHANGE recommends FULL_STACK_CHECK',
    policy.getRecommendation('FOUNDATION_ENFORCEMENT_CHANGE').mode === 'FULL_STACK_CHECK',
    'FULL_STACK_CHECK',
  );

  assert(
    '12. PHASE_TRANSITION recommends PHASE_TRANSITION_CHECK',
    policy.getRecommendation('PHASE_TRANSITION').mode === 'PHASE_TRANSITION_CHECK',
    'PHASE_TRANSITION_CHECK',
  );

  const scriptsDir = join(process.cwd(), 'scripts');
  const scan = policy.scanValidatorScripts(scriptsDir);

  assert(
    '13. Scanner detects nested npm validate calls',
    scan.nestedValidatorCalls.length > 0,
    `nested=${scan.nestedValidatorCalls.length}`,
  );

  const fullStackNested = scan.nestedValidatorCalls.filter(
    (c) => c.scriptMode === 'FULL_STACK_CHECK',
  );
  assert(
    '14. Scanner allows files marked VALIDATION_MODE: FULL_STACK_CHECK',
    fullStackNested.length > 0,
    `fullStackNested=${fullStackNested.length}`,
  );

  const fastViolations = scan.nestedValidatorCalls.filter(
    (c) => c.scriptMode === 'FAST_FEATURE_CHECK',
  );
  assert(
    '15. Scanner fails FAST feature validators with nested validation chains',
    fastViolations.length === 0 && scan.status !== 'FAIL',
    fastViolations.length > 0
      ? `violations=${fastViolations.map((v) => v.file).join(',')}`
      : `scan=${scan.status}`,
  );

  const reportText = policy.formatReport();
  assert(
    '16. Report is generated',
    reportText.includes('Validation Budget Report') &&
      reportText.includes('Recommended mode:'),
    `scan=${scan.status}`,
  );

  assert(
    '17. Evidence Registry validation remains fast/local',
    policy.isEvidenceRegistryValidationFast(scriptsDir),
    'FAST_FEATURE_CHECK without nested validate calls',
  );

  assert(
    '18. Policy does not become Trust Engine',
    DevPulseV2ValidationBudgetPolicyAuthority.assertDoesNotReplaceTrustEngine() &&
      getDevPulseV2Owner('trust_engine').ownerModule === TRUST_OWNER_MODULE,
    `trust=${TRUST_OWNER_MODULE}`,
  );

  assert(
    '19. Policy does not become Evidence Registry',
    DevPulseV2ValidationBudgetPolicyAuthority.assertDoesNotReplaceEvidenceRegistry() &&
      getDevPulseV2Owner('evidence_registry').ownerModule === REGISTRY_OWNER_MODULE,
    `registry=${REGISTRY_OWNER_MODULE}`,
  );

  const answerOwners = listDevPulseV2Owners().filter(
    (o) => o.domain === 'chat_authority' || o.domain === 'chat_answer_authority',
  );
  assert(
    '20. Policy does not become answer authority',
    !answerOwners.some((o) => o.ownerModule === POLICY_OWNER_MODULE) &&
      assertSingleAnswerAuthorityRegistered(),
    `chat=${CHAT_OWNER_MODULE}`,
  );

  let typecheckOk = false;
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), encoding: 'utf8', stdio: 'pipe' });
    typecheckOk = true;
  } catch {
    typecheckOk = false;
  }
  assert('21. Typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? '✓' : '✗';
    console.log(`${icon} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
    if (!r.passed) allPassed = false;
  }

  if (allPassed) {
    console.log('===================================================');
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(POLICY_PASS_TOKEN);
    console.log('');
    process.exit(0);
  }

  failAndExit();
}

function failAndExit(): never {
  console.error('VALIDATION BUDGET POLICY VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
