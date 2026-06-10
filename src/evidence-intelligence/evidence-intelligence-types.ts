/**
 * Evidence Intelligence — types and models.
 */

export const EVIDENCE_INTELLIGENCE_PASS_TOKEN = 'EVIDENCE_INTELLIGENCE_V1_PASS';
export const EVIDENCE_INTELLIGENCE_OWNER_MODULE = 'devpulse_v2_evidence_intelligence';
export const DEFAULT_MAX_EVIDENCE_HISTORY_SIZE = 128;

export type EvidenceSourceId =
  | 'AUTONOMOUS_TESTING'
  | 'AUTONOMOUS_FIXING'
  | 'AUTONOMOUS_VERIFICATION'
  | 'AUTONOMOUS_COMPLETION_ENGINE'
  | 'VERIFICATION_STRATEGY_CORE'
  | 'VERIFICATION_INTELLIGENCE'
  | 'VERIFICATION_INTEGRATION'
  | 'MULTI_PROJECT_VERIFICATION'
  | 'MULTI_PROJECT_MONITORING'
  | 'SELF_EVOLUTION_GOVERNANCE'
  | 'UNIFIED_TRUST_RUNTIME'
  | 'WORLD2'
  | 'TRUST_ENGINE';

export type EvidenceCategory =
  | 'VERIFICATION'
  | 'COMPLETION'
  | 'GOVERNANCE'
  | 'TRUST'
  | 'MONITORING'
  | 'TESTING'
  | 'FIXING'
  | 'GENERAL';

export type EvidenceStatus = 'ACTIVE' | 'STALE' | 'UNVERIFIED' | 'CONFLICTED' | 'BLOCKED' | 'UNKNOWN';

export type EvidenceSufficiencyLevel =
  | 'INSUFFICIENT'
  | 'PARTIAL'
  | 'SUFFICIENT'
  | 'STRONG'
  | 'AUTHORITATIVE';

export interface EvidenceSourceRegistration {
  sourceId: EvidenceSourceId;
  label: string;
  registeredAt: number;
  active: boolean;
}

export interface RawEvidenceInput {
  source: EvidenceSourceId | string;
  project?: string;
  workspace?: string;
  category?: EvidenceCategory | string;
  status?: EvidenceStatus | string;
  strength?: number;
  trustworthiness?: number;
  reliability?: number;
  freshness?: number;
  claim?: string;
  timestamp?: number;
}

export interface EvidenceRecord {
  evidenceId: string;
  source: EvidenceSourceId;
  project: string;
  workspace: string;
  category: EvidenceCategory;
  status: EvidenceStatus;
  strength: number;
  trustworthiness: number;
  reliability: number;
  freshness: number;
  claim: string;
  timestamp: number;
}

export interface EvidenceQualityScores {
  qualityScore: number;
  strengthScore: number;
  reliabilityScore: number;
  freshnessScore: number;
  consistencyScore: number;
}

export interface EvidenceConflict {
  conflictType: 'contradictory' | 'trust' | 'verification' | 'completion' | 'governance' | 'source_disagreement';
  sources: EvidenceSourceId[];
  description: string;
}

export interface EvidenceGap {
  gapType: 'missing' | 'weak' | 'stale' | 'unverified' | 'untrusted';
  category: EvidenceCategory;
  description: string;
}

export interface UnifiedEvidenceAuthority {
  authorityId: string;
  sufficiencyLevel: EvidenceSufficiencyLevel;
  quality: EvidenceQualityScores;
  conflictCount: number;
  gapCount: number;
  evidenceCount: number;
  participatingSources: EvidenceSourceId[];
  createdAt: number;
}

export interface EvidenceIntelligenceEvaluation {
  overallEvidenceState: EvidenceSufficiencyLevel;
  evidenceConfidence: number;
  evidenceTrustworthiness: number;
  evidenceReadiness: number;
  evidenceStability: number;
}

export interface EvidenceIntelligenceRecord {
  recordId: string;
  authority: UnifiedEvidenceAuthority;
  evaluation: EvidenceIntelligenceEvaluation;
  conflicts: EvidenceConflict[];
  gaps: EvidenceGap[];
  createdAt: number;
}

export interface EvidenceIntelligenceHistoryEntry {
  recordId: string;
  sufficiencyLevel: EvidenceSufficiencyLevel;
  evidenceCount: number;
  qualityScore: number;
  recordedAt: number;
}

export interface EvidenceIntelligenceReport {
  sourceParticipation: EvidenceSourceId[];
  quality: EvidenceQualityScores;
  sufficiencyLevel: EvidenceSufficiencyLevel;
  conflicts: EvidenceConflict[];
  gaps: EvidenceGap[];
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
  evaluation: EvidenceIntelligenceEvaluation;
}

export interface EvidenceIntelligenceInput {
  requestId: string;
  project?: string;
  workspace?: string;
  evidence: RawEvidenceInput[];
}

export interface EvidenceIntelligenceResult {
  record: EvidenceIntelligenceRecord;
  report: EvidenceIntelligenceReport;
}

export interface EvidenceIntelligenceRuntimeReport {
  qualityAnalysisCount: number;
  sufficiencyAnalysisCount: number;
  conflictDetectionCount: number;
  gapAnalysisCount: number;
  authorityBuildCount: number;
  evaluationCount: number;
  recordCount: number;
  cacheHits: number;
  cacheMisses: number;
  bootstrapReuseCount: number;
}

export const EVIDENCE_INTELLIGENCE_QUESTION_SIGNALS = [
  'evidence intelligence',
  'evidence authority',
  'evidence quality',
  'evidence gaps',
  'evidence analysis',
] as const;

export function isEvidenceIntelligenceQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return EVIDENCE_INTELLIGENCE_QUESTION_SIGNALS.some((s) => lower.includes(s));
}
