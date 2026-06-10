/**
 * Verification Integration — plan coordination pipeline.
 */

import type { VerificationStrategyDecision, VerificationStrategyInput } from '../verification-strategy-core/verification-strategy-types.js';
import { decideVerificationStrategy } from '../verification-strategy-core/index.js';
import { generateVerificationPlanFromStrategy } from '../verification-intelligence/index.js';
import type { VerificationPlan } from '../verification-intelligence/verification-plan-types.js';
import type {
  VerificationIntegrationRecord,
  VerificationPlanReport,
  VerificationReadinessModel,
  VerificationVisibilityModel,
} from './verification-integration-types.js';
import { registerVerificationPlan } from './verification-plan-registration.js';
import { generateVerificationPlanReport } from './verification-plan-reporting.js';
import { evaluateVerificationReadiness } from './verification-plan-readiness.js';
import { getVerificationVisibilityModel } from './verification-plan-visibility.js';
import { recordVerificationHistory } from './verification-plan-history.js';
import { createVerificationSnapshot } from './verification-plan-snapshot.js';
import type { VerificationFullSnapshot } from './verification-plan-snapshot.js';

export interface VerificationCoordinationResult {
  strategy: VerificationStrategyDecision;
  plan: VerificationPlan;
  record: VerificationIntegrationRecord;
  readiness: VerificationReadinessModel;
  visibility: VerificationVisibilityModel;
  report: VerificationPlanReport;
  snapshot: VerificationFullSnapshot;
}

export function coordinateVerificationPlan(
  strategyInput: VerificationStrategyInput,
  trustScore: number | null = strategyInput.trustScore,
): VerificationCoordinationResult {
  const strategy = decideVerificationStrategy(strategyInput);
  const plan = generateVerificationPlanFromStrategy(strategyInput);
  const record = registerVerificationPlan(plan);
  const readiness = evaluateVerificationReadiness(plan, trustScore);
  const visibility = getVerificationVisibilityModel(plan, readiness);
  const report = generateVerificationPlanReport(plan);
  recordVerificationHistory(plan, readiness);
  const snapshot = createVerificationSnapshot(strategy, plan, readiness, visibility, report);

  return { strategy, plan, record, readiness, visibility, report, snapshot };
}
