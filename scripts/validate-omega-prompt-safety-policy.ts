/**
 * DevPulse V2 OMEGA Prompt Safety Policy — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { runDevPulseV2BuildGate } from '../src/foundation/build-gate.js';
import { formatFounderGateReportText } from '../src/foundation/founder-report.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { CHAT_OWNER_MODULE } from '../src/chat/types.js';
import { POLICY_OWNER_MODULE } from '../src/validation-budget/types.js';
import {
  classifyOmegaPromptSafety,
  DevPulseV2OmegaPromptSafetyAuthority,
  formatOmegaAuthorityCheckTemplate,
  OMEGA_OWNER_MODULE,
  OMEGA_PASS_TOKEN,
  resetDevPulseV2OmegaPromptSafetyAuthorityForTests,
} from '../src/omega-safety/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const SAFE_SINGLE_SYSTEM = `
SYSTEM ID
omega_prompt_safety_policy
Build one system authority only.
Does not become answer authority.
Does not execute.
VALIDATION_MODE: FAST_FEATURE_CHECK
`;

const SAFE_CAPABILITY_WAVE = `
SYSTEM ID
omega_prompt_safety_policy
Single capability wave inside one authority.
Does not replace existing authorities.
VALIDATION_MODE: FAST_FEATURE_CHECK
`;

const SAFE_VERTICAL_SLICE = `
SYSTEM ID
omega_prompt_safety_policy
Single vertical slice inside one authority.
Does not execute.
VALIDATION_MODE: FAST_FEATURE_CHECK
`;

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — OMEGA Prompt Safety Policy Validation');
  console.log('====================================================');
  console.log('');

  const buildGate = runDevPulseV2BuildGate({
    phase: 2,
    systems: ['omega_prompt_safety_policy'],
    eagerModuleCount: 2,
    answerAuthorities: ['devpulse_v2_chat_authority'],
    browserVerificationPresent: true,
    buildStage: 'foundation',
  });

  assert(
    '1. Build gate accepts omega_prompt_safety_policy packet',
    buildGate.buildAllowed && buildGate.violationCount === 0,
    buildGate.summary,
  );

  if (!buildGate.buildAllowed) {
    console.log(formatFounderGateReportText(buildGate));
    failAndExit();
  }

  const authority = resetDevPulseV2OmegaPromptSafetyAuthorityForTests();

  assert(
    '2. Omega Prompt Safety Authority exists',
    authority instanceof DevPulseV2OmegaPromptSafetyAuthority,
    `ownerModule=${DevPulseV2OmegaPromptSafetyAuthority.ownerModule}`,
  );

  const owner = getDevPulseV2Owner('omega_prompt_safety_policy');
  assert(
    '3. Ownership registry contains omega_prompt_safety_policy',
    owner.ownerModule === OMEGA_OWNER_MODULE &&
      DevPulseV2OmegaPromptSafetyAuthority.assertRegistryOwnership(),
    `registered=${owner.ownerModule}`,
  );

  const single = classifyOmegaPromptSafety(SAFE_SINGLE_SYSTEM);
  assert(
    '4. Single system prompt classified SAFE',
    single.status === 'SAFE' && single.scope === 'SINGLE_SYSTEM_AUTHORITY',
    `status=${single.status} scope=${single.scope}`,
  );

  const wave = classifyOmegaPromptSafety(SAFE_CAPABILITY_WAVE);
  assert(
    '5. Single capability wave classified SAFE',
    wave.status === 'SAFE' && wave.scope === 'SINGLE_CAPABILITY_WAVE',
    `status=${wave.status} scope=${wave.scope}`,
  );

  const slice = classifyOmegaPromptSafety(SAFE_VERTICAL_SLICE);
  assert(
    '6. Single vertical slice classified SAFE',
    slice.status === 'SAFE' && slice.scope === 'SINGLE_VERTICAL_SLICE',
    `status=${slice.status} scope=${slice.scope}`,
  );

  const multi = classifyOmegaPromptSafety(
    'Build trust_engine and project_vault together. multiple systems. entire devpulse.',
  );
  assert(
    '7. Multi-system prompt classified UNSAFE',
    multi.status === 'UNSAFE' && multi.scope === 'MULTI_AUTHORITY_UNSAFE',
    `status=${multi.status} errors=${multi.errors.length}`,
  );

  const connect = classifyOmegaPromptSafety('connect everything across all systems');
  assert(
    '8. Prompt with connect everything classified UNSAFE',
    connect.status === 'UNSAFE',
    connect.errors.join('; '),
  );

  const replaceChat = classifyOmegaPromptSafety('replace chat authority with new module');
  assert(
    '9. Prompt with replace chat authority classified UNSAFE',
    replaceChat.status === 'UNSAFE',
    replaceChat.errors.join('; '),
  );

  const hiddenStartup = classifyOmegaPromptSafety('create hidden startup chain before shell');
  assert(
    '10. Prompt with hidden startup chain classified UNSAFE',
    hiddenStartup.status === 'UNSAFE',
    hiddenStartup.errors.join('; '),
  );

  const bypassGov = classifyOmegaPromptSafety('bypass Task Governor for faster boot');
  assert(
    '11. Prompt with bypass Task Governor classified UNSAFE',
    bypassGov.status === 'UNSAFE',
    bypassGov.errors.join('; '),
  );

  const brainMix = classifyOmegaPromptSafety(
    'Build Central Brain and AiDev with autonomous execution in one prompt',
  );
  assert(
    '12. Prompt with Central Brain + AiDev + execution classified UNSAFE',
    brainMix.status === 'UNSAFE',
    brainMix.errors.join('; '),
  );

  const template = formatOmegaAuthorityCheckTemplate();
  assert(
    '13. Authority check template generated',
    template.includes('OMEGA AUTHORITY CHECK') &&
      template.includes('What system does this prompt build?'),
    'template ok',
  );

  authority.evaluatePrompt(SAFE_SINGLE_SYSTEM);
  const report = authority.formatReport();
  assert(
    '14. Safety report generated',
    report.includes('OMEGA Prompt Safety Report') && report.includes('Validation mode:'),
    report.split('\n')[2] ?? 'report',
  );

  assert(
    '15. FAST_FEATURE_CHECK recommended for safe one-system work',
    single.validationMode === 'FAST_FEATURE_CHECK',
    single.validationMode,
  );

  const authorityChange = classifyOmegaPromptSafety(
    'Update ownership registry and change answer authority for chat',
  );
  assert(
    '16. FULL_STACK_CHECK recommended for authority-changing prompt',
    authorityChange.validationMode === 'FULL_STACK_CHECK',
    authorityChange.validationMode,
  );

  const phaseTransition = classifyOmegaPromptSafety(
    'Phase transition before phase 3 begins — new phase rollout',
  );
  assert(
    '17. PHASE_TRANSITION_CHECK recommended for phase transition prompt',
    phaseTransition.validationMode === 'PHASE_TRANSITION_CHECK',
    phaseTransition.validationMode,
  );

  assert(
    '18. Policy does not become Central Brain',
    DevPulseV2OmegaPromptSafetyAuthority.assertDoesNotBecomeCentralBrain(),
    OMEGA_OWNER_MODULE,
  );

  assert(
    '19. Policy does not become answer authority',
    DevPulseV2OmegaPromptSafetyAuthority.assertDoesNotBecomeAnswerAuthority() &&
      getDevPulseV2Owner('chat_authority').ownerModule === CHAT_OWNER_MODULE,
    `chat=${CHAT_OWNER_MODULE}`,
  );

  assert(
    '20. Validation Budget Policy remains compatible',
    DevPulseV2OmegaPromptSafetyAuthority.assertValidationBudgetCompatible() &&
      getDevPulseV2Owner('validation_budget_policy').ownerModule === POLICY_OWNER_MODULE,
    `budget=${POLICY_OWNER_MODULE}`,
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
    console.log('====================================================');
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(OMEGA_PASS_TOKEN);
    console.log('');
    process.exit(0);
  }

  failAndExit();
}

function failAndExit(): never {
  console.error('OMEGA PROMPT SAFETY POLICY VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
