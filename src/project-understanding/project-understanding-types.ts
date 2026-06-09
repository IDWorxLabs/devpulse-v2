/**
 * DevPulse V2 Phase 11.4 — Project Understanding types.
 */

export const PROJECT_UNDERSTANDING_ENGINE_PASS_TOKEN =
  'DEVPULSE_V2_PROJECT_UNDERSTANDING_ENGINE_V1_PASS';
export const PROJECT_UNDERSTANDING_ENGINE_OWNER_MODULE =
  'devpulse_v2_project_understanding_engine';

export type ProjectStatus = 'FOUNDATION_BUILDING' | 'ACTIVE' | 'BLOCKED' | 'COMPLETE';

export interface ProjectProfile {
  projectId: string;
  name: string;
  summary: string;
  currentPhase: string;
  goal: string;
  status: ProjectStatus;
  completedMilestones: string[];
  missingCapabilities: string[];
  blockedItems: string[];
  relatedSystems: string[];
  riskItems: string[];
  nextRecommendedStep: string;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectStatusSummary {
  projectId: string;
  name: string;
  status: ProjectStatus;
  currentPhase: string;
  completedCount: number;
  missingCount: number;
  blockedCount: number;
  riskCount: number;
  summaryLines: string[];
}

export interface ProjectGapAnalysis {
  projectId: string;
  missingCapabilities: string[];
  gapCount: number;
  explanation: string;
}

export interface ProjectRiskAnalysis {
  projectId: string;
  riskItems: string[];
  riskCount: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  explanation: string;
}

export interface ProjectNextStepRecommendation {
  projectId: string;
  nextRecommendedStep: string;
  rationale: string;
}

export interface ProjectUnderstandingContext {
  profile: ProjectProfile;
  statusSummary: ProjectStatusSummary;
  gapAnalysis: ProjectGapAnalysis;
  riskAnalysis: ProjectRiskAnalysis;
  nextStep: ProjectNextStepRecommendation;
  memoryContextUsed: boolean;
  crossSystemContextUsed: boolean;
}

export interface ProjectUnderstandingDiagnostics {
  projectUnderstandingActive: boolean;
  currentProject: string;
  projectStatus: string;
  missingCapabilityCount: number;
  riskCount: number;
  lastProjectQuery: string | null;
}

export const DUPLICATE_PROJECT_UNDERSTANDING_PATTERNS = [
  'project_understanding_engine',
  'project_context_engine',
  'project_status_engine',
  'project_profile_engine',
  'project_intelligence',
] as const;

export const PROJECT_UNDERSTANDING_FEED_STAGES = [
  'Understanding Project',
  'Gathering Facts',
  'Evaluating Risks',
  'Analyzing Dependencies',
  'Generating Conclusions',
] as const;
