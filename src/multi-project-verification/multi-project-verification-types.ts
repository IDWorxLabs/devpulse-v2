/**
 * Multi Project Verification — types and models.
 * Planning only — no execution.
 */

export const MULTI_PROJECT_VERIFICATION_PASS_TOKEN = 'MULTI_PROJECT_VERIFICATION_V1_PASS';
export const MULTI_PROJECT_VERIFICATION_OWNER_MODULE = 'devpulse_v2_multi_project_verification';
export const DEFAULT_MAX_VERIFICATION_HISTORY_SIZE = 128;

export type ProjectVerificationStatus =
  | 'VERIFIED'
  | 'NEEDS_VERIFICATION'
  | 'TRUST_RECOVERY_REQUIRED'
  | 'HIGH_RISK'
  | 'BLOCKED';

export interface ProjectVerificationRecord {
  projectId: string;
  workspaceId: string;
  status: ProjectVerificationStatus;
  confidence: number;
  riskScore: number;
  readiness: boolean;
  generatedAt: number;
}

export interface PortfolioVerificationSummary {
  totalProjects: number;
  verifiedProjects: number;
  verificationPendingProjects: number;
  highRiskProjects: number;
  blockedProjects: number;
  portfolioConfidence: number;
  portfolioRisk: number;
}

export interface ProjectVerificationInput {
  projectId: string;
  workspaceId: string;
  trustScore?: number;
  verificationConfidence?: number;
  testingConfidence?: number;
  fixingConfidence?: number;
  completionConfidence?: number;
  testResultStatus?: string;
  verificationDecision?: string;
  fixStrategy?: string;
  repairCandidates?: string[];
  unresolvedIssues?: number;
  isolationOk?: boolean;
  criticalSubsystem?: boolean;
  projectState?: string;
  orchestrationReady?: boolean;
  world2Active?: boolean;
  evidenceSignals?: string[];
}

export interface ProjectVerificationEvidence {
  evidenceSummary: string[];
  missingEvidence: string[];
  evidenceQualityScore: number;
}

export interface MultiProjectVerificationReport {
  reportId: string;
  records: ProjectVerificationRecord[];
  portfolio: PortfolioVerificationSummary;
  recommendations: string[];
  generatedAt: number;
}

export interface ProjectVerificationHistoryEntry {
  historyId: string;
  projectId: string;
  previousStatus?: ProjectVerificationStatus;
  newStatus: ProjectVerificationStatus;
  portfolioConfidence: number;
  recordedAt: number;
}

export interface MultiProjectVerificationRuntimeReport {
  projectCount: number;
  verificationCount: number;
  portfolioSize: number;
  cacheHits: number;
  cacheMisses: number;
  bootstrapReuseCount: number;
}

export const MULTI_PROJECT_VERIFICATION_QUESTION_SIGNALS = [
  'multi project verification',
  'portfolio verification',
  'verification readiness',
  'project verification confidence',
  'cross-project verification',
] as const;

export function isMultiProjectVerificationQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return MULTI_PROJECT_VERIFICATION_QUESTION_SIGNALS.some((s) => lower.includes(s));
}
