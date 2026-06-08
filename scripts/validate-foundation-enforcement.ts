/**
 * DevPulse V2 Foundation Enforcement Layer — validation scenarios.
 */

import { runDevPulseV2BuildGate } from '../src/foundation/build-gate.js';
import { formatFounderGateReportText } from '../src/foundation/founder-report.js';
import { FOUNDATION_ENFORCEMENT_PASS_TOKEN } from '../src/foundation/types.js';
import type { BuildGateResult, BuildPacket } from '../src/foundation/types.js';

interface Scenario {
  name: string;
  packet: BuildPacket;
  expected: 'PASS' | 'FAIL' | 'WARN';
}

const scenarios: Scenario[] = [
  {
    name: '1. Valid Phase 1 build packet',
    packet: {
      phase: 1,
      systems: ['foundation_enforcement', 'task_governor', 'shell'],
      eagerModuleCount: 4,
      startupBudgetMs: 500,
      firstClickableBudgetMs: 1500,
      answerAuthorities: ['devpulse_v2_chat_answer_authority'],
      browserVerificationPresent: true,
      buildStage: 'phase1_impl',
    },
    expected: 'PASS',
  },
  {
    name: '2. Forbidden Phase 1 build packet (project_vault)',
    packet: {
      phase: 1,
      systems: ['project_vault'],
      buildStage: 'phase1_impl',
    },
    expected: 'FAIL',
  },
  {
    name: '3. Duplicate answer authority',
    packet: {
      phase: 1,
      systems: ['chat'],
      answerAuthorities: ['devpulse_v2_chat_answer_authority', 'devpulse_v2_vault_reality'],
      buildStage: 'phase1_impl',
    },
    expected: 'FAIL',
  },
  {
    name: '4. Eager modules > 6',
    packet: {
      phase: 1,
      systems: ['shell'],
      eagerModuleCount: 7,
      buildStage: 'phase1_impl',
    },
    expected: 'FAIL',
  },
  {
    name: '5. Startup budget > 800ms',
    packet: {
      phase: 1,
      systems: ['shell'],
      startupBudgetMs: 900,
      buildStage: 'phase1_impl',
    },
    expected: 'FAIL',
  },
  {
    name: '6. Connect module attempt',
    packet: {
      phase: 1,
      systems: ['chat'],
      connectModulePaths: ['src/chat/devpulse_mobile_connect_v16.js'],
      buildStage: 'phase1_impl',
    },
    expected: 'FAIL',
  },
  {
    name: '7a. Browser verification missing (foundation stage — warning)',
    packet: {
      phase: 1,
      systems: ['foundation_enforcement'],
      browserVerificationPresent: false,
      buildStage: 'foundation',
    },
    expected: 'WARN',
  },
  {
    name: '7b. Browser verification missing (release stage — fail)',
    packet: {
      phase: 1,
      systems: ['shell', 'chat'],
      browserVerificationPresent: false,
      buildStage: 'release',
    },
    expected: 'FAIL',
  },
  {
    name: '8. World 2 law modification attempt',
    packet: {
      phase: 1,
      systems: ['foundation_enforcement'],
      world2LawModificationAttempt: true,
      modulePaths: ['architecture/DEVPULSE_V2_CONSTITUTION.md'],
      buildStage: 'phase1_impl',
    },
    expected: 'FAIL',
  },
];

function evaluateScenario(result: BuildGateResult, expected: Scenario['expected']): boolean {
  if (expected === 'PASS') {
    return result.passed;
  }
  if (expected === 'FAIL') {
    return !result.passed;
  }
  // WARN: pass with warnings, no violations
  return result.passed && result.warningCount > 0 && result.violationCount === 0;
}

function main(): void {
  console.log('');
  console.log('DevPulse V2 — Foundation Enforcement Layer Validation');
  console.log('=====================================================');
  console.log('');

  let allPassed = true;

  for (const scenario of scenarios) {
    const result = runDevPulseV2BuildGate(scenario.packet);
    const ok = evaluateScenario(result, scenario.expected);
    const icon = ok ? '✓' : '✗';
    const verdict = result.passed ? 'PASS' : 'FAIL';

    console.log(`${icon} ${scenario.name}`);
    console.log(`  Expected: ${scenario.expected} | Actual: ${verdict} (${result.violationCount} violations, ${result.warningCount} warnings)`);

    if (!ok) {
      allPassed = false;
      console.log(formatFounderGateReportText(result));
    }

    console.log('');
  }

  if (allPassed) {
    console.log('=====================================================');
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(FOUNDATION_ENFORCEMENT_PASS_TOKEN);
    console.log('');
    process.exit(0);
  } else {
    console.error('VALIDATION FAILED — one or more scenarios did not match expected outcome.');
    process.exit(1);
  }
}

main();
