/**
 * DevPulse V2 constitutional validator — machine-checkable law enforcement.
 */

import {
  DEV_PULSE_V2_LAWS,
  isConnectModulePath,
  isHiddenExecutionPath,
  isProtectedLawPath,
} from './law-registry.js';
import { assertSingleSourceOfTruth } from './ownership-registry.js';
import { assertAllSystemsAllowedInPhase } from './phase-gate.js';
import type {
  ConstitutionalValidationInput,
  ConstitutionalValidationResult,
  Violation,
  Warning,
} from './types.js';

function violation(
  partial: Omit<Violation, 'riskLevel'> & { riskLevel?: Violation['riskLevel'] },
): Violation {
  return { riskLevel: 'high', ...partial };
}

function warning(partial: Warning): Warning {
  return partial;
}

export function runDevPulseV2ConstitutionalValidation(
  input: ConstitutionalValidationInput,
): ConstitutionalValidationResult {
  const violations: Violation[] = [];
  const warnings: Warning[] = [];
  const phase = input.phase ?? 1;
  const buildStage = input.buildStage ?? 'phase1_impl';

  // --- Startup & performance budgets ---
  if (
    input.eagerModuleCount !== undefined &&
    input.eagerModuleCount > DEV_PULSE_V2_LAWS.maxEagerModules
  ) {
    violations.push(
      violation({
        code: 'EAGER_MODULE_LIMIT_EXCEEDED',
        message: `Eager module count ${input.eagerModuleCount} exceeds maximum ${DEV_PULSE_V2_LAWS.maxEagerModules}.`,
        lawReference: 'DEVPULSE_V2_STARTUP_LAWS',
        recommendedAction: 'Lazy-load modules beyond Phase 0 manifest. Extract or defer excess modules.',
        riskLevel: 'critical',
      }),
    );
  }

  if (
    input.startupBudgetMs !== undefined &&
    input.startupBudgetMs > DEV_PULSE_V2_LAWS.startupBudgetMs
  ) {
    violations.push(
      violation({
        code: 'STARTUP_BUDGET_EXCEEDED',
        message: `Startup budget ${input.startupBudgetMs}ms exceeds ${DEV_PULSE_V2_LAWS.startupBudgetMs}ms.`,
        lawReference: 'DEVPULSE_V2_STARTUP_LAWS',
        recommendedAction: 'Defer non-critical work to Task Governor background tiers.',
        riskLevel: 'critical',
      }),
    );
  }

  if (
    input.firstClickableBudgetMs !== undefined &&
    input.firstClickableBudgetMs > DEV_PULSE_V2_LAWS.firstClickableBudgetMs
  ) {
    violations.push(
      violation({
        code: 'CLICKABILITY_BUDGET_EXCEEDED',
        message: `First-clickable budget ${input.firstClickableBudgetMs}ms exceeds ${DEV_PULSE_V2_LAWS.firstClickableBudgetMs}ms.`,
        lawReference: 'DEVPULSE_V2_STARTUP_LAWS',
        recommendedAction: 'Remove sync work from startup critical path. Shell must be interactive within 2s.',
        riskLevel: 'critical',
      }),
    );
  }

  // --- Answer authority singularity ---
  if (DEV_PULSE_V2_LAWS.singleAnswerAuthority && input.answerAuthorities) {
    const unique = [...new Set(input.answerAuthorities.filter(Boolean))];
    if (unique.length > 1) {
      violations.push(
        violation({
          code: 'DUPLICATE_ANSWER_AUTHORITY',
          message: `Multiple answer authorities detected: ${unique.join(', ')}`,
          lawReference: 'DEVPULSE_V2_OWNERSHIP_LAWS',
          recommendedAction:
            'Remove competing intelligence paths. One module owns final answers (Law O-2).',
          riskLevel: 'critical',
        }),
      );
    }
  }

  // --- Source of truth ---
  if (DEV_PULSE_V2_LAWS.singleSourceOfTruth && input.truthSources) {
    violations.push(...assertSingleSourceOfTruth(input.truthSources));
  }

  // --- Operator feed singularity ---
  if (DEV_PULSE_V2_LAWS.operatorFeedInlineRequired && input.operatorFeedOwners) {
    const unique = [...new Set(input.operatorFeedOwners.filter(Boolean))];
    if (unique.length > 1) {
      violations.push(
        violation({
          code: 'DUPLICATE_OPERATOR_FEED',
          message: `Multiple operator feed owners: ${unique.join(', ')}`,
          lawReference: 'DEVPULSE_V2_OWNERSHIP_LAWS',
          recommendedAction: 'Single feed writer and inline renderer (Law O-5).',
          riskLevel: 'critical',
        }),
      );
    }
  }

  // --- Connect modules ---
  if (DEV_PULSE_V2_LAWS.connectModulesForbidden) {
    const paths = [
      ...(input.connectModulePaths ?? []),
      ...(input.modulePaths ?? []).filter(isConnectModulePath),
    ];

    for (const path of paths) {
      violations.push(
        violation({
          code: 'CONNECT_MODULE_FORBIDDEN',
          message: `Connect-module pattern detected: ${path}`,
          lawReference: 'DEVPULSE_V2_GROWTH_PROTECTION_LAWS',
          recommendedAction: 'Extract owned module or reject. Connect-module pattern is prohibited.',
          riskLevel: 'critical',
        }),
      );
    }
  }

  // --- Hidden execution paths ---
  const hiddenPaths = [
    ...(input.hiddenExecutionPaths ?? []),
    ...(input.modulePaths ?? []).filter(isHiddenExecutionPath),
  ];

  for (const path of hiddenPaths) {
    violations.push(
      violation({
        code: 'HIDDEN_EXECUTION_PATH',
        message: `Hidden or validator-only execution path detected: ${path}`,
        lawReference: 'DEVPULSE_V2_SYSTEM_LAWS',
        recommendedAction:
          'Remove shadow paths. Validator entry must equal browser entry (Law S-9).',
        riskLevel: 'critical',
      }),
    );
  }

  // --- Diagnostics blocking ---
  if (
    DEV_PULSE_V2_LAWS.diagnosticsCannotBlockChat &&
    input.diagnosticsOnStartupPath === true
  ) {
    violations.push(
      violation({
        code: 'DIAGNOSTICS_BLOCK_STARTUP',
        message: 'Diagnostics registered on startup critical path.',
        lawReference: 'DEVPULSE_V2_STARTUP_LAWS',
        recommendedAction: 'Move diagnostics to Phase 3 background tier. No audit may block startup.',
        riskLevel: 'critical',
      }),
    );
  }

  if (
    DEV_PULSE_V2_LAWS.chatBeforeDiagnostics &&
    input.diagnosticsOnStartupPath === true
  ) {
    violations.push(
      violation({
        code: 'CHAT_NOT_BEFORE_DIAGNOSTICS',
        message: 'Diagnostics would run before chat is usable.',
        lawReference: 'DEVPULSE_V2_STARTUP_LAWS',
        recommendedAction: 'Chat must be usable before any diagnostic executes.',
        riskLevel: 'high',
      }),
    );
  }

  // --- Phase 1 forbidden systems ---
  if (input.systems && phase === 1) {
    const phaseResults = assertAllSystemsAllowedInPhase(input.systems, phase);
    for (const result of phaseResults) {
      if (!result.allowed && result.violation) {
        violations.push(result.violation);
      }
    }
  }

  // --- Browser verification supreme ---
  if (DEV_PULSE_V2_LAWS.browserRealitySupreme) {
    if (input.browserVerificationPresent === false) {
      const item =
        buildStage === 'foundation'
          ? warning({
              code: 'BROWSER_VERIFICATION_MISSING',
              message: 'Browser verification harness not yet present.',
              lawReference: 'DEVPULSE_V2_SYSTEM_LAWS',
              recommendedAction: 'Add browser verification harness before Phase 1 implementation merge.',
            })
          : null;

      if (item) {
        warnings.push(item);
      } else {
        violations.push(
          violation({
            code: 'BROWSER_VERIFICATION_REQUIRED',
            message: 'Browser verification required for build approval.',
            lawReference: 'DEVPULSE_V2_SYSTEM_LAWS',
            recommendedAction:
              'Include browser_verification_harness and run browser tests before merge.',
            riskLevel: 'critical',
          }),
        );
      }
    }
  }

  // --- World 2 law modification ---
  if (DEV_PULSE_V2_LAWS.world2CannotModifyLaw && input.world2LawModificationAttempt) {
    const modifiedPaths = (input.modulePaths ?? []).filter(isProtectedLawPath);
    violations.push(
      violation({
        code: 'WORLD2_LAW_MODIFICATION_FORBIDDEN',
        message: `World 2 or automated system attempted to modify constitutional law${modifiedPaths.length ? `: ${modifiedPaths.join(', ')}` : ''}.`,
        lawReference: 'DEVPULSE_V2_WORLD2_LAWS',
        recommendedAction: 'Law documents are human-amended only. Revert automated changes.',
        riskLevel: 'critical',
      }),
    );
  }

  const passed = violations.length === 0;
  const summary = passed
    ? `Constitutional validation passed (${warnings.length} warning(s)).`
    : `Constitutional validation failed: ${violations.length} violation(s), ${warnings.length} warning(s).`;

  return {
    passed,
    violationCount: violations.length,
    violations,
    warnings,
    summary,
  };
}
