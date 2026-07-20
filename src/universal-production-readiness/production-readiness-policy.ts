/**
 * Universal Production Readiness Verification V1 — readiness thresholds and policy.
 */

export const PRODUCTION_READINESS_POLICY = {
  criticalRequirementSatisfactionPercent: 100,
  requiredBehaviorVerificationPercent: 100,
  requiredCapabilityAssignmentPercent: 100,
  requiredMaterializationReconciliationPercent: 100,
  criticalEvidenceIntegrityPercent: 100,
  overallReadinessThreshold: 85,
  conditionalReadinessThreshold: 70,
  behavioralReadinessThreshold: 100,
  productionCoverageThreshold: 100,
  maxAllowedStaticShellsOnRequired: 0,
  maxAllowedFalseCoverageFindings: 0,
  maxAllowedMissingCriticalEvidence: 0,
} as const;

export function meetsProductionReadyThreshold(scores: {
  overallReadinessScore: number;
  behavioralReadinessScore: number;
  capabilityReadinessScore: number;
  materializationReadinessScore: number;
}): boolean {
  return (
    scores.overallReadinessScore >= PRODUCTION_READINESS_POLICY.overallReadinessThreshold &&
    scores.behavioralReadinessScore >= PRODUCTION_READINESS_POLICY.behavioralReadinessThreshold &&
    scores.capabilityReadinessScore >= PRODUCTION_READINESS_POLICY.productionCoverageThreshold &&
    scores.materializationReadinessScore >= PRODUCTION_READINESS_POLICY.requiredMaterializationReconciliationPercent
  );
}

export function criticalityBlocksReadiness(criticality: string): boolean {
  return criticality === 'CRITICAL' || criticality === 'REQUIRED';
}

export const BLOCKED_CAPABILITY_DIAGNOSTIC_MAP: Record<string, string> = {
  'authentication.session': 'blocked_by_authentication_pack',
  'authorization.rbac': 'blocked_by_authorization_pack',
  'scheduling.availability': 'blocked_by_scheduling_pack',
  'notification.email': 'blocked_by_notification_pack',
  'file.storage': 'blocked_by_file_management_pack',
  'reporting.metric': 'blocked_by_reporting_pack',
  'realtime.sync': 'blocked_by_realtime_pack',
  'export.advanced-binary': 'blocked_by_external_integration_pack',
};
