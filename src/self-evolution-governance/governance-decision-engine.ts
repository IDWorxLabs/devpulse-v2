/**
 * Self Evolution Governance — decision pipeline.
 */

import type {
  SelfEvolutionGovernanceDecision,
  SelfEvolutionGovernanceInput,
  SelfEvolutionGovernanceRecord,
  SelfEvolutionGovernanceResult,
} from './self-evolution-governance-types.js';
import { validateGovernanceBoundaries } from './governance-boundary-validator.js';
import { evaluateGovernanceRisk } from './governance-risk-evaluator.js';
import { evaluateGovernanceTrust } from './governance-trust-evaluator.js';
import { evaluateGovernanceApproval } from './governance-approval-evaluator.js';
import { validateGovernanceRollback } from './governance-rollback-validator.js';
import { validateSelfModification } from './governance-self-modification-validator.js';
import { evaluateGovernanceReadiness, validateGovernanceStallProtection } from './governance-readiness-evaluator.js';
import { registerGovernanceRecord } from './self-evolution-governance-registry.js';
import { generateGovernanceReport } from './governance-reporting.js';
import { recordGovernanceHistory } from './governance-history.js';

let governanceCounter = 0;

export function buildGovernanceDecision(input: SelfEvolutionGovernanceInput): SelfEvolutionGovernanceResult {
  const boundaries = validateGovernanceBoundaries(input);
  const risk = evaluateGovernanceRisk(input);
  const trust = evaluateGovernanceTrust(input);
  const approval = evaluateGovernanceApproval(input, risk);
  const rollback = validateGovernanceRollback(input);
  const selfModification = validateSelfModification(input);
  const stall = validateGovernanceStallProtection(input);
  const readiness = evaluateGovernanceReadiness(input, boundaries, risk, trust, rollback, selfModification, stall);

  let decision: SelfEvolutionGovernanceDecision = 'APPROVED';

  const selfModAttempt = (input.signals ?? []).some((s) => s.startsWith('selfmod:'));

  if (selfModAttempt) {
    decision = 'SELF_MODIFICATION_BLOCKED';
  } else if (!boundaries.compliant || risk.riskLevel === 'CRITICAL' || input.signals?.includes('governance:blocked')) {
    decision = 'BLOCKED';
  } else if (rollback.missingRollback || !rollback.valid) {
    decision = 'ROLLBACK_REVIEW_REQUIRED';
  } else if (approval.requirement === 'FOUNDER_REVIEW_REQUIRED') {
    decision = 'FOUNDER_REVIEW_REQUIRED';
  } else if (approval.requirement === 'TRUST_REVIEW_REQUIRED' || trust.trustScore < 60) {
    decision = 'TRUST_REVIEW_REQUIRED';
  } else if (!stall.complete || readiness.state === 'REQUIRES_REVIEW') {
    decision = 'FOUNDER_REVIEW_REQUIRED';
  } else if (readiness.state === 'BLOCKED') {
    decision = 'BLOCKED';
  }

  governanceCounter += 1;

  const record: SelfEvolutionGovernanceRecord = {
    governanceId: `governance-${governanceCounter}`,
    decision,
    trustScore: trust.trustScore,
    riskScore: risk.riskScore,
    readinessScore: readiness.readinessScore,
    createdAt: Date.now(),
  };

  registerGovernanceRecord(record);
  const report = generateGovernanceReport(record, {
    boundaries,
    risk,
    trust,
    approval,
    rollback,
    selfModification,
    stall,
    readiness,
  });
  recordGovernanceHistory(record, readiness);

  return { record, report };
}

export function resetGovernanceDecisionEngineForTests(): void {
  governanceCounter = 0;
}
