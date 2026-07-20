/**
 * Real Production Generation Capability Audit V1 — types.
 *
 * READ-ONLY audit milestone. Observes production generators vs ApprovedProductionBuildEnvelope.
 * Does not modify generators, authorities, or validators.
 */

export const REAL_PRODUCTION_GENERATION_CAPABILITY_AUDIT_V1_COMPLETE_TOKEN =
  'REAL_PRODUCTION_GENERATION_CAPABILITY_AUDIT_V1_COMPLETE';

export type FeatureMaterializationStatus =
  | 'FULLY_MATERIALIZED'
  | 'PARTIALLY_MATERIALIZED'
  | 'NOT_MATERIALIZED'
  | 'GENERATED_BUT_UNREACHABLE'
  | 'REACHABLE_BUT_NONFUNCTIONAL'
  | 'FUNCTIONAL_BUT_UNVERIFIED'
  | 'BLOCKED_BY_MISSING_CAPABILITY'
  | 'BLOCKED_BY_CONSTITUTIONAL_VIOLATION'
  | 'BLOCKED_BY_RUNTIME_FAILURE';

export type GeneratorFeatureSupportLevel =
  | 'FULL_SUPPORT'
  | 'PARTIAL_SUPPORT'
  | 'NO_SUPPORT'
  | 'FALLBACK_SUPPORT'
  | 'REPORT_ONLY_SUPPORT'
  | 'SIMULATED_SUPPORT';

export type InteractionProofDepth =
  | 'BEHAVIORAL'
  | 'STRUCTURAL_ONLY'
  | 'VISUAL_ONLY'
  | 'SYNTHETIC'
  | 'NOT_RUN';

export type FindingSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';

export type FailureCategory =
  | 'ARCHITECTURE_FAILURE'
  | 'CAPABILITY_FAILURE';

export type SystemicRootCauseCategory =
  | 'unsupported_feature_type'
  | 'approved_feature_dropped'
  | 'static_ui_substituted_for_behavior'
  | 'route_navigation_mismatch'
  | 'persistence_runtime_missing'
  | 'interaction_proof_too_shallow'
  | 'repair_path_not_real'
  | 'generator_fallback_template_path'
  | 'capability_exists_not_production_wired'
  | 'constitutional_pipeline_ok';

export interface AuditPromptScenario {
  readonly id: string;
  readonly label: string;
  readonly rawPrompt: string;
}

export interface ProductionCallGraphNode {
  readonly stage: string;
  readonly modulePath: string;
  readonly functionName: string;
  readonly consumesEnvelope: boolean;
  readonly producesArtifacts: readonly string[];
  readonly downstream: readonly string[];
}

export interface GeneratorCapabilityInventoryRow {
  readonly capability: string;
  readonly generator: string;
  readonly productionWired: 'YES' | 'PARTIAL' | 'NO' | 'SIMULATED';
  readonly coverage: GeneratorFeatureSupportLevel;
  readonly failureMode: string;
  readonly repairAvailable: string;
  readonly notes: string;
}

export interface FeatureMaterializationMatrixRow {
  readonly promptId: string;
  readonly promptLabel: string;
  readonly approvedFeature: string;
  readonly featureKind: 'MODULE' | 'NAVIGATION' | 'ACTION' | 'WORKFLOW' | 'ENTITY';
  readonly envelopeSource: string;
  readonly generatedFile: string | null;
  readonly route: string | null;
  readonly navigation: boolean;
  readonly visibleUi: boolean;
  readonly interactionWorks: boolean;
  readonly persistenceRuntime: boolean;
  readonly previewVerified: InteractionProofDepth;
  readonly status: FeatureMaterializationStatus;
  readonly failureReason: string | null;
}

export interface SilentSkipFinding {
  readonly id: string;
  readonly location: string;
  readonly pattern: string;
  readonly affectedStage: string;
  readonly severity: FindingSeverity;
  readonly description: string;
  readonly promptsAffected: readonly string[];
}

export interface StaticShellFinding {
  readonly id: string;
  readonly promptId: string | null;
  readonly featureId: string | null;
  readonly artifactPath: string;
  readonly shellKind: string;
  readonly severity: FindingSeverity;
  readonly description: string;
}

export interface MissingCapabilityFinding {
  readonly capability: string;
  readonly evidence: string;
  readonly severity: FindingSeverity;
  readonly promptsAffected: readonly string[];
  readonly approvedFeaturesAffected: number;
  readonly blocksAppGeneration: boolean;
}

export interface RepairPathFinding {
  readonly failureClass: string;
  readonly capabilityId: string;
  readonly productionWired: boolean;
  readonly safeToAutoRun: boolean;
  readonly actuallyRepairsMissingFeatureCode: boolean;
  readonly revalidationAfterRepair: boolean;
  readonly notes: string;
}

export interface PreviewVerificationFinding {
  readonly layer: string;
  readonly depth: InteractionProofDepth;
  readonly verifies: readonly string[];
  readonly doesNotVerify: readonly string[];
  readonly severity: FindingSeverity;
}

export interface RankedSystemicFinding {
  readonly id: string;
  readonly category: SystemicRootCauseCategory;
  readonly failureCategory: FailureCategory;
  readonly severity: FindingSeverity;
  readonly title: string;
  readonly description: string;
  readonly affectedFiles: readonly string[];
  readonly affectedProductionStage: string;
  readonly promptsAffected: number;
  readonly approvedFeaturesAffected: number;
  readonly blocksAppGeneration: boolean;
  readonly oneFixRemovesMultipleBlockers: boolean;
}

export interface ImplementationRoadmapMilestone {
  readonly order: number;
  readonly objective: string;
  readonly rootCausesEliminated: readonly SystemicRootCauseCategory[];
  readonly affectedGenerators: readonly string[];
  readonly affectedConstitutionalHandoffs: readonly string[];
  readonly productionIntegrationPoints: readonly string[];
  readonly validationStrategy: string;
  readonly expectedPromptsFeaturesUnlocked: readonly string[];
  readonly estimatedBlastRadius: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface PromptAuditResult {
  readonly scenario: AuditPromptScenario;
  readonly envelopeValid: boolean;
  readonly approvedModuleCount: number;
  readonly materializedModuleCount: number;
  readonly blockedModuleCount: number;
  readonly matrixRows: readonly FeatureMaterializationMatrixRow[];
  readonly buildPlanModuleIds: readonly string[];
  readonly envelopeModuleIds: readonly string[];
  readonly generatedModuleIds: readonly string[];
}

export interface RealProductionGenerationCapabilityAuditReport {
  readonly readOnly: true;
  readonly auditedAt: string;
  readonly completionToken: typeof REAL_PRODUCTION_GENERATION_CAPABILITY_AUDIT_V1_COMPLETE_TOKEN;
  readonly executiveSummary: string;
  readonly closenessAssessment: string;
  readonly architectureFailures: readonly RankedSystemicFinding[];
  readonly capabilityFailures: readonly RankedSystemicFinding[];
  readonly callGraph: readonly ProductionCallGraphNode[];
  readonly generatorCapabilityInventory: readonly GeneratorCapabilityInventoryRow[];
  readonly promptResults: readonly PromptAuditResult[];
  readonly materializationMatrix: readonly FeatureMaterializationMatrixRow[];
  readonly silentSkipInventory: readonly SilentSkipFinding[];
  readonly staticShellInventory: readonly StaticShellFinding[];
  readonly missingCapabilityInventory: readonly MissingCapabilityFinding[];
  readonly repairPathFindings: readonly RepairPathFinding[];
  readonly previewVerificationFindings: readonly PreviewVerificationFinding[];
  readonly rankedSystemicFindings: readonly RankedSystemicFinding[];
  readonly implementationRoadmap: readonly ImplementationRoadmapMilestone[];
}
