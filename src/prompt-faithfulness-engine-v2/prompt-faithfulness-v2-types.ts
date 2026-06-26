/**
 * Prompt Faithfulness Engine V2 — foundational types.
 * The prompt becomes immutable engineering authority for the full lifecycle.
 * Constants live in prompt-faithfulness-registry.ts.
 */

export type EvidenceCategory =
  | 'FUNCTIONAL'
  | 'UI'
  | 'BUSINESS_RULE'
  | 'USER_PERSONA'
  | 'USER_WORKFLOW'
  | 'USER_JOURNEY'
  | 'ACCESSIBILITY'
  | 'SECURITY'
  | 'PERFORMANCE'
  | 'RELIABILITY'
  | 'ARCHITECTURE'
  | 'PLATFORM'
  | 'NAVIGATION'
  | 'INTERACTION'
  | 'DATA_MODEL'
  | 'API'
  | 'INTEGRATION'
  | 'AUTHENTICATION'
  | 'AUTHORIZATION'
  | 'NOTIFICATION'
  | 'OFFLINE_BEHAVIOR'
  | 'ERROR_HANDLING'
  | 'STORAGE'
  | 'SYNCHRONIZATION'
  | 'ANIMATION'
  | 'BRANDING'
  | 'THEME'
  | 'LOCALIZATION'
  | 'COMPLIANCE'
  | 'VALIDATION'
  | 'LAUNCH'
  | 'CONSTRAINT'
  | 'SUCCESS_CRITERION'
  | 'NON_GOAL';

export type RequirementPriority = 'MANDATORY' | 'REQUIRED' | 'OPTIONAL' | 'FUTURE' | 'EXPERIMENTAL';
export type EvidenceStrength = 'EXPLICIT' | 'STRONG' | 'INFERRED' | 'WEAK';
export type VerificationStatus = 'PENDING' | 'GENERATED' | 'CONNECTED' | 'BEHAVIOR_VERIFIED' | 'VALIDATED' | 'PASS' | 'FAIL';
export type RequirementVerificationMethod = 'WORKSPACE_SCAN' | 'BEHAVIOR_TEST' | 'TRACEABILITY' | 'MANUAL' | 'FOUNDER_TEST';

export interface ParsedPromptSection {
  readOnly: true;
  sectionId: string;
  heading: string | null;
  lines: readonly string[];
  startLine: number;
  endLine: number;
}

export interface ParsedPrompt {
  readOnly: true;
  rawPrompt: string;
  promptHash: string;
  lineCount: number;
  sections: readonly ParsedPromptSection[];
  sentences: readonly string[];
}

export interface PromptEvidenceItem {
  readOnly: true;
  evidenceId: string;
  originalSentence: string;
  sourceLocation: string;
  sourceLine: number;
  category: EvidenceCategory;
  priority: RequirementPriority;
  confidence: number;
  strength: EvidenceStrength;
  normalizedRequirement: string;
  keywords: readonly string[];
}

export interface PromptEvidenceContract {
  readOnly: true;
  id: string;
  promptHash: string;
  version: string;
  createdAt: number;
  rawPrompt: string;
  requirements: readonly PromptEvidenceItem[];
  mandatoryRequirements: readonly PromptEvidenceItem[];
  optionalRequirements: readonly PromptEvidenceItem[];
  constraints: readonly PromptEvidenceItem[];
  nonGoals: readonly PromptEvidenceItem[];
  platformRequirements: readonly PromptEvidenceItem[];
  behaviorRequirements: readonly PromptEvidenceItem[];
  interactionRequirements: readonly PromptEvidenceItem[];
  navigationRequirements: readonly PromptEvidenceItem[];
  architectureRequirements: readonly PromptEvidenceItem[];
  performanceRequirements: readonly PromptEvidenceItem[];
  securityRequirements: readonly PromptEvidenceItem[];
  accessibilityRequirements: readonly PromptEvidenceItem[];
  validationRequirements: readonly PromptEvidenceItem[];
  launchRequirements: readonly PromptEvidenceItem[];
  immutable: true;
}

export interface PromptRequirement {
  readOnly: true;
  requirementId: string;
  description: string;
  sourceEvidenceIds: readonly string[];
  priority: RequirementPriority;
  category: EvidenceCategory;
  dependencies: readonly string[];
  acceptanceCriteria: readonly string[];
  verificationMethod: RequirementVerificationMethod;
  verificationStatus: VerificationStatus;
  confidence: number;
}

export interface KnowledgeGraphNode {
  readOnly: true;
  nodeId: string;
  label: string;
  nodeType: 'ROOT' | 'FEATURE' | 'WORKFLOW' | 'NAVIGATION' | 'DATA' | 'BEHAVIOR' | 'USER_JOURNEY';
  requirementIds: readonly string[];
  children: readonly string[];
  parentId: string | null;
}

export interface PromptKnowledgeGraph {
  readOnly: true;
  graphId: string;
  rootNodeId: string;
  nodes: readonly KnowledgeGraphNode[];
}

export interface CapabilityMappingEntry {
  readOnly: true;
  mappingId: string;
  requirementId: string;
  capabilityChain: readonly string[];
  capabilitiesExist: boolean;
  forwardedToCapabilityPlanning: boolean;
}

export interface TraceabilityLink {
  readOnly: true;
  linkId: string;
  artifactPath: string;
  artifactType: 'FILE' | 'COMPONENT' | 'SERVICE' | 'API' | 'SCHEMA' | 'WORKFLOW';
  requirementIds: readonly string[];
  evidenceIds: readonly string[];
}

export interface PromptConflict {
  readOnly: true;
  conflictId: string;
  summary: string;
  conflictingEvidence: readonly string[];
  affectedRequirementIds: readonly string[];
  interpretations: readonly string[];
  confidence: number;
  requiresClarification: true;
}

export interface PromptAmbiguity {
  readOnly: true;
  ambiguityId: string;
  vagueRequirement: string;
  sourceEvidenceId: string;
  interpretations: readonly string[];
  clarificationQuestion: string;
  confidence: number;
}

export interface UnsupportedAssumption {
  readOnly: true;
  assumptionId: string;
  assumedCapability: string;
  reason: string;
  supportingEvidenceIds: readonly string[];
  rejected: true;
}

export interface CompletenessGap {
  readOnly: true;
  gapId: string;
  category: string;
  description: string;
  clarificationQuestion: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface CompletenessAnalysis {
  readOnly: true;
  analysisId: string;
  categoriesEvaluated: readonly string[];
  gaps: readonly CompletenessGap[];
  completenessScore: number;
  safeToGenerate: boolean;
}

export interface FaithfulnessCoverageMetrics {
  readOnly: true;
  promptCoverage: number;
  functionalCoverage: number;
  behaviorCoverage: number;
  interactionCoverage: number;
  navigationCoverage: number;
  accessibilityCoverage: number;
  performanceCoverage: number;
  securityCoverage: number;
  constraintCoverage: number;
  validationCoverage: number;
  launchCoverage: number;
}

export interface PromptFaithfulnessScore {
  readOnly: true;
  scoreId: string;
  overallScore: number;
  metrics: FaithfulnessCoverageMetrics;
  calculatedAt: number;
  meetsThreshold: boolean;
  thresholdUsed: number;
}

export interface DriftDetectionResult {
  readOnly: true;
  driftId: string;
  detected: boolean;
  driftTypes: readonly string[];
  removedFeatures: readonly string[];
  changedWorkflows: readonly string[];
  missingAccessibility: readonly string[];
  missingConstraints: readonly string[];
  architectureDivergence: readonly string[];
  unsupportedFeatures: readonly string[];
  faithfulnessScoreBefore: number;
  faithfulnessScoreAfter: number;
  blocksLaunchApproval: boolean;
}

export interface PromptFaithfulnessV2Result {
  readOnly: true;
  resultId: string;
  parsedPrompt: ParsedPrompt;
  contract: PromptEvidenceContract;
  requirements: readonly PromptRequirement[];
  knowledgeGraph: PromptKnowledgeGraph;
  capabilityMappings: readonly CapabilityMappingEntry[];
  conflicts: readonly PromptConflict[];
  ambiguities: readonly PromptAmbiguity[];
  unsupportedAssumptions: readonly UnsupportedAssumption[];
  completeness: CompletenessAnalysis;
  faithfulnessScore: PromptFaithfulnessScore;
  traceabilityLinks: readonly TraceabilityLink[];
  readyForGeneration: boolean;
  blockedReason: string | null;
  reportMarkdown: string;
  completedAt: number;
}

export interface PromptFaithfulnessHistoryEntry {
  readOnly: true;
  historyId: string;
  resultId: string;
  promptHash: string;
  overallScore: number;
  readyForGeneration: boolean;
  conflictCount: number;
  recordedAt: number;
}

export interface ContinuousMonitoringResult {
  readOnly: true;
  monitoringId: string;
  trigger: string;
  driftResult: DriftDetectionResult;
  updatedScore: PromptFaithfulnessScore;
  changeAccepted: boolean;
  rollbackRecommended: boolean;
}

export interface LaunchFaithfulnessEvidence {
  readOnly: true;
  requirementCoverage: number;
  traceabilityLinkCount: number;
  driftDetected: boolean;
  requirementVerificationPassRate: number;
  behaviorVerificationPassRate: number;
  interactionVerificationPassRate: number;
  accessibilityVerificationPassRate: number;
  overallFaithfulnessScore: number;
  blocksLaunchApproval: boolean;
  blockers: readonly string[];
}
