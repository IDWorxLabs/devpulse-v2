/**
 * DevPulse V2 Planning Stack Reality Validation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { assertSingleAnswerAuthorityRegistered } from '../src/chat/chat-report.js';
import { CHAT_OWNER_MODULE } from '../src/chat/types.js';
import { CENTRAL_BRAIN_OWNER_MODULE } from '../src/central-brain/types.js';
import { REGISTRY_OWNER_MODULE } from '../src/evidence-registry/types.js';
import { runDevPulseV2BuildGate } from '../src/foundation/build-gate.js';
import { formatFounderGateReportText } from '../src/foundation/founder-report.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import {
  DevPulseV2PlanningStackValidationAuthority,
  formatPlanningStackValidationReport,
  PLANNING_STACK_VALIDATION_REQUEST,
  resetDevPulseV2PlanningStackValidationAuthorityForTests,
  runPlanningStackValidation,
  VALIDATION_OWNER_MODULE,
  VALIDATION_PASS_TOKEN,
  validateDuplicateDetectionSystems,
  validateOwnershipIntegrity,
} from '../src/planning-stack-validation/index.js';
import { VAULT_OWNER_MODULE } from '../src/project-vault/types.js';
import { LEDGER_OWNER_MODULE } from '../src/timeline-ledger/types.js';
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

function getHandoff(result: ReturnType<typeof runPlanningStackValidation>, id: string) {
  return result.handoffs.find((h) => h.handoffId === id);
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Planning Stack Reality Validation');
  console.log('===============================================');
  console.log('');

  const buildGate = runDevPulseV2BuildGate({
    phase: 4.5,
    systems: ['planning_stack_reality_validation'],
    eagerModuleCount: 2,
    answerAuthorities: ['devpulse_v2_chat_authority'],
    browserVerificationPresent: true,
    buildStage: 'validation',
  });

  assert(
    '1. Build gate accepts packet',
    buildGate.buildAllowed && buildGate.violationCount === 0,
    buildGate.summary,
  );

  if (!buildGate.buildAllowed) {
    console.log(formatFounderGateReportText(buildGate));
    failAndExit();
  }

  const validator = resetDevPulseV2PlanningStackValidationAuthorityForTests();

  assert(
    '2. Validation authority exists',
    validator instanceof DevPulseV2PlanningStackValidationAuthority,
    `ownerModule=${DevPulseV2PlanningStackValidationAuthority.ownerModule}`,
  );

  const owner = getDevPulseV2Owner('planning_stack_reality_validation');
  assert(
    '3. Ownership registry contains planning_stack_reality_validation',
    owner.ownerModule === VALIDATION_OWNER_MODULE &&
      DevPulseV2PlanningStackValidationAuthority.assertRegistryOwnership(),
    `registered=${owner.ownerModule}`,
  );

  assert(
    '4. Planner starts empty',
    validator.getValidatorState().runCount === 0,
    `runs=${validator.getValidatorState().runCount}`,
  );

  const result = validator.runValidation(PLANNING_STACK_VALIDATION_REQUEST);
  assert(
    '5. Validation run executes',
    result.validationId.length > 0 && result.handoffs.length === 6,
    `handoffs=${result.handoffs.length} status=${result.overallStatus}`,
  );

  const aidevHandoff = getHandoff(result, 'aidev_to_requirements')!;
  assert(
    '6. AiDev handoff valid',
    aidevHandoff.sourceProducedOutput &&
      aidevHandoff.targetConsumedOutput &&
      aidevHandoff.ownershipPreserved,
    aidevHandoff.detail,
  );

  const reqHandoff = getHandoff(result, 'requirements_to_architect')!;
  assert(
    '7. Requirement handoff valid',
    reqHandoff.sourceProducedOutput && reqHandoff.targetConsumedOutput && reqHandoff.ownershipPreserved,
    reqHandoff.detail,
  );

  const archHandoff = getHandoff(result, 'architect_to_packages')!;
  assert(
    '8. Architect handoff valid',
    archHandoff.sourceProducedOutput && archHandoff.targetConsumedOutput && archHandoff.ownershipPreserved,
    archHandoff.detail,
  );

  const pkgHandoff = getHandoff(result, 'architect_to_packages')!;
  assert(
    '9. Package handoff valid',
    pkgHandoff.sourceProducedOutput && pkgHandoff.targetConsumedOutput && pkgHandoff.ownershipPreserved,
    pkgHandoff.detail,
  );

  const stratHandoff = getHandoff(result, 'packages_to_strategy')!;
  assert(
    '10. Strategy handoff valid',
    stratHandoff.sourceProducedOutput && stratHandoff.targetConsumedOutput && stratHandoff.ownershipPreserved,
    stratHandoff.detail,
  );

  const codePlanHandoff = getHandoff(result, 'strategy_to_code_plan')!;
  assert(
    '11. Code plan handoff valid',
    codePlanHandoff.sourceProducedOutput &&
      codePlanHandoff.targetConsumedOutput &&
      codePlanHandoff.ownershipPreserved,
    codePlanHandoff.detail,
  );

  const recoveryHandoff = getHandoff(result, 'code_plan_to_recovery')!;
  assert(
    '12. Recovery handoff valid',
    recoveryHandoff.sourceProducedOutput &&
      recoveryHandoff.targetConsumedOutput &&
      recoveryHandoff.ownershipPreserved,
    recoveryHandoff.detail,
  );

  const ownership = validateOwnershipIntegrity();
  assert(
    '13. Ownership integrity preserved',
    ownership.every((c) => c.preserved),
    `${ownership.filter((c) => c.preserved).length}/${ownership.length} preserved`,
  );

  assert(
    '14. Chat Authority ownership preserved',
    getDevPulseV2Owner('chat_authority').ownerModule === CHAT_OWNER_MODULE &&
      getDevPulseV2Owner('chat_answer_authority').ownerModule === CHAT_OWNER_MODULE,
    CHAT_OWNER_MODULE,
  );

  assert(
    '15. Central Brain ownership preserved',
    getDevPulseV2Owner('central_brain').ownerModule === CENTRAL_BRAIN_OWNER_MODULE,
    CENTRAL_BRAIN_OWNER_MODULE,
  );

  assert(
    '16. Project Vault ownership preserved',
    getDevPulseV2Owner('project_vault').ownerModule === VAULT_OWNER_MODULE,
    VAULT_OWNER_MODULE,
  );

  assert(
    '17. Evidence Registry ownership preserved',
    getDevPulseV2Owner('evidence_registry').ownerModule === REGISTRY_OWNER_MODULE,
    REGISTRY_OWNER_MODULE,
  );

  assert(
    '18. Timeline ownership preserved',
    getDevPulseV2Owner('timeline_event_ledger').ownerModule === LEDGER_OWNER_MODULE,
    LEDGER_OWNER_MODULE,
  );

  const dupSystems = validateDuplicateDetectionSystems();
  assert(
    '19. Duplicate detection active',
    dupSystems.length === 6 && dupSystems.every((d) => d.active),
    dupSystems.map((d) => `${d.systemId}:${d.active}`).join(', '),
  );

  assert(
    '20. DUPLICATE_RISK propagation works',
    result.duplicateRiskPropagated && result.duplicateRiskCount > 0,
    `count=${result.duplicateRiskCount}`,
  );

  const reportText = formatPlanningStackValidationReport(
    validator.getValidatorState(),
    validator.listRuns(),
  );
  assert(
    '21. Report generated',
    reportText.includes('Planning Stack Reality Validation Report') &&
      validator.formatReport().includes('Recommendation:'),
    `runs=${validator.getValidatorState().runCount}`,
  );

  assert(
    '22. Phase 5 readiness calculated',
    result.phase5Readiness === 'PHASE_5_READY',
    result.phase5Readiness,
  );

  assert(
    '23. No code generated',
    DevPulseV2PlanningStackValidationAuthority.assertDoesNotGenerateCode(),
    'no code generation methods',
  );

  assert(
    '24. No execution performed',
    DevPulseV2PlanningStackValidationAuthority.assertDoesNotExecuteActions() &&
      DevPulseV2PlanningStackValidationAuthority.assertDoesNotPerformRollback() &&
      DevPulseV2PlanningStackValidationAuthority.assertDoesNotPerformRecovery(),
    'no execute/rollback/recovery methods',
  );

  assert(
    '25. No project modifications',
    DevPulseV2PlanningStackValidationAuthority.assertDoesNotModifyProjects(),
    `vault=${VAULT_OWNER_MODULE}`,
  );

  assert(
    '26. No answer authority violations',
    DevPulseV2PlanningStackValidationAuthority.assertDoesNotBecomeAnswerAuthority() &&
      assertSingleAnswerAuthorityRegistered(),
    VALIDATION_OWNER_MODULE,
  );

  assert(
    '26. Validation Budget Policy still passes',
    DevPulseV2PlanningStackValidationAuthority.assertValidationBudgetCompatible() &&
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
  assert('27. Typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? '✓' : '✗';
    console.log(`${icon} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
    if (!r.passed) allPassed = false;
  }

  if (allPassed) {
    console.log('===============================================');
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(VALIDATION_PASS_TOKEN);
    console.log('');
    console.log('PHASE_5_READY');
    console.log('');
    process.exit(0);
  }

  failAndExit();
}

function failAndExit(): never {
  console.error('PLANNING STACK REALITY VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
