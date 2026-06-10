/**
 * Capability Research Engine — types and models.
 * Research and analysis only — no capability creation.
 */

export const CAPABILITY_RESEARCH_ENGINE_PASS_TOKEN = 'CAPABILITY_RESEARCH_ENGINE_V1_PASS';
export const CAPABILITY_RESEARCH_ENGINE_OWNER_MODULE = 'devpulse_v2_capability_research_engine';
export const DEFAULT_MAX_RESEARCH_HISTORY_SIZE = 128;

export type CapabilityResearchDecision =
  | 'NO_GAP_FOUND'
  | 'EXISTING_CAPABILITY_INSUFFICIENT'
  | 'NEW_CAPABILITY_REQUIRED'
  | 'DIAGNOSTIC_REQUIRED'
  | 'OPTIMIZATION_REQUIRED'
  | 'RESEARCH_INCONCLUSIVE';

export type CapabilityDomain =
  | 'BUILDING'
  | 'TESTING'
  | 'FIXING'
  | 'VERIFICATION'
  | 'COMPLETION'
  | 'MONITORING'
  | 'ORCHESTRATION'
  | 'RESOURCE_MANAGEMENT'
  | 'WORKSPACE_MANAGEMENT'
  | 'WORLD2'
  | 'TRUST'
  | 'DIAGNOSTICS'
  | 'PERFORMANCE'
  | 'SELF_EVOLUTION';

export type CapabilityGapType =
  | 'NO_GAP'
  | 'WEAK_CAPABILITY'
  | 'INCOMPLETE_CAPABILITY'
  | 'MISSING_CAPABILITY';

export type CapabilityRootCauseType =
  | 'EXISTING_CAPABILITY_MALFUNCTION'
  | 'MISSING_CAPABILITY'
  | 'RUNTIME_BOTTLENECK'
  | 'RESOURCE_LIMITATION'
  | 'ARCHITECTURAL_LIMITATION';

export type DuplicateRisk = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'DUPLICATE';

export interface CapabilityResearchRecord {
  researchId: string;
  capabilityDomain: string;
  decision: CapabilityResearchDecision;
  confidence: number;
  evidenceCount: number;
  createdAt: number;
}

export interface CapabilityResearchInput {
  projectId?: string;
  proposedCapability?: string;
  subsystem?: string;
  signals?: string[];
  escalationDecision?: string;
  failures?: Array<{ failureId: string; subsystem: string; message: string }>;
  stalls?: Array<{ stallId: string; progressVelocity: number; actualDurationMs: number }>;
  bottlenecks?: Array<{ bottleneckId: string; bottleneckType: string; subsystem: string }>;
  blockedStates?: Array<{ stateId: string; state: string; durationMs: number }>;
}

export interface DomainClassificationResult {
  domain: CapabilityDomain;
  confidence: number;
}

export interface CapabilityGapResearchResult {
  gapType: CapabilityGapType;
  findings: string[];
  confidence: number;
}

export interface CapabilityEvidenceResult {
  evidenceQualityScore: number;
  evidenceSummary: string;
  evidenceConfidence: number;
  evidenceCount: number;
}

export interface CapabilitySimilarityResult {
  duplicateRisk: DuplicateRisk;
  similarityScore: number;
  existingCandidates: string[];
}

export interface CapabilityRootCauseResearchResult {
  rootCause: CapabilityRootCauseType;
  confidence: number;
  supportingEvidence: string[];
}

export interface CapabilityResearchReport {
  reportId: string;
  researchId: string;
  domain: CapabilityDomain;
  decision: CapabilityResearchDecision;
  confidence: number;
  evidence: CapabilityEvidenceResult;
  rootCause: CapabilityRootCauseResearchResult;
  duplicateRisk: DuplicateRisk;
  similarityScore: number;
  existingCandidates: string[];
  gapFindings: string[];
  recommendedAction: string;
  generatedAt: number;
}

export interface CapabilityResearchHistoryEntry {
  historyId: string;
  researchId: string;
  capabilityDomain: string;
  decision: CapabilityResearchDecision;
  recordedAt: number;
}

export interface CapabilityResearchRuntimeReport {
  domainClassificationCount: number;
  evidenceAnalyzedCount: number;
  duplicateCheckCount: number;
  rootCauseAnalysisCount: number;
  researchDecisionCount: number;
  cacheHits: number;
  cacheMisses: number;
  bootstrapReuseCount: number;
}

export const RESEARCH_QUESTION_SIGNALS = [
  'capability research',
  'missing capability',
  'duplicate capability',
  'capability gap research',
  'self evolving devpulse',
] as const;

export function isCapabilityResearchQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return RESEARCH_QUESTION_SIGNALS.some((s) => lower.includes(s));
}
