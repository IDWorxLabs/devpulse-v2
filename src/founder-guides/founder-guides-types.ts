/**
 * Founder Guides — types and models.
 */

export const FOUNDER_GUIDES_PASS_TOKEN = 'FOUNDER_GUIDES_V1_PASS';
export const FOUNDER_GUIDES_OWNER_MODULE = 'devpulse_v2_founder_guides';
export const DEFAULT_MAX_FOUNDER_GUIDES_HISTORY_SIZE = 128;

export type FounderGuideCompletenessLevel = 'MINIMAL' | 'PARTIAL' | 'SUBSTANTIAL' | 'COMPLETE';

export type FounderGuideState =
  | 'READY'
  | 'PARTIAL'
  | 'INCOMPLETE'
  | 'UNKNOWN';

export interface FounderGuideRecord {
  guideId: string;
  projectId: string;
  workspaceId: string;
  completenessLevel: FounderGuideCompletenessLevel;
  state: FounderGuideState;
  confidence: number;
  founderCoverageScore: number;
  roadmapCoverageScore: number;
  checkpointCoverageScore: number;
  generatedAt: number;
}

export interface RoadmapGuideAnalysis {
  roadmapCoverageScore: number;
  undocumentedRoadmapAreas: string[];
  roadmapWarnings: string[];
}

export interface CheckpointGuideAnalysis {
  checkpointCoverageScore: number;
  undocumentedCheckpoints: string[];
  checkpointWarnings: string[];
}

export interface SystemNavigationGuideAnalysis {
  navigationCoverageScore: number;
  navigationWarnings: string[];
  undocumentedNavigationAreas: string[];
}

export interface ModificationSafetyGuideAnalysis {
  safetyCoverageScore: number;
  unsafeModificationAreas: string[];
  safetyWarnings: string[];
}

export interface EvolutionGuideAnalysis {
  evolutionCoverageScore: number;
  undocumentedEvolutionAreas: string[];
  evolutionWarnings: string[];
}

export interface UnifiedFounderGuidesAuthority {
  authorityId: string;
  founderCoverageScore: number;
  roadmapCoverageScore: number;
  checkpointCoverageScore: number;
  navigationCoverageScore: number;
  safetyCoverageScore: number;
  evolutionCoverageScore: number;
  completenessLevel: FounderGuideCompletenessLevel;
  state: FounderGuideState;
  confidence: number;
  createdAt: number;
}

export interface FounderGuidesEvaluation {
  founderCoverageScore: number;
  roadmapCoverageScore: number;
  checkpointCoverageScore: number;
  navigationCoverageScore: number;
  safetyCoverageScore: number;
  evolutionCoverageScore: number;
  completenessLevel: FounderGuideCompletenessLevel;
  state: FounderGuideState;
  confidence: number;
  guideReadiness: number;
}

export interface FounderGuidesHistoryEntry {
  guideId: string;
  founderCoverageScore: number;
  state: FounderGuideState;
  completenessLevel: FounderGuideCompletenessLevel;
  recordedAt: number;
}

export interface FounderGuidesReport {
  founderCoverageScore: number;
  roadmapCoverageScore: number;
  checkpointCoverageScore: number;
  navigationCoverageScore: number;
  safetyCoverageScore: number;
  evolutionCoverageScore: number;
  completenessLevel: FounderGuideCompletenessLevel;
  state: FounderGuideState;
  confidence: number;
  roadmapGuidance: string[];
  checkpointGuidance: string[];
  navigationGuidance: string[];
  safetyGuidance: string[];
  evolutionGuidance: string[];
  undocumentedAreas: string[];
  missingSignals: string[];
  recommendations: string[];
  evaluation: FounderGuidesEvaluation;
  historySize: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface FounderGuidesInput {
  requestId: string;
  projectId?: string;
  workspaceId?: string;
  undocumentedRoadmapAreas?: string[];
  missingCompletedPhases?: boolean;
  missingCurrentPhase?: boolean;
  missingFuturePhases?: boolean;
  missingRoadmapOrdering?: boolean;
  undocumentedCheckpoints?: string[];
  missingTrustEngineCheckpoint?: boolean;
  missingProductHardeningCheckpoint?: boolean;
  missingLaunchCheckpointDocs?: boolean;
  missingFounderReadinessCheckpoint?: boolean;
  undocumentedNavigationAreas?: string[];
  missingCapabilityDiscovery?: boolean;
  missingFindPanelAliases?: boolean;
  missingOwnershipMapping?: boolean;
  missingAuthorityChainNavigation?: boolean;
  unsafeModificationAreas?: string[];
  missingProtectedFoundationGuidance?: boolean;
  missingGovernanceControlledGuidance?: boolean;
  missingCheckpointBeforeModifyGuidance?: boolean;
  missingIsolatedModuleGuidance?: boolean;
  undocumentedEvolutionAreas?: string[];
  missingSelfEvolutionGuidance?: boolean;
  missingEscalationGuidance?: boolean;
  missingWorld2GrowthGuidance?: boolean;
  missingFounderApprovalBoundaryGuidance?: boolean;
  governanceBlocked?: boolean;
}

export interface FounderGuidesResult {
  record: FounderGuideRecord;
  report: FounderGuidesReport;
}

export interface FounderGuidesRuntimeReport {
  roadmapAnalysisCount: number;
  checkpointAnalysisCount: number;
  navigationAnalysisCount: number;
  safetyAnalysisCount: number;
  evolutionAnalysisCount: number;
  authorityBuildCount: number;
  evaluationCount: number;
  recordCount: number;
  cacheHits: number;
  cacheMisses: number;
  cacheEvictions: number;
  bootstrapReuseCount: number;
}

export const FOUNDER_GUIDES_QUESTION_SIGNALS = [
  'founder guides',
  'founder documentation',
  'roadmap guide',
  'checkpoint guide',
  'navigation guide',
  'modification safety',
  'evolution guide',
] as const;

export function isFounderGuidesQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  return FOUNDER_GUIDES_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function resolveFounderGuideCompletenessLevel(score: number): FounderGuideCompletenessLevel {
  if (score >= 90) return 'COMPLETE';
  if (score >= 70) return 'SUBSTANTIAL';
  if (score >= 45) return 'PARTIAL';
  return 'MINIMAL';
}

export function resolveFounderGuideState(score: number, blocked?: boolean): FounderGuideState {
  if (blocked === true) return 'UNKNOWN';
  if (score >= 85) return 'READY';
  if (score >= 65) return 'PARTIAL';
  if (score >= 35) return 'INCOMPLETE';
  return 'UNKNOWN';
}
