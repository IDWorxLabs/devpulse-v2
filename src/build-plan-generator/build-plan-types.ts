/**
 * Build Plan Generator — foundation types (V1).
 * Read-only execution preparation — no code generation or building.
 */

import type { ArchitectureBrief } from '../architecture-brief-generator/architecture-brief-types.js';
import type { PlanningGateAnalysis } from '../planning-gate-authority/planning-gate-types.js';
import type { PlanningBrief } from '../planning-brief-generator/planning-brief-types.js';
import type { RequirementCompletenessAnalysis } from '../requirement-completeness-intelligence/requirement-completeness-types.js';
import type { UnifiedIntakeAnalysis } from '../unified-intake-intelligence/unified-intake-types.js';

export type BuildComplexityCategory = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';

export type BuildPlanReadiness = 'NOT_READY' | 'DRAFT_BUILD_PLAN' | 'READY_FOR_EXECUTION_PLANNING';

export interface BuildPlanProjectSummary {
  readOnly: true;
  product: string;
  platforms: readonly string[];
  scope: string;
  complexity: BuildComplexityCategory;
}

export interface BuildPlanMilestone {
  readOnly: true;
  milestoneId: string;
  name: string;
  description: string;
  evidence: readonly string[];
}

export interface BuildPlanPhase {
  readOnly: true;
  phaseNumber: number;
  phaseId: string;
  name: string;
  milestoneIds: readonly string[];
  evidence: readonly string[];
}

export interface BuildPlanDependency {
  readOnly: true;
  dependencyId: string;
  fromPhaseId: string;
  toPhaseId: string;
  dependencyType: 'REQUIRED_PREREQUISITE' | 'BLOCKS' | 'CRITICAL';
  description: string;
}

export interface DependencyMap {
  readOnly: true;
  dependencies: readonly BuildPlanDependency[];
  blockedPhases: readonly string[];
  criticalDependencies: readonly string[];
}

export interface BuildPriorityItem {
  readOnly: true;
  priorityRank: number;
  itemId: string;
  label: string;
  reason: string;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  evidence: readonly string[];
}

export interface BuildPlanRiskItem {
  readOnly: true;
  riskId: string;
  category: 'HIGH_RISK_FEATURE' | 'COMPLEX_WORKFLOW' | 'UNCLEAR_REQUIREMENT' | 'INTEGRATION_RISK';
  description: string;
  evidence: readonly string[];
}

export interface BuildPlan {
  readOnly: true;
  planId: string;
  generatedAt: string;
  architectureBriefId: string;
  projectSummary: BuildPlanProjectSummary;
  milestones: readonly BuildPlanMilestone[];
  phases: readonly BuildPlanPhase[];
  dependencyMap: DependencyMap;
  buildPriorityOrder: readonly BuildPriorityItem[];
  buildPlanRisks: readonly BuildPlanRiskItem[];
  buildComplexityScore: number;
  buildComplexityCategory: BuildComplexityCategory;
  buildPlanReadiness: BuildPlanReadiness;
  buildPlanConfidence: number;
  evidenceSources: readonly string[];
}

export interface BuildPlanHistoryEntry {
  planId: string;
  timestamp: string;
  buildComplexityScore: number;
  buildComplexityCategory: BuildComplexityCategory;
  buildPlanReadiness: BuildPlanReadiness;
  buildPlanConfidence: number;
  phaseCount: number;
}

export interface BuildPlanGeneratorReport {
  readOnly: true;
  generatedAt: string;
  totalPlans: number;
  latestPlan: BuildPlan | null;
  historySummary: {
    totalPlans: number;
    averageConfidence: number;
    executionReadyCount: number;
    highComplexityCount: number;
  };
}

export interface GenerateBuildPlanInput {
  architectureBrief: ArchitectureBrief | null;
  planningBrief?: PlanningBrief | null;
  planningGateAnalysis?: PlanningGateAnalysis | null;
  unifiedIntakeAnalysis?: UnifiedIntakeAnalysis | null;
  requirementCompletenessAnalysis?: RequirementCompletenessAnalysis | null;
  skipHistoryRecording?: boolean;
}

export interface BuildPlanGeneration {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'BUILD_PLAN_GENERATOR_COMPLETE' | 'BUILD_PLAN_GENERATOR_FAILED';
  buildPlan: BuildPlan | null;
  failureReason: string | null;
}

export interface BuildPlanEvidenceBundle {
  readOnly: true;
  sources: readonly string[];
  productType: string;
  productName: string | null;
  objective: string;
  platforms: readonly string[];
  screens: readonly string[];
  workflows: readonly string[];
  userRoles: readonly string[];
  integrations: readonly string[];
  entities: readonly string[];
  hasAuth: boolean;
  hasBackgroundJobs: boolean;
  hasWorkflowOrchestration: boolean;
  architectureRisks: readonly string[];
  knownGaps: readonly string[];
  architectureReadiness: string;
}
