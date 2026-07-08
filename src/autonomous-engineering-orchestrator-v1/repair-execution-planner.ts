/**
 * Autonomous Engineering Orchestrator V1 — repair execution planner.
 *
 * Given a diagnosed failure and the repair-capability-registry, decides whether a safe,
 * production-wired repair exists, and if so what the narrowest possible retry scope is. Never
 * plans a full rebuild by default — always prefers a targeted, single-stage retry. Refuses to
 * plan automatic repair when the only matching capability is planning-only, validator-only,
 * governance-only, or simulated, when the failure class is unknown, when attempts are exhausted,
 * or when the repair could change product identity without confirmation.
 */

import type {
  AeoFailureClassification,
  AeoRepairAttemptRecord,
  AeoRepairCapabilityDefinition,
  AeoRepairPlan,
  AeoRepairPlanDecision,
} from './autonomous-engineering-orchestrator-types.js';
import { findRepairCapabilitiesForFailureClass } from './repair-capability-registry.js';

function countPriorAttempts(
  history: readonly AeoRepairAttemptRecord[],
  failureClass: string,
  capabilityId: string,
): number {
  return history.filter((a) => a.failureClass === failureClass && a.capabilityId === capabilityId && a.applied).length;
}

function candidateOrder(a: AeoRepairCapabilityDefinition, b: AeoRepairCapabilityDefinition): number {
  const wiredRank = (c: AeoRepairCapabilityDefinition): number => (c.wiringStatus === 'PRODUCTION_WIRED' && c.safeToRunAutomatically ? 0 : 1);
  const rankDiff = wiredRank(a) - wiredRank(b);
  if (rankDiff !== 0) return rankDiff;
  return b.confidence - a.confidence;
}

export interface PlanRepairInput {
  classification: AeoFailureClassification;
  attemptHistory: readonly AeoRepairAttemptRecord[];
  /** When true, the caller has already obtained explicit confirmation for identity-changing repairs. */
  productIdentityChangeConfirmed?: boolean;
}

export function planRepair(input: PlanRepairInput): AeoRepairPlan {
  const { classification } = input;
  const consideredCapabilities = [...findRepairCapabilitiesForFailureClass(classification.failureClass)].sort(candidateOrder);

  if (classification.failureClass === 'UNKNOWN_FAILURE') {
    return {
      readOnly: true,
      decision: 'REFUSE_UNKNOWN_FAILURE',
      matchedCapability: null,
      consideredCapabilities,
      retryScope: 'NONE',
      targetStage: null,
      reason: 'Failure class is UNKNOWN_FAILURE — no automatic repair may ever be attempted for an unclassified failure.',
      requiresConfirmation: false,
    };
  }

  if (consideredCapabilities.length === 0) {
    return {
      readOnly: true,
      decision: 'REFUSE_NO_SAFE_REPAIR',
      matchedCapability: null,
      consideredCapabilities,
      retryScope: 'NONE',
      targetStage: null,
      reason: `No repair capability in the registry declares it handles ${classification.failureClass}.`,
      requiresConfirmation: false,
    };
  }

  for (const candidate of consideredCapabilities) {
    const priorAttempts = countPriorAttempts(input.attemptHistory, classification.failureClass, candidate.capabilityId);

    if (candidate.wiringStatus !== 'PRODUCTION_WIRED') {
      continue;
    }
    if (!candidate.safeToRunAutomatically) {
      continue;
    }
    if (candidate.mayChangeProductIdentity && !input.productIdentityChangeConfirmed) {
      return decisionFor(
        'REFUSE_MAY_CHANGE_PRODUCT_IDENTITY',
        candidate,
        consideredCapabilities,
        `${candidate.displayName} may change product identity and no confirmation was provided — refusing to auto-run.`,
        true,
      );
    }
    if (priorAttempts >= candidate.maxAttempts) {
      return decisionFor(
        'REFUSE_MAX_ATTEMPTS_EXCEEDED',
        candidate,
        consideredCapabilities,
        `${candidate.displayName} already reached its max attempts (${candidate.maxAttempts}) for ${classification.failureClass}.`,
        false,
      );
    }

    const targetStage = candidate.affectedStages.find((s) => classification.affectedStages.includes(s)) ?? candidate.affectedStages[0] ?? null;
    return {
      readOnly: true,
      decision: 'RUN_TARGETED_REPAIR',
      matchedCapability: candidate,
      consideredCapabilities,
      retryScope: 'SINGLE_STAGE',
      targetStage,
      reason: `${candidate.displayName} is production-wired and safe to run automatically for ${classification.failureClass}. Retrying only ${targetStage ?? 'the affected stage'}.`,
      requiresConfirmation: false,
    };
  }

  // Nothing production-wired-and-safe (and attempt-budget-remaining, identity-safe) was found.
  // Report the single most specific, most honest refusal reason across every considered
  // candidate — deterministic (same input, same refusal reason), and prioritized so a clearly
  // fixable gap (planning-only / simulated) is never masked by a vaguer "not production-wired".
  const byConfidenceDesc = [...consideredCapabilities].sort((a, b) => b.confidence - a.confidence);
  const planningOnly = byConfidenceDesc.find((c) => c.wiringStatus === 'PLANNING_ONLY');
  const simulatedOnly = byConfidenceDesc.find((c) => c.wiringStatus === 'SIMULATED');
  const notProductionWired = byConfidenceDesc[0];

  if (planningOnly) {
    return decisionFor(
      'REFUSE_PLANNING_ONLY',
      planningOnly,
      consideredCapabilities,
      `${planningOnly.displayName} handles ${classification.failureClass} but is planning-only — it decides/plans, it does not apply a production repair. Refusing automatic repair.`,
      false,
    );
  }
  if (simulatedOnly) {
    return decisionFor(
      'REFUSE_SIMULATED_ONLY',
      simulatedOnly,
      consideredCapabilities,
      `${simulatedOnly.displayName} handles ${classification.failureClass} but its repair execution is simulated — it does not produce real evidence of a fix. Refusing automatic repair.`,
      false,
    );
  }
  return decisionFor(
    'REFUSE_NOT_PRODUCTION_WIRED',
    notProductionWired,
    consideredCapabilities,
    `${notProductionWired.displayName} handles ${classification.failureClass} but is ${notProductionWired.wiringStatus.toLowerCase().replace(/_/g, '-')}${notProductionWired.safeToRunAutomatically ? '' : ' and is not marked safe to run automatically'} — refusing automatic repair.`,
    false,
  );
}

function decisionFor(
  decision: AeoRepairPlanDecision,
  matched: AeoRepairCapabilityDefinition,
  consideredCapabilities: AeoRepairCapabilityDefinition[],
  reason: string,
  requiresConfirmation: boolean,
): AeoRepairPlan {
  return {
    readOnly: true,
    decision,
    matchedCapability: matched,
    consideredCapabilities,
    retryScope: 'NONE',
    targetStage: null,
    reason,
    requiresConfirmation,
  };
}
