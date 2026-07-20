/**
 * Autonomous Engineering Intelligence V1 — strategy selection.
 */

import type { AutonomousEngineeringFinding, EligibilityDecision } from './autonomous-engineering-types.js';
import { findStrategiesForFinding, getRepairStrategy } from './autonomous-repair-strategy-registry.js';

const ELIGIBLE = new Set(['AUTONOMOUSLY_REPAIRABLE', 'AUTONOMOUSLY_REPAIRABLE_WITH_GUARDS', 'REQUIRES_EXISTING_GENERATOR_REEXECUTION']);

const DIAGNOSTIC_STRATEGY_MAP: Record<string, string> = {
  static_behavior_shell: 'static-shell-replacement-repair.v1',
  contribution_missing: 'missing-generated-artifact-repair.v1',
  provider_materialization_missing: 'missing-generated-artifact-repair.v1',
  pack_not_verified: 'missing-generated-artifact-repair.v1',
  required_behavior_not_executed: 'missing-action-handler-repair.v1',
  behavior_verification_failed: 'missing-verification-scenario-repair.v1',
  runtime_registration_missing: 'missing-runtime-scope-repair.v1',
  traceability_gap: 'missing-evidence-emission-repair.v1',
  composition_fingerprint_mismatch: 'composition-materialization-reconciliation-repair.v1',
};

export interface StrategySelectionResult {
  readonly findingId: string;
  readonly selectedStrategyId: string | null;
  readonly candidates: readonly { readonly strategyId: string; readonly selected: boolean; readonly rejectionReason?: string; readonly rankingScore: number }[];
}

export function selectRepairStrategy(
  finding: AutonomousEngineeringFinding,
  eligibility: EligibilityDecision,
): StrategySelectionResult {
  const candidates = findStrategiesForFinding(finding.diagnosticCode, eligibility.repairCategory);
  const mapped = DIAGNOSTIC_STRATEGY_MAP[finding.diagnosticCode];
  const ranked = candidates
    .map((c) => ({
      strategyId: c.strategyId,
      selected: false,
      rejectionReason: undefined as string | undefined,
      rankingScore: c.strategyId === mapped ? 100 : c.productionSupportStatus === 'PRODUCTION_READY' ? 80 : 60,
    }))
    .sort((a, b) => b.rankingScore - a.rankingScore || a.strategyId.localeCompare(b.strategyId));

  if (!ELIGIBLE.has(eligibility.eligibility)) {
    return {
      findingId: finding.findingId,
      selectedStrategyId: null,
      candidates: ranked.map((c) => ({ ...c, selected: false, rejectionReason: eligibility.rejectionReason ?? eligibility.eligibility })),
    };
  }

  const selectedId = mapped && getRepairStrategy(mapped) ? mapped : ranked[0]?.strategyId ?? null;
  return {
    findingId: finding.findingId,
    selectedStrategyId: selectedId,
    candidates: ranked.map((c) => ({
      ...c,
      selected: c.strategyId === selectedId,
      rejectionReason: c.strategyId === selectedId ? undefined : 'lower_rank',
    })),
  };
}
