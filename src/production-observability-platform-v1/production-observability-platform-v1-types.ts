/**
 * Production Observability Platform V1 — types.
 */

export type ApplicationHealthStatus =
  | 'HEALTHY'
  | 'DEGRADED'
  | 'WARNING'
  | 'CRITICAL'
  | 'OFFLINE';

export type DeploymentEnvironment = 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentStatus = 'OPEN' | 'ESCALATED' | 'RESOLVED';

export interface ProductionApplicationHealth {
  readOnly: true;
  applicationId: string;
  tenantId: string;
  customerId: string;
  projectId: string;
  applicationName: string;
  status: ApplicationHealthStatus;
  uptimePercent: number;
  availabilityScore: number;
  errorRate: number;
  latencyScore: number;
  deploymentStatus: 'DEPLOYED' | 'DEPLOYING' | 'FAILED' | 'ROLLED_BACK';
  lastObservedAt: string;
}

export interface DeploymentRecord {
  readOnly: true;
  deploymentId: string;
  projectId: string;
  tenantId: string;
  customerId: string;
  environment: DeploymentEnvironment;
  version: string;
  deployedAt: string;
  deploymentHealth: ApplicationHealthStatus;
  rollbackAvailable: boolean;
}

export interface RuntimeMetricsSnapshot {
  readOnly: true;
  applicationId: string;
  responseTimeMs: number;
  errorRate: number;
  availabilityPercent: number;
  deploymentSuccess: boolean;
  crashCount: number;
  recoveryCount: number;
}

export interface AvailabilityAssessment {
  readOnly: true;
  generatedAt: string;
  uptime24h: number;
  uptime7d: number;
  uptime30d: number;
  availabilityRating: 'Excellent' | 'Healthy' | 'Warning' | 'Critical';
  overallAvailabilityScore: number;
}

export interface ProductionIncident {
  readOnly: true;
  incidentId: string;
  applicationId: string;
  tenantId: string;
  customerId: string;
  projectId: string;
  environment: DeploymentEnvironment;
  severity: IncidentSeverity;
  status: IncidentStatus;
  incidentType:
    | 'application_offline'
    | 'error_spike'
    | 'deployment_regression'
    | 'repeated_failure'
    | 'availability_degradation';
  detail: string;
  affectedCustomers: readonly string[];
  unifiedFailureEscalationEligible: true;
  detectedAt: string;
}

export interface ProductionIncidentRegistrySnapshot {
  readOnly: true;
  totalIncidents: number;
  openIncidents: number;
  resolvedIncidents: number;
  escalatedIncidents: number;
  customerImpactCount: number;
  incidents: readonly ProductionIncident[];
}

export interface OperationalRecoveryRecommendation {
  readOnly: true;
  recommendationId: string;
  incidentId: string;
  action:
    | 'Rollback deployment'
    | 'Rebuild deployment'
    | 'Increase validation frequency'
    | 'Launch World2 investigation'
    | 'Escalate to operator';
  rationale: string;
  autonomousModificationAllowed: false;
}

export interface ProductionObservabilityPlatformAssessment {
  readOnly: true;
  advisoryOnly: true;
  canonicalOwner: 'Production Observability Platform V1';
  passToken: string;
  version: 'V1';
  generatedAt: string;
  applicationsObserved: number;
  deploymentsTracked: number;
  applicationHealthProven: boolean;
  deploymentTrackingProven: boolean;
  availabilityMonitoringProven: boolean;
  incidentDetectionProven: boolean;
  customerImpactTrackingProven: boolean;
  recoveryRecommendationsProven: boolean;
  tenantIsolationProven: boolean;
  unifiedFailureEscalationFeedProven: boolean;
  observabilityProofStatus: 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN';
  applicationHealth: readonly ProductionApplicationHealth[];
  deploymentRegistry: readonly DeploymentRecord[];
  runtimeMetrics: readonly RuntimeMetricsSnapshot[];
  availabilityAssessment: AvailabilityAssessment;
  incidentRegistry: ProductionIncidentRegistrySnapshot;
  recoveryRecommendations: readonly OperationalRecoveryRecommendation[];
  commercializationImpact: {
    readOnly: true;
    priorCommercializationScore: number;
    projectedCommercializationScore: number;
    operationalMonitoringDimensionScore: number;
    productionObservabilityGapClosed: boolean;
  };
  auditImpact: {
    readOnly: true;
    generatedAt: string;
    strategicAuditShouldReport: string;
    capabilityAuditObservedApplications: number;
  };
}
