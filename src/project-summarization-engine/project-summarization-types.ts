/**
 * DevPulse V2 Phase 12.5 — Project Summarization Engine types.
 * Intelligence only — unified summaries from all Phase 11–12 sources.
 */

export const PROJECT_SUMMARIZATION_ENGINE_PASS_TOKEN =
  'DEVPULSE_V2_PROJECT_SUMMARIZATION_ENGINE_FOUNDATION_V1_PASS';
export const PROJECT_SUMMARIZATION_ENGINE_OWNER_MODULE =
  'devpulse_v2_project_summarization_engine';

export type SummaryType =
  | 'EXECUTIVE'
  | 'TECHNICAL'
  | 'PROJECT_STATUS'
  | 'PROJECT_HEALTH'
  | 'AI_ONBOARDING'
  | 'MILESTONE'
  | 'RISK'
  | 'DEPENDENCY'
  | 'WORKSPACE'
  | 'GENERAL';

export type SummaryConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ProjectSummary {
  summaryId: string;
  summaryType: SummaryType;
  title: string;
  body: string;
  confidence: SummaryConfidence;
  sourceCount: number;
  sources: string[];
  readOnly: true;
}

export interface SummarizationContext {
  query: string;
  projectId: string;
  projectName: string;
  currentPhase: string;
  nextPhase: string;
  factCount: number;
  vaultFactCount: number;
  dependencyFactCount: number;
  workspaceFactCount: number;
  historyFactCount: number;
  memoryFactCount: number;
  blockerCount: number;
  riskCount: number;
  milestoneCount: number;
  sources: string[];
}

export interface SummarizationResult {
  query: string;
  requestedType: SummaryType;
  summaries: ProjectSummary[];
  context: SummarizationContext;
  responseText: string;
}

export interface ProjectSummarizationDiagnostics {
  projectSummarizationActive: boolean;
  summaryCount: number;
  lastSummaryType: SummaryType | null;
  lastSummaryConfidence: SummaryConfidence;
  summarySourceCount: number;
  lastSummarizationQuery: string | null;
}

export const SUMMARIZATION_QUESTION_SIGNALS = [
  'summary',
  'summarize',
  'overview',
  'executive summary',
  'technical summary',
  'project health',
  'founder summary',
  'onboarding summary',
  'new ai know',
  'what should a new ai',
  'milestone summary',
  'summarize milestones',
  'summarize blockers',
  'summarize project',
  'project overview',
  'give me a founder',
  'give me a technical',
  'give me an executive',
  'health summary',
  'status summary',
] as const;

export const FORBIDDEN_SUMMARIZATION_DUPLICATES = [
  'summary_brain',
  'brain_v2',
  'project_brain',
  'memory_brain',
  'project_summary_engine',
  'project_overview_engine',
  'second_summarization',
] as const;

export function isProjectSummarizationQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  return SUMMARIZATION_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function resolveSummaryType(question: string): SummaryType {
  const lower = question.toLowerCase();
  if (lower.includes('executive') || lower.includes('founder summary')) return 'EXECUTIVE';
  if (lower.includes('technical')) return 'TECHNICAL';
  if (lower.includes('health')) return 'PROJECT_HEALTH';
  if (lower.includes('status') && !lower.includes('health')) return 'PROJECT_STATUS';
  if (lower.includes('new ai') || lower.includes('onboarding') || lower.includes('should a new ai')) return 'AI_ONBOARDING';
  if (lower.includes('milestone')) return 'MILESTONE';
  if (lower.includes('blocker')) return 'RISK';
  if (lower.includes('risk') && !lower.includes('blocker')) return 'RISK';
  if (lower.includes('dependenc')) return 'DEPENDENCY';
  if (lower.includes('workspace')) return 'WORKSPACE';
  if (lower.includes('overview') || lower.includes('summarize devpulse') || lower.includes('summarize this project')) return 'EXECUTIVE';
  return 'GENERAL';
}
