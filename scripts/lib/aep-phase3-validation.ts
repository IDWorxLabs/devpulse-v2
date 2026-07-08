/**
 * AEP Phase 3 — shared validation suite for Autonomous Recovery Engine.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  attemptEngineeringRecovery,
  AUTONOMOUS_RECOVERY_ENGINE_V1_PASS_TOKEN,
  AEP_PHASE3_PASS_TOKEN,
  recoverBuild,
  recoverPreview,
  recoverValidation,
  resetAutonomousRecoveryAuthorityForTests,
} from '../../src/autonomous-recovery-authority/index.js';
import { routeEngineeringRecovery } from '../../src/ase-enforcement-engine/index.js';
import { analyzeEngineeringRootCause, ROOT_CAUSE_ENGINE_V1_PASS_TOKEN } from '../../src/recovery-root-cause/index.js';
import { planEngineeringRecovery, RECOVERY_PLANNER_V1_PASS_TOKEN } from '../../src/recovery-planner/index.js';
import {
  generateRecoveryStrategies,
  selectSafestRecoveryStrategy,
  RECOVERY_STRATEGY_ENGINE_V1_PASS_TOKEN,
} from '../../src/recovery-strategy-engine/index.js';
import { executeRecoveryStrategy, RECOVERY_EXECUTOR_V1_PASS_TOKEN } from '../../src/recovery-executor/index.js';
import {
  replayValidationAfterRecovery,
  VALIDATION_REPLAY_ENGINE_V1_PASS_TOKEN,
} from '../../src/validation-replay-engine/index.js';
import {
  continueEngineeringAfterRecovery,
  ENGINEERING_CONTINUATION_V1_PASS_TOKEN,
} from '../../src/engineering-continuation/index.js';
import {
  listRecoveryMemoryRecords,
  RECOVERY_MEMORY_V1_PASS_TOKEN,
  resetRecoveryMemoryForTests,
} from '../../src/recovery-memory/index.js';
import {
  evaluateRecoveryEscalation,
  RECOVERY_ESCALATION_AUTHORITY_V1_PASS_TOKEN,
} from '../../src/recovery-escalation-authority/index.js';
import { getDevPulseV2AutonomousRecoveryAuthority } from '../../src/autonomous-recovery-authority/index.js';

export {
  AUTONOMOUS_RECOVERY_ENGINE_V1_PASS_TOKEN,
  AEP_PHASE3_PASS_TOKEN,
  RECOVERY_PLANNER_V1_PASS_TOKEN,
  ROOT_CAUSE_ENGINE_V1_PASS_TOKEN,
  RECOVERY_STRATEGY_ENGINE_V1_PASS_TOKEN,
  RECOVERY_EXECUTOR_V1_PASS_TOKEN,
  VALIDATION_REPLAY_ENGINE_V1_PASS_TOKEN,
  ENGINEERING_CONTINUATION_V1_PASS_TOKEN,
  RECOVERY_MEMORY_V1_PASS_TOKEN,
  RECOVERY_ESCALATION_AUTHORITY_V1_PASS_TOKEN,
};

export interface AepPhase3Check {
  name: string;
  passed: boolean;
  detail: string;
}

export function validateRecoveryPlanner(): AepPhase3Check[] {
  const checks: AepPhase3Check[] = [];
  const rootCause = analyzeEngineeringRootCause({
    failureStage: 'MATERIALIZATION_VALIDATION',
    failureReason: 'validation timeout during universal materialization check',
  });
  const plan = planEngineeringRecovery({
    rootCause,
    failureStage: 'MATERIALIZATION_VALIDATION',
    failureReason: 'validation timeout',
  });
  checks.push({
    name: 'recovery plan generated',
    passed: plan.candidates.length > 0,
    detail: String(plan.candidates.length),
  });
  checks.push({
    name: 'replay ranked for validation timeout',
    passed: plan.candidates.some((c) => c.operation === 'REPLAY'),
    detail: plan.selectedCandidateId ?? 'none',
  });
  return checks;
}

export function validateRootCauseAnalysis(): AepPhase3Check[] {
  const checks: AepPhase3Check[] = [];
  const validation = analyzeEngineeringRootCause({
    failureStage: 'MATERIALIZATION_VALIDATION',
    failureReason: 'Universal app materialization validation failed',
  });
  checks.push({
    name: 'validation failure classified',
    passed: validation.category === 'VALIDATION',
    detail: validation.category,
  });
  const preview = analyzeEngineeringRootCause({
    failureStage: 'PREVIEW',
    failureReason: 'Dev server failed to start on localhost',
  });
  checks.push({
    name: 'preview failure classified',
    passed: preview.category === 'PREVIEW',
    detail: preview.category,
  });
  return checks;
}

export function validateRecoveryStrategyEngine(): AepPhase3Check[] {
  const checks: AepPhase3Check[] = [];
  const rootCause = analyzeEngineeringRootCause({
    failureStage: 'PREVIEW',
    failureReason: 'preview server failed',
  });
  const plan = planEngineeringRecovery({
    rootCause,
    failureStage: 'PREVIEW',
    failureReason: 'preview server failed',
  });
  const strategies = generateRecoveryStrategies({ rootCause, plan });
  const selection = selectSafestRecoveryStrategy(strategies);
  checks.push({
    name: 'strategy selected with confidence',
    passed: selection.selected !== null && selection.selected.confidence > 0,
    detail: selection.selectionReason,
  });
  checks.push({
    name: 'strategy explains expected outcome',
    passed: Boolean(selection.selected?.expectedOutcome),
    detail: selection.selected?.expectedOutcome ?? 'missing',
  });
  return checks;
}

export function validateRecoveryExecutor(): AepPhase3Check[] {
  const checks: AepPhase3Check[] = [];
  const rootCause = analyzeEngineeringRootCause({
    failureStage: 'NPM_BUILD',
    failureReason: 'npm run build failed compile error',
  });
  const plan = planEngineeringRecovery({
    rootCause,
    failureStage: 'NPM_BUILD',
    failureReason: 'npm run build failed',
  });
  const strategies = generateRecoveryStrategies({ rootCause, plan });
  const selection = selectSafestRecoveryStrategy(strategies);
  if (!selection.selected) {
    checks.push({ name: 'executor has strategy', passed: false, detail: 'no strategy' });
    return checks;
  }
  const execution = executeRecoveryStrategy({
    strategy: selection.selected,
    host: { retryStage: () => ({ ok: true, detail: 'build retry ok' }) },
  });
  checks.push({
    name: 'recovery executed via host',
    passed: execution.success,
    detail: execution.detail,
  });
  return checks;
}

export function validateValidationReplay(): AepPhase3Check[] {
  const checks: AepPhase3Check[] = [];
  const replay = replayValidationAfterRecovery({
    failureStage: 'MATERIALIZATION_VALIDATION',
    failureReason: 'missing modular module files',
    recoveryExecutionId: 'exec-test-1',
    host: { replayValidation: () => ({ ok: true, detail: 'replay ok' }) },
  });
  checks.push({
    name: 'validation replay mandatory',
    passed: replay.mandatory === true,
    detail: String(replay.mandatory),
  });
  checks.push({
    name: 'validation replay passed after repair',
    passed: replay.passed,
    detail: replay.detail,
  });
  return checks;
}

export function validateEngineeringContinuation(): AepPhase3Check[] {
  const checks: AepPhase3Check[] = [];
  const continuation = continueEngineeringAfterRecovery({
    projectId: 'test-project',
    failureStage: 'NPM_INSTALL',
    recoveryExecutionId: 'exec-1',
    validationReplayId: 'replay-1',
    host: { continuePipeline: () => ({ ok: true, detail: 'continued' }) },
  });
  checks.push({
    name: 'continuation without user action',
    passed: continuation.continued && continuation.userActionRequired === false,
    detail: continuation.detail,
  });
  return checks;
}

export function validateRecoveryMemory(): AepPhase3Check[] {
  const checks: AepPhase3Check[] = [];
  resetRecoveryMemoryForTests();
  attemptEngineeringRecovery({
    projectId: 'mem-test',
    failureStage: 'VALIDATION',
    failureReason: 'validation failed proof level',
    host: {
      retryStage: () => ({ ok: true, detail: 'ok' }),
      replayValidation: () => ({ ok: true, detail: 'ok' }),
      continuePipeline: () => ({ ok: true, detail: 'ok' }),
    },
  });
  checks.push({
    name: 'recovery memory records outcome',
    passed: listRecoveryMemoryRecords().length > 0,
    detail: String(listRecoveryMemoryRecords().length),
  });
  return checks;
}

export function validateRecoveryEscalation(): AepPhase3Check[] {
  const checks: AepPhase3Check[] = [];
  const payment = attemptEngineeringRecovery({
    projectId: 'payment-test',
    failureStage: 'PLANNING',
    failureReason: 'Payment capability requires human review — unsafe evolution',
    blockers: ['Payment capability requires human review'],
  });
  checks.push({
    name: 'payment escalates at evidence boundary',
    passed: payment.escalated && payment.userActionRequired,
    detail: payment.report.finalState,
  });
  const escalation = evaluateRecoveryEscalation({
    attemptedRecoveries: [],
    attemptedStrategies: [],
    blockers: ['human review required for payment'],
  });
  checks.push({
    name: 'escalation explains human judgment',
    passed: escalation.humanJudgmentRequired,
    detail: escalation.reason,
  });
  return checks;
}

export function validateAutonomousRecoveryAuthority(): AepPhase3Check[] {
  const checks: AepPhase3Check[] = [];
  resetAutonomousRecoveryAuthorityForTests();
  resetRecoveryMemoryForTests();

  const interaction = attemptEngineeringRecovery({
    projectId: 'interaction-test',
    failureStage: 'INTERACTION_PROOF',
    failureReason: 'dead button has no handler — interaction proof failed',
    host: {
      repairEngineering: () => ({ ok: true, detail: 'handler repaired' }),
      replayValidation: () => ({ ok: true, detail: 'interaction replay pass' }),
      continuePipeline: () => ({ ok: true, detail: 'pipeline continued' }),
    },
  });
  checks.push({
    name: 'interaction failure autonomously recovered',
    passed: interaction.recovered || interaction.continued,
    detail: interaction.report.finalState,
  });

  const build = recoverBuild({
    projectId: 'build-test',
    failureReason: 'npm run build failed compile',
    host: { retryStage: () => ({ ok: true, detail: 'build ok' }) },
  });
  checks.push({
    name: 'recoverBuild routes to build stage',
    passed: build.report.failureStage === 'NPM_BUILD',
    detail: build.report.failureStage,
  });

  const registry = getDevPulseV2AutonomousRecoveryAuthority();
  checks.push({
    name: 'recovery authority registry',
    passed: registry.enforcementAuthority === true,
    detail: registry.passToken,
  });
  return checks;
}

export function validateAseIntegration(rootDir: string): AepPhase3Check[] {
  const checks: AepPhase3Check[] = [];
  const authority = readFileSync(
    join(rootDir, 'src/ase-enforcement-engine/engineering-authority.ts'),
    'utf8',
  );
  checks.push({
    name: 'ASE authority invokes autonomous recovery',
    passed: authority.includes('attemptEngineeringRecovery'),
    detail: 'ASE recovery integration',
  });
  const route = routeEngineeringRecovery({
    failedStage: 'INTERACTION_PROOF',
    failure: 'interaction proof failed dead button',
    evidenceId: null,
  });
  checks.push({
    name: 'ASE recovery router routes interaction to debugging',
    passed: route.route === 'AUTONOMOUS_DEBUGGING',
    detail: route.route,
  });
  return checks;
}

export function validateOrchestratorIntegration(rootDir: string): AepPhase3Check[] {
  const checks: AepPhase3Check[] = [];
  const orchestrator = readFileSync(
    join(rootDir, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'),
    'utf8',
  );
  checks.push({
    name: 'orchestrator uses attemptEngineeringRecovery',
    passed: orchestrator.includes('attemptEngineeringRecovery'),
    detail: 'recovery authority',
  });
  checks.push({
    name: 'orchestrator has autonomous recovery helper',
    passed: orchestrator.includes('tryAutonomousRecovery'),
    detail: 'recovery helper',
  });
  return checks;
}

export function validateModuleExistence(rootDir: string): AepPhase3Check[] {
  const modules = [
    'autonomous-recovery-authority/autonomous-recovery-authority.ts',
    'recovery-planner/recovery-planner.ts',
    'recovery-root-cause/root-cause-analyzer.ts',
    'recovery-strategy-engine/recovery-strategy-engine.ts',
    'recovery-executor/recovery-executor.ts',
    'validation-replay-engine/validation-replay-engine.ts',
    'engineering-continuation/engineering-continuation.ts',
    'recovery-memory/recovery-memory.ts',
    'recovery-escalation-authority/recovery-escalation-authority.ts',
    'recovery-report-builder/recovery-report-builder.ts',
  ];
  return modules.map((m) => ({
    name: `module exists ${m}`,
    passed: existsSync(join(rootDir, 'src', m)),
    detail: m,
  }));
}

export function runAepPhase3Validation(rootDir: string, section?: string): AepPhase3Check[] {
  switch (section) {
    case 'recovery-planner':
      return validateRecoveryPlanner();
    case 'root-cause-analysis':
      return validateRootCauseAnalysis();
    case 'recovery-strategy-engine':
      return validateRecoveryStrategyEngine();
    case 'recovery-executor':
      return validateRecoveryExecutor();
    case 'validation-replay':
      return validateValidationReplay();
    case 'engineering-continuation':
      return validateEngineeringContinuation();
    case 'recovery-memory':
      return validateRecoveryMemory();
    case 'recovery-escalation':
      return validateRecoveryEscalation();
    case 'autonomous-recovery-authority':
      return validateAutonomousRecoveryAuthority();
    default:
      return [
        ...validateModuleExistence(rootDir),
        ...validateRootCauseAnalysis(),
        ...validateRecoveryPlanner(),
        ...validateRecoveryStrategyEngine(),
        ...validateRecoveryExecutor(),
        ...validateValidationReplay(),
        ...validateEngineeringContinuation(),
        ...validateRecoveryMemory(),
        ...validateRecoveryEscalation(),
        ...validateAutonomousRecoveryAuthority(),
        ...validateAseIntegration(rootDir),
        ...validateOrchestratorIntegration(rootDir),
      ];
  }
}
