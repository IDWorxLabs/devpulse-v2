/**
 * Chat Operational Self-Knowledge — evidence-backed operational intelligence types.
 */

import type { ConnectedExecutionChainTruth } from '../founder-test-integration/connected-execution-chain-truth.js';

export const OPERATIONAL_TRUTH_SOURCE_CONTRADICTION = 'OPERATIONAL_TRUTH_SOURCE_CONTRADICTION' as const;
export const CHAT_OPERATIONAL_CONTRADICTION = 'CHAT_OPERATIONAL_CONTRADICTION' as const;

export type CapabilityTruthLevel = 'PROVEN' | 'PARTIALLY_PROVEN' | 'NOT_PROVEN' | 'UNKNOWN';

export type UncertaintyLevel = 'KNOWN' | 'LIKELY' | 'UNVERIFIED' | 'UNKNOWN';

export type OperationalQuestionKind =
  | 'SELF_AWARENESS'
  | 'TRUST'
  | 'LIMITATIONS'
  | 'UNCERTAINTY'
  | 'NEXT_STEP'
  | 'WEAKNESS'
  | 'FIRST_BROKEN_STAGE'
  | 'LAUNCH_BLOCKERS'
  | 'PROOF_REQUEST'
  | 'TRUTH_SOURCE'
  | 'EXECUTION_STAGE_INVENTORY'
  | 'CAPABILITIES'
  | 'IDENTITY'
  | 'LAUNCH_READINESS'
  | 'LAUNCH_NOT_PROVEN'
  | 'FIRST_LAUNCH_BLOCKER'
  | 'LAUNCH_FIX_REQUIRED'
  | 'DISCONNECTED_SYSTEMS'
  | 'GENERAL';

export interface CapabilityTruthEntry {
  readOnly: true;
  capabilityId: string;
  label: string;
  truthLevel: CapabilityTruthLevel;
  evidenceSource: string;
  detail: string;
}

export interface CapabilityTruthRegistry {
  readOnly: true;
  generatedAt: string;
  entries: CapabilityTruthEntry[];
  provenCount: number;
  partiallyProvenCount: number;
  notProvenCount: number;
  unknownCount: number;
}

export interface UncertaintyAssessment {
  readOnly: true;
  level: UncertaintyLevel;
  confidencePercent: number;
  rationale: string;
  evidenceSource: string;
}

export interface OperationalLaunchBlocker {
  readOnly: true;
  label: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  evidenceSource: string;
}

export interface OperationalTruthSourceContradiction {
  readOnly: true;
  kind: typeof OPERATIONAL_TRUTH_SOURCE_CONTRADICTION;
  capability: string;
  staleSource: string;
  truthSource: string;
  staleValue: 'NOT_PROVEN' | 'PARTIAL' | 'UNKNOWN';
  truthValue: 'PROVEN';
}

export interface ChatOperationalContradiction {
  readOnly: true;
  kind: typeof CHAT_OPERATIONAL_CONTRADICTION;
  questionCategory: string;
  conflictingSources: string[];
  conflictingValues: string[];
  detail: string;
}

export interface ExecutionStageInventoryEntry {
  readOnly: true;
  stageId: string;
  label: string;
  proven: boolean;
  status: string;
  source: string;
}

export interface RepositoryTypecheckReality {
  readOnly: true;
  state: string;
  clean: boolean;
  source: string;
}

export interface FounderTestReality {
  readOnly: true;
  available: boolean;
  verdict: string | null;
  score: number | null;
  source: string;
}

export interface ProductReadinessReality {
  readOnly: true;
  available: boolean;
  verdict: string | null;
  launchBlocked: boolean | null;
  source: string;
}

export interface ChatIntelligenceReality {
  readOnly: true;
  available: boolean;
  note: string;
  source: string;
}

export interface OperationalTruthContext {
  readOnly: true;
  version: string;
  executionChainTruth: ConnectedExecutionChainTruth;
  repositoryTypecheckReality: RepositoryTypecheckReality;
  founderTestReality: FounderTestReality;
  productReadinessReality: ProductReadinessReality;
  chatIntelligenceReality: ChatIntelligenceReality;
  executionTruthSource: string;
  executionTruthGeneratedAt: string;
  firstBrokenStage: string | null;
  chainConnected: boolean;
  generatedAt: string;
  stageInventory: ExecutionStageInventoryEntry[];
  contradictionCount: number;
  contradictions: ChatOperationalContradiction[];
}

export interface OperationalEvidenceSnapshot {
  readOnly: true;
  generatedAt: string;
  capabilityTruth: CapabilityTruthRegistry;
  overallUncertainty: UncertaintyAssessment;
  executionChainTruth: ConnectedExecutionChainTruth;
  executionTruthGeneratedAt: string;
  executionTruthSource: string;
  firstBrokenStage: string | null;
  executionChainConnected: boolean;
  launchBlockers: OperationalLaunchBlocker[];
  typecheckState: string;
  typecheckClean: boolean;
  buildProofLevel: string;
  chatIntelligenceNote: string | null;
  founderTestVerdict: string | null;
  truthSourceContradictions: OperationalTruthSourceContradiction[];
  operationalTruthContext: OperationalTruthContext;
  evidenceSources: string[];
}

export interface OperationalSelfKnowledgeAssessment {
  readOnly: true;
  questionKind: OperationalQuestionKind;
  snapshot: OperationalEvidenceSnapshot;
  responseText: string;
  usedEvidenceSources: string[];
  admitsLimitations: boolean;
  referencesProofSystems: boolean;
  referencesFirstBrokenStage: boolean;
  consciousnessClaimBlocked: boolean;
  executionTruthSource: string;
  executionTruthGeneratedAt: string;
  chainConnected: boolean;
  firstBrokenStage: string | null;
  truthSourceContradictionCount: number;
  chatOperationalContradictionCount: number;
}

export interface EnhanceChatWithOperationalSelfKnowledgeInput {
  message: string;
  draftAnswer?: string;
  rootDir?: string;
  snapshot?: OperationalEvidenceSnapshot;
  forceLivePath?: boolean;
  forceSnapshotRefresh?: boolean;
}

export interface EnhanceChatWithOperationalSelfKnowledgeResult {
  readOnly: true;
  finalAnswer: string;
  usedOperationalSelfKnowledge: boolean;
  questionKind: OperationalQuestionKind;
  assessment: OperationalSelfKnowledgeAssessment | null;
  operationalTruthPath: OperationalTruthPath;
  liveTruthBypasses: LiveOperationalTruthBypass[];
  liveTruthDiagnostics: LiveOperationalTruthDiagnostics | null;
}

export type BuildOperationalEvidenceSnapshotInput = {
  rootDir?: string;
  skipHeavyAuthorities?: boolean;
  forceSnapshotRefresh?: boolean;
};

export type OperationalTruthPath = 'legacy-autonomous-proof' | 'connected-execution-truth';

export const LIVE_OPERATIONAL_TRUTH_BYPASS = 'LIVE_OPERATIONAL_TRUTH_BYPASS' as const;

export interface LiveOperationalTruthBypass {
  readOnly: true;
  kind: typeof LIVE_OPERATIONAL_TRUTH_BYPASS;
  staleSource: string;
  truthSource: string;
  capability?: string;
  staleValue?: string;
  truthValue?: string;
  detail: string;
}

export interface LiveOperationalTruthDiagnostics {
  readOnly: true;
  operationalTruthPath: OperationalTruthPath;
  operationalTruthContextVersion: string;
  operationalTruthSource: string;
  operationalTruthGeneratedAt: string;
  executionTruthSource: string;
  firstBrokenStage: string | null;
  chainConnected: boolean;
  generatedAt: string;
  executionTruthGeneratedAt: string;
  contradictionCount: number;
}
