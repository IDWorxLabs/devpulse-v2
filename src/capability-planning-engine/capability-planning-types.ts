/**
 * Capability Planning Engine — types and models.
 * Planning only — no capability creation.
 */

import type { DuplicateRisk } from '../capability-research-engine/capability-research-types.js';

export const CAPABILITY_PLANNING_ENGINE_PASS_TOKEN = 'CAPABILITY_PLANNING_ENGINE_V1_PASS';
export const CAPABILITY_PLANNING_ENGINE_OWNER_MODULE = 'devpulse_v2_capability_planning_engine';
export const DEFAULT_MAX_PLANNING_HISTORY_SIZE = 128;

export type CapabilityPlanType =
  | 'NEW_CAPABILITY'
  | 'CAPABILITY_EXPANSION'
  | 'OPTIMIZATION'
  | 'DIAGNOSTIC'
  | 'REFACTOR'
  | 'RESEARCH_EXTENSION';

export type CapabilityApprovalRequirement =
  | 'NONE'
  | 'FOUNDER_REVIEW'
  | 'HIGH_RISK_REVIEW';

export type VerificationDepth =
  | 'QUICK'
  | 'STANDARD'
  | 'DEEP'
  | 'TRUST_RECOVERY';

export type ImpactLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface CapabilityPlan {
  planId: string;
  planType: CapabilityPlanType;
  capabilityDomain: string;
  approvalRequirement: CapabilityApprovalRequirement;
  confidence: number;
  createdAt: number;
}

export interface CapabilityPlanningInput {
  projectId?: string;
  proposedCapability: string;
  capabilityDomain?: string;
  researchDecision?: string;
  subsystem?: string;
  signals?: string[];
  trustImpact?: boolean;
  world2Impact?: boolean;
}

export interface CapabilityScopePlan {
  moduleType: 'new_module' | 'extension_module';
  integrationPoints: string[];
  ownershipBoundaries: string[];
  monolithAvoidance: true;
}

export interface CapabilityImpactAnalysis {
  impactScore: number;
  impactLevel: ImpactLevel;
  affectedSystems: string[];
}

export interface CapabilityRiskAnalysis {
  riskScore: number;
  riskLevel: RiskLevel;
  factors: string[];
}

export interface CapabilityVerificationPlan {
  depth: VerificationDepth;
  requirements: string[];
}

export interface CapabilityDependencyPlan {
  requiredSystems: string[];
  requiredIntegrations: string[];
  missingDependencies: string[];
  dependencyOrder: string[];
  cycleDetected: boolean;
  unsafeDependency: boolean;
}

export interface CapabilityApprovalPlan {
  requirement: CapabilityApprovalRequirement;
  reasons: string[];
}

export interface CapabilityPlanningReport {
  reportId: string;
  planId: string;
  planType: CapabilityPlanType;
  capabilityDomain: string;
  scope: CapabilityScopePlan;
  impact: CapabilityImpactAnalysis;
  risk: CapabilityRiskAnalysis;
  dependencies: CapabilityDependencyPlan;
  approval: CapabilityApprovalPlan;
  verification: CapabilityVerificationPlan;
  duplicateRisk: DuplicateRisk;
  blocked: boolean;
  blockReason?: string;
  recommendedAction: string;
  generatedAt: number;
}

export interface CapabilityPlanHistoryEntry {
  historyId: string;
  planId: string;
  planType: CapabilityPlanType;
  approvalRequirement: CapabilityApprovalRequirement;
  recordedAt: number;
}

export interface CapabilityPlanningRuntimeReport {
  plansCreated: number;
  impactAnalyses: number;
  riskAnalyses: number;
  dependencyAnalyses: number;
  approvalDecisions: number;
  duplicateDetections: number;
  cacheHits: number;
  cacheMisses: number;
  bootstrapReuseCount: number;
}

export interface CapabilityPlanResult {
  plan: CapabilityPlan | null;
  report: CapabilityPlanningReport;
  blocked: boolean;
  duplicateRisk: DuplicateRisk;
}

export const PLANNING_QUESTION_SIGNALS = [
  'capability planning',
  'capability plan',
  'plan new capability',
  'founder approval',
  'duplicate capability plan',
] as const;

export function isCapabilityPlanningQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return PLANNING_QUESTION_SIGNALS.some((s) => lower.includes(s));
}
