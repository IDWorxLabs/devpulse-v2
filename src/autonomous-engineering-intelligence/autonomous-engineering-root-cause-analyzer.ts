/**
 * Autonomous Engineering Intelligence V1 — deterministic root-cause analysis.
 */

import type { AutonomousEngineeringFinding, RootCauseCode } from './autonomous-engineering-types.js';

const CODE_TO_ROOT: Record<string, RootCauseCode> = {
  static_behavior_shell: 'STATIC_FALLBACK_REPLACED_RUNTIME',
  contribution_missing: 'GENERATOR_DID_NOT_EMIT',
  undeclared_contribution: 'GENERATOR_OUTPUT_DROPPED',
  provider_materialization_missing: 'GENERATOR_DID_NOT_EMIT',
  behavior_verification_failed: 'VERIFICATION_PLAN_INCOMPLETE',
  required_behavior_not_executed: 'HANDLER_NOT_CONNECTED',
  runtime_registration_missing: 'RUNTIME_NOT_CONNECTED',
  pack_not_verified: 'GENERATOR_DID_NOT_EMIT',
  composition_fingerprint_mismatch: 'PIPELINE_INPUT_MISMATCH',
  traceability_gap: 'COVERAGE_RECONCILIATION_INCOMPLETE',
  contribution_collision: 'IDENTIFIER_COLLISION',
  blocked_by_authentication_pack: 'CAPABILITY_NOT_IMPLEMENTED',
  blocked_by_authorization_pack: 'CAPABILITY_NOT_IMPLEMENTED',
  blocked_by_scheduling_pack: 'CAPABILITY_NOT_IMPLEMENTED',
  blocked_by_notification_pack: 'CAPABILITY_NOT_IMPLEMENTED',
  blocked_by_file_management_pack: 'CAPABILITY_NOT_IMPLEMENTED',
  blocked_by_reporting_pack: 'CAPABILITY_NOT_IMPLEMENTED',
  blocked_by_external_integration_pack: 'CAPABILITY_NOT_IMPLEMENTED',
  blocked_by_realtime_pack: 'CAPABILITY_NOT_IMPLEMENTED',
  blocked_by_offline_pack: 'CAPABILITY_NOT_IMPLEMENTED',
  required_capability_blocked: 'CAPABILITY_NOT_IMPLEMENTED',
  false_capability_coverage: 'COVERAGE_RECONCILIATION_INCOMPLETE',
  production_coverage_incomplete: 'COVERAGE_RECONCILIATION_INCOMPLETE',
  contract_concept_missing_from_feature_contract: 'PIPELINE_INPUT_MISMATCH',
  approved_module_missing_from_envelope: 'PIPELINE_INPUT_MISMATCH',
};

export function analyzeRootCause(finding: AutonomousEngineeringFinding): RootCauseCode {
  if (finding.contradictionEvidence.length > 0) return 'CONSTITUTIONAL_INPUT_INVALID';
  if (finding.missingEvidence.length > 0) return 'EVIDENCE_ADAPTER_MISSING';
  const mapped = CODE_TO_ROOT[finding.diagnosticCode];
  if (mapped) return mapped;
  // Generic structural fallbacks — keep new pack/coverage diagnostic codes classifiable.
  if (/^blocked_by_|_blocked$|capability_blocked/i.test(finding.diagnosticCode)) {
    return 'CAPABILITY_NOT_IMPLEMENTED';
  }
  if (/coverage|reconciliation/i.test(finding.diagnosticCode)) {
    return 'COVERAGE_RECONCILIATION_INCOMPLETE';
  }
  if (/missing_from_envelope|pipeline_input|envelope_mismatch/i.test(finding.diagnosticCode)) {
    return 'PIPELINE_INPUT_MISMATCH';
  }
  return 'UNKNOWN_ROOT_CAUSE';
}
