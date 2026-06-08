/** DevPulse V2 Code Generation Planner — types. */

export type CodePlanStatus = 'READY' | 'WARN' | 'BLOCKED';

export interface PlannedImplementationTask {
  taskId: string;
  title: string;
  objective: string;
  targetModules: string[];
  targetFiles: string[];
  validationRequirements: string[];
  uiRequirements: string[];
  duplicateRisks: string[];
  warnings: string[];
  errors: string[];
}

export interface CodeGenerationPlan {
  planId: string;
  createdAt: number;
  strategyId: string;
  tasks: PlannedImplementationTask[];
  status: CodePlanStatus;
  warnings: string[];
  errors: string[];
}

export interface CodePlanSummary {
  planId: string;
  strategyId: string;
  taskCount: number;
  summary: string;
  publishedAt: number;
}

export interface CodeGenerationPlannerState {
  plannerId: string;
  planCount: number;
  warnings: string[];
  errors: string[];
}

export interface CodeGenerationPlanReport {
  ownerModule: string;
  planCount: number;
  taskCount: number;
  validationCount: number;
  uiRequirementCount: number;
  duplicateRiskCount: number;
  latestPlan: CodeGenerationPlan | null;
  warnings: string[];
  errors: string[];
  recommendation: string;
}

export interface PlanDuplicateContext {
  brainSummaries: string[];
  vaultCapabilities: string[];
  architectDuplicateWarnings: string[];
  packageDuplicateWarnings: string[];
  strategyDuplicateWarnings: string[];
}

export const PLANNER_OWNER_MODULE = 'devpulse_v2_code_generation_planner_authority';
export const PLANNER_PASS_TOKEN = 'DEVPULSE_V2_CODE_GENERATION_PLANNER_FOUNDATION_V1_PASS';
export const DUPLICATE_RISK_PREFIX = 'DUPLICATE_RISK';
export const UI_REGISTRATION_REQUIRED = 'UI_REGISTRATION_REQUIRED';
export const CLICKABILITY_PROOF_REQUIRED = 'CLICKABILITY_PROOF_REQUIRED';

export const UI_ELEMENT_KEYWORDS = [
  'panel',
  'screen',
  'button',
  'input',
  'toolbar',
  'menu',
  'tab',
  'dialog',
] as const;
