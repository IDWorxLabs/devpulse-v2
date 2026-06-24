/**
 * Customer Operations Platform V1 — types.
 */

import type {
  CUSTOMER_STATUSES,
  PLAN_TYPES,
} from './customer-operations-platform-v1-bounds.js';

export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

export type PlanType = (typeof PLAN_TYPES)[number];

export interface CustomerAccount {
  readOnly: true;
  customerId: string;
  organizationName: string;
  ownerUserId: string;
  email: string;
  status: CustomerStatus;
  createdAt: string;
  lastActiveAt: string;
  planType: PlanType;
  tenantId: string;
}

export interface TenantRecord {
  readOnly: true;
  tenantId: string;
  customerId: string;
  organizationName: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  createdAt: string;
  isolationBoundary: string;
}

export interface CustomerProjectRecord {
  readOnly: true;
  projectId: string;
  customerId: string;
  tenantId: string;
  projectName: string;
  profile: string;
  buildHistoryCount: number;
  launchHistoryCount: number;
  productionHistoryCount: number;
  world2HistoryCount: number;
  createdAt: string;
}

export interface OnboardingMetrics {
  readOnly: true;
  signupCount: number;
  verificationComplete: number;
  tenantCreated: number;
  workspaceProvisioned: number;
  firstProjectCreated: number;
  activated: number;
  completionPercent: number;
  activationRate: number;
  averageTimeToFirstProjectHours: number;
}

export interface CustomerUsageMetrics {
  readOnly: true;
  customerId: string;
  tenantId: string;
  projectsCreated: number;
  buildsExecuted: number;
  verificationsExecuted: number;
  world2Executions: number;
  concurrentExecutions: number;
  productionDeployments: number;
}

export interface PlanDefinition {
  readOnly: true;
  planType: PlanType;
  monthlyProjectLimit: number;
  monthlyBuildLimit: number;
  concurrentExecutionLimit: number;
  world2ExecutionLimit: number;
  upgradePath: PlanType | null;
}

export interface IsolationViolation {
  readOnly: true;
  violationId: string;
  violationType:
    | 'cross_tenant_project'
    | 'cross_tenant_artifact'
    | 'cross_tenant_execution'
    | 'cross_tenant_proof';
  detail: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface TenantIsolationAssessment {
  readOnly: true;
  generatedAt: string;
  isolationViolations: number;
  isolationProven: boolean;
  violations: readonly IsolationViolation[];
  checksPerformed: readonly string[];
}

export interface SupportIncident {
  readOnly: true;
  incidentId: string;
  customerId: string;
  tenantId: string;
  category: 'customer_incident' | 'support_request' | 'platform_issue';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  detail: string;
  createdAt: string;
}

export interface CustomerOperationsPlatformAssessment {
  readOnly: true;
  advisoryOnly: true;
  canonicalOwner: 'Customer Operations Platform V1';
  passToken: string;
  version: 'V1';
  generatedAt: string;
  customersRegistered: number;
  tenantsActive: number;
  projectsRegistered: number;
  onboardingProven: boolean;
  tenantIsolationProven: boolean;
  projectOwnershipProven: boolean;
  usageTrackingProven: boolean;
  subscriptionReadinessProven: boolean;
  executionTaggingProven: boolean;
  platformProofStatus: 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN';
  customerRegistry: readonly CustomerAccount[];
  tenantRegistry: readonly TenantRecord[];
  projectOwnership: readonly CustomerProjectRecord[];
  usageTracking: readonly CustomerUsageMetrics[];
  onboardingMetrics: OnboardingMetrics;
  subscriptionPlans: readonly PlanDefinition[];
  tenantIsolation: TenantIsolationAssessment;
  supportRegistry: readonly SupportIncident[];
  commercializationImpact: {
    readOnly: true;
    priorCommercializationScore: number;
    projectedCommercializationScore: number;
    customerOnboardingDimensionScore: number;
    customerOperationsGapClosed: boolean;
  };
}
