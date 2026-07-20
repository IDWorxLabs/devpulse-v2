/**
 * Autonomous Engineering Intelligence V1 — repair eligibility classification.
 */

import type { AutonomousEngineeringFinding, EligibilityDecision, RepairCategory, RepairEligibility } from './autonomous-engineering-types.js';
import { analyzeRootCause } from './autonomous-engineering-root-cause-analyzer.js';
import { classifyRepairSafety } from './autonomous-repair-safety-classifier.js';

const NEW_CAPABILITY_DIAGNOSTICS = new Set([
  'blocked_by_authentication_pack',
  'blocked_by_authorization_pack',
  'blocked_by_scheduling_pack',
  'blocked_by_notification_pack',
  'blocked_by_file_management_pack',
  'blocked_by_reporting_pack',
  'blocked_by_external_integration_pack',
  'blocked_by_realtime_pack',
]);

const DIAGNOSTIC_TO_CATEGORY: Record<string, RepairCategory> = {
  static_behavior_shell: 'STATIC_SHELL_REPLACEMENT',
  contribution_missing: 'MISSING_ARTIFACT',
  undeclared_contribution: 'UNDECLARED_CONTRIBUTION',
  provider_materialization_missing: 'MISSING_ARTIFACT',
  required_behavior_not_executed: 'MISSING_HANDLER',
  behavior_verification_failed: 'MISSING_VERIFICATION_SCENARIO',
  runtime_registration_missing: 'MISSING_RUNTIME_SCOPE',
  pack_not_verified: 'MISSING_ARTIFACT',
  composition_fingerprint_mismatch: 'MATERIALIZATION_MISMATCH',
  traceability_gap: 'MISSING_TRACEABILITY_LINK',
  evidence_missing: 'MISSING_EVIDENCE_EMISSION',
};

export function classifyRepairEligibility(finding: AutonomousEngineeringFinding): EligibilityDecision {
  const rootCause = analyzeRootCause(finding);
  const repairCategory = DIAGNOSTIC_TO_CATEGORY[finding.diagnosticCode] ?? 'CUSTOM_EXTENSION_REQUIRED';
  const safetyClassification = classifyRepairSafety(finding, repairCategory);

  let eligibility: RepairEligibility;
  let rejectionReason: string | undefined;

  if (NEW_CAPABILITY_DIAGNOSTICS.has(finding.diagnosticCode)) {
    eligibility = finding.diagnosticCode.includes('pack') ? 'REQUIRES_NEW_CAPABILITY_PACK' : 'REQUIRES_NEW_CAPABILITY';
    rejectionReason = 'capability_not_implemented';
  } else if (finding.diagnosticCode === 'required_capability_blocked') {
    eligibility = 'REQUIRES_NEW_CAPABILITY';
    rejectionReason = 'capability_not_implemented';
  } else if (finding.diagnosticCode === 'required_capability_unassigned') {
    eligibility = 'REQUIRES_NEW_CAPABILITY';
    rejectionReason = 'capability_not_implemented';
  } else if (rootCause === 'UNKNOWN_ROOT_CAUSE') {
    eligibility = 'UNSAFE_FOR_AUTONOMOUS_REPAIR';
    rejectionReason = 'unknown_root_cause';
  } else if (rootCause === 'CAPABILITY_NOT_IMPLEMENTED' || rootCause === 'PROVIDER_NOT_IMPLEMENTED') {
    eligibility = 'REQUIRES_NEW_CAPABILITY';
    rejectionReason = 'provider_not_implemented';
  } else if (finding.diagnosticCode === 'composition_fingerprint_mismatch') {
    eligibility = 'BLOCKED_BY_CONTRADICTION';
    rejectionReason = 'contradictory_evidence';
  } else if (finding.diagnosticCode === 'static_behavior_shell') {
    eligibility = 'AUTONOMOUSLY_REPAIRABLE';
  } else if (['contribution_missing', 'provider_materialization_missing', 'pack_not_verified'].includes(finding.diagnosticCode)) {
    eligibility = 'REQUIRES_EXISTING_GENERATOR_REEXECUTION';
  } else if (['required_behavior_not_executed', 'behavior_verification_failed'].includes(finding.diagnosticCode)) {
    eligibility = 'AUTONOMOUSLY_REPAIRABLE_WITH_GUARDS';
  } else if (finding.diagnosticCode === 'runtime_registration_missing') {
    eligibility = 'AUTONOMOUSLY_REPAIRABLE';
  } else if (finding.diagnosticCode === 'traceability_gap') {
    eligibility = 'AUTONOMOUSLY_REPAIRABLE';
  } else if (finding.diagnosticCode === 'evidence_missing') {
    eligibility = 'AUTONOMOUSLY_REPAIRABLE';
  } else if (safetyClassification === 'FORBIDDEN' || safetyClassification === 'HIGH_RISK_REQUIRES_HUMAN') {
    eligibility = 'UNSAFE_FOR_AUTONOMOUS_REPAIR';
    rejectionReason = 'unsafe_autonomous_repair';
  } else {
    eligibility = 'NOT_APPLICABLE';
    rejectionReason = 'not_repairable_in_c1_v1';
  }

  return { findingId: finding.findingId, eligibility, repairCategory, rootCause, safetyClassification, rejectionReason };
}

export function classifyRepairEligibilityBatch(findings: readonly AutonomousEngineeringFinding[]): EligibilityDecision[] {
  return findings.map(classifyRepairEligibility);
}
