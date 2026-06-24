/**
 * Self-Evolution Execution V1 — types.
 */

export type EvolutionGapClass =
  | 'Performance Gap'
  | 'Verification Gap'
  | 'Generation Gap'
  | 'Runtime Gap'
  | 'Workflow Gap'
  | 'Mobile Gap'
  | 'Production Gap'
  | 'Architecture Gap';

export type EvolutionRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type EvolutionPipelineStage = (typeof import('./self-evolution-execution-v1-bounds.js').EVOLUTION_PIPELINE_STAGES)[number];

export interface EvolutionGapEntry {
  readOnly: true;
  gapId: string;
  capability: string;
  focusArea: string;
  severity: string;
  gapClass: EvolutionGapClass;
  detail: string;
  evidenceSources: readonly string[];
}

export interface EvolutionGapAssessment {
  readOnly: true;
  generatedAt: string;
  gapsDetected: number;
  gaps: readonly EvolutionGapEntry[];
  highestPriorityGap: string;
}

export interface EvolutionProposal {
  readOnly: true;
  proposalId: string;
  gapId: string;
  targetCapability: string;
  reason: string;
  expectedBenefit: string;
  riskLevel: EvolutionRiskLevel;
  validationPlan: readonly string[];
  changeScope: readonly string[];
  pipelineStage: 'GENERATE_PROPOSAL';
}

export interface EvolutionExperimentResult {
  readOnly: true;
  experimentId: string;
  proposalId: string;
  worldId: string;
  profile: string;
  productName: string;
  workspacePath: string;
  artifactDirectory: string;
  changeManifestPath: string;
  buildPassed: boolean;
  previewPassed: boolean;
  verificationPassed: boolean;
  productArchitectPassed: boolean;
  aflaPassed: boolean;
  productionReadinessPassed: boolean;
  validationPassed: boolean;
  pipelineStagesCompleted: readonly EvolutionPipelineStage[];
}

export interface EvolutionImpactAssessment {
  readOnly: true;
  experimentId: string;
  proposalId: string;
  beforeScore: number;
  afterScore: number;
  improvement: number;
  regressionRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
  areas: {
    readOnly: true;
    buildSuccess: { before: number; after: number };
    verification: { before: number; after: number };
    runtime: { before: number; after: number };
    productionReadiness: { before: number; after: number };
    mobile: { before: number; after: number };
    pipelineScore: { before: number; after: number };
  };
}

export interface EvolutionApprovalDecision {
  readOnly: true;
  proposalId: string;
  experimentId: string;
  improvement: number;
  regressionsDetected: boolean;
  validationPassed: boolean;
  operatorApprovalPresent: boolean;
  decision: 'PROMOTABLE' | 'REJECTED' | 'PENDING';
  decidedAt: string;
}

export interface EvolutionRegistryEntry {
  readOnly: true;
  entryId: string;
  proposalId: string;
  experimentId?: string;
  status: 'PROPOSED' | 'EXPERIMENTING' | 'APPROVED' | 'REJECTED' | 'PROMOTED' | 'ARCHIVED';
  recordedAt: string;
}

export interface EvolutionRegistry {
  readOnly: true;
  generatedAt: string;
  totalEntries: number;
  proposals: number;
  experiments: number;
  approved: number;
  rejected: number;
  promoted: number;
  archived: number;
  entries: readonly EvolutionRegistryEntry[];
}

export interface ProductionProtectionProof {
  readOnly: true;
  world1Protected: boolean;
  sentinelHashesBefore: Record<string, string>;
  sentinelHashesAfter: Record<string, string>;
  directProductionModification: false;
  evolutionConfinedToWorld2: true;
}

export interface SelfEvolutionExecutionAssessment {
  readOnly: true;
  advisoryOnly: true;
  canonicalOwner: 'Self-Evolution Execution V1';
  passToken: string;
  version: 'V1';
  generatedAt: string;
  gapDetectionProven: boolean;
  proposalGenerationProven: boolean;
  world2ExperimentationProven: boolean;
  impactMeasurementProven: boolean;
  promotionPathProven: boolean;
  productionProtectionProven: boolean;
  evolutionProofStatus: 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN';
  gapsDetected: number;
  proposalsGenerated: number;
  experimentsCompleted: number;
  promotionsCompleted: number;
  gapAssessment: EvolutionGapAssessment;
  proposals: readonly EvolutionProposal[];
  experimentResults: readonly EvolutionExperimentResult[];
  impactAssessments: readonly EvolutionImpactAssessment[];
  approvalDecisions: readonly EvolutionApprovalDecision[];
  registry: EvolutionRegistry;
  productionProtection: ProductionProtectionProof;
}
