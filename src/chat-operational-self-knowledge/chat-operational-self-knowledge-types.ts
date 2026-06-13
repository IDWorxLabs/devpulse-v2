/**
 * Chat Operational Self-Knowledge — evidence-backed operational intelligence types.
 */

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
  | 'CAPABILITIES'
  | 'LAUNCH_READINESS'
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

export interface OperationalEvidenceSnapshot {
  readOnly: true;
  generatedAt: string;
  capabilityTruth: CapabilityTruthRegistry;
  overallUncertainty: UncertaintyAssessment;
  firstBrokenStage: string | null;
  executionChainConnected: boolean;
  launchBlockers: OperationalLaunchBlocker[];
  typecheckState: string;
  typecheckClean: boolean;
  buildProofLevel: string;
  chatIntelligenceNote: string | null;
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
}

export interface EnhanceChatWithOperationalSelfKnowledgeInput {
  message: string;
  draftAnswer?: string;
  rootDir?: string;
  snapshot?: OperationalEvidenceSnapshot;
}

export interface EnhanceChatWithOperationalSelfKnowledgeResult {
  readOnly: true;
  finalAnswer: string;
  usedOperationalSelfKnowledge: boolean;
  questionKind: OperationalQuestionKind;
  assessment: OperationalSelfKnowledgeAssessment | null;
}

export interface BuildOperationalEvidenceSnapshotInput {
  rootDir?: string;
  skipHeavyAuthorities?: boolean;
}
