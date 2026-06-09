/**
 * DevPulse V2 Phase 13.5 — Failure Visibility Engine types.
 * Visibility only — failure advisory without auto-fix or execution.
 */

export const FAILURE_VISIBILITY_ENGINE_PASS_TOKEN =
  'DEVPULSE_V2_FAILURE_VISIBILITY_ENGINE_FOUNDATION_V1_PASS';
export const FAILURE_VISIBILITY_ENGINE_OWNER_MODULE = 'devpulse_v2_failure_visibility_engine';

export type FailureSeverity = 'Info' | 'Warning' | 'Moderate' | 'High' | 'Critical';
export type FailureConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export interface FailureImpact {
  impactId: string;
  summary: string;
  affectedSystems: string[];
  visibilityOnly: true;
}

export interface FailureDependencyImpact {
  dependencyImpactId: string;
  chainSummary: string;
  blockedPath: string;
  visibilityOnly: true;
}

export interface FailureRecord {
  failureId: string;
  title: string;
  description: string;
  severity: FailureSeverity;
  sourceSystem: string;
  affectedSystems: string[];
  blockedCapabilities: string[];
  dependencyImpact: FailureDependencyImpact[];
  recommendedNextStep: string;
  confidence: FailureConfidence;
  visibilityOnly: true;
}

export interface FailureAnalysis {
  query: string;
  records: FailureRecord[];
  impacts: FailureImpact[];
  mostSevere: FailureRecord | null;
  blockedCapabilityCount: number;
  criticalCount: number;
}

export interface FailureVisibilityResult {
  query: string;
  analysis: FailureAnalysis;
  responseText: string;
}

export interface FailureVisibilityDiagnostics {
  failureVisibilityActive: boolean;
  failureCount: number;
  criticalFailureCount: number;
  blockedCapabilityCount: number;
  mostSevereFailure: string | null;
  lastFailureQuery: string | null;
}

export const FAILURE_VISIBILITY_QUESTION_SIGNALS = [
  'what failed',
  'failures exist',
  'most severe failure',
  'systems are affected',
  'capabilities are blocked',
  'dependency chains are impacted',
  'what should happen next',
  'failure',
  'failed',
  'error',
  'problem',
  'issue',
  'severity',
  'impact',
] as const;

export const FORBIDDEN_FAILURE_VISIBILITY_DUPLICATES = [
  'failure_brain',
  'error_brain',
  'brain_v2',
  'failure_tracker',
  'failure_runtime',
  'error_visibility',
  'second_failure_visibility_engine',
] as const;

const SEVERITY_ORDER: Record<FailureSeverity, number> = {
  Info: 1,
  Warning: 2,
  Moderate: 3,
  High: 4,
  Critical: 5,
};

export function compareFailureSeverity(a: FailureSeverity, b: FailureSeverity): number {
  return SEVERITY_ORDER[a] - SEVERITY_ORDER[b];
}

export function isFailureVisibilityQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();

  if (lower.includes('what failed')) return true;
  if (lower.includes('failures exist')) return true;
  if (lower.includes('most severe failure')) return true;
  if (lower.includes('systems are affected')) return true;
  if (lower.includes('capabilities are blocked')) return true;
  if (lower.includes('dependency chains are impacted')) return true;
  if (lower.includes('what should happen next')) return true;

  const matches = FAILURE_VISIBILITY_QUESTION_SIGNALS.some((s) => lower.includes(s));
  if (!matches) return false;

  if (lower.startsWith('why ') || (lower.includes(' why ') && !lower.includes('what failed'))) return false;
  if (lower.includes('how far') || lower.includes('percentage complete') || lower.includes('percent complete')) return false;
  if (lower.includes('what is blocked') && !lower.includes('capabilities are blocked')) return false;
  if (lower.includes('recommended action') || lower.includes('next action') || lower.includes('blocked action')) return false;
  if (lower.includes('what depends on') || lower.includes('what breaks if')) return false;
  if (lower.includes('what changed') || (lower.includes('history') && !lower.includes('fail'))) return false;
  if (lower.includes('milestone') && !lower.includes('fail') && !lower.includes('error')) return false;

  if (
    lower.includes('blocked') &&
    !lower.includes('capabilities') &&
    !lower.includes('fail') &&
    !lower.includes('error') &&
    !lower.includes('failure') &&
    !lower.includes('problem') &&
    !lower.includes('issue')
  ) {
    return false;
  }

  return true;
}
