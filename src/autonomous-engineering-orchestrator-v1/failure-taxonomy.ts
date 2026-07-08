/**
 * Autonomous Engineering Orchestrator V1 — unified failure taxonomy.
 *
 * A single, generic (never product-specific) set of build-failure classes that every upstream
 * diagnosis/evidence system can be normalized into. This taxonomy does not replace any existing
 * per-module classification (AeeBuildFailureClass, BuildRealityAutofixFailureClass, etc.) — it
 * sits one level above them so the orchestrator has one vocabulary to reason and report with.
 */

export const AEO_FAILURE_TAXONOMY_CONTRACT = 'AUTONOMOUS_ENGINEERING_ORCHESTRATOR_V1_TAXONOMY' as const;

export type AeoFailureClass =
  | 'PROMPT_UNDERSTANDING_FAILURE'
  | 'PROJECT_CONTEXT_FAILURE'
  | 'PRODUCT_IDENTITY_DRIFT'
  | 'CONTRACT_INCONSISTENCY'
  | 'UNAUTHORIZED_FALLBACK_MODULES'
  | 'MODULE_GENERATION_FAILURE'
  | 'MATERIALIZATION_FAILURE'
  | 'MANIFEST_STALENESS'
  | 'ROUTE_NAVIGATION_DRIFT'
  | 'PREVIEW_RUNTIME_FAILURE'
  | 'LIVE_PREVIEW_PROOF_FAILURE'
  | 'COMPILER_FAILURE'
  | 'DEPENDENCY_INSTALL_FAILURE'
  | 'VALIDATION_FAILURE'
  | 'STALE_EVIDENCE_FAILURE'
  | 'REPAIR_FAILED'
  | 'MISSING_REPAIR_CAPABILITY'
  | 'GENERATION_PIPELINE_NON_COMPLIANCE'
  | 'LEGACY_GENERATOR_DETECTED'
  | 'TEMPLATE_GENERATOR_DETECTED'
  | 'BLUEPRINT_BYPASS'
  | 'CONTRACT_TRACEABILITY_FAILURE'
  | 'GENERATOR_INPUT_BYPASS'
  | 'PIPELINE_COMPLIANCE_FAILURE'
  | 'UNKNOWN_FAILURE';

export const AEO_FAILURE_CLASSES: readonly AeoFailureClass[] = [
  'PROMPT_UNDERSTANDING_FAILURE',
  'PROJECT_CONTEXT_FAILURE',
  'PRODUCT_IDENTITY_DRIFT',
  'CONTRACT_INCONSISTENCY',
  'UNAUTHORIZED_FALLBACK_MODULES',
  'MODULE_GENERATION_FAILURE',
  'MATERIALIZATION_FAILURE',
  'MANIFEST_STALENESS',
  'ROUTE_NAVIGATION_DRIFT',
  'PREVIEW_RUNTIME_FAILURE',
  'LIVE_PREVIEW_PROOF_FAILURE',
  'COMPILER_FAILURE',
  'DEPENDENCY_INSTALL_FAILURE',
  'VALIDATION_FAILURE',
  'STALE_EVIDENCE_FAILURE',
  'REPAIR_FAILED',
  'MISSING_REPAIR_CAPABILITY',
  'GENERATION_PIPELINE_NON_COMPLIANCE',
  'LEGACY_GENERATOR_DETECTED',
  'TEMPLATE_GENERATOR_DETECTED',
  'BLUEPRINT_BYPASS',
  'CONTRACT_TRACEABILITY_FAILURE',
  'GENERATOR_INPUT_BYPASS',
  'PIPELINE_COMPLIANCE_FAILURE',
  'UNKNOWN_FAILURE',
];

export type AeoFailureSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Generic, product-agnostic build stage vocabulary. Every stage name here describes a phase of
 * the build pipeline itself (never a feature/domain), so the orchestrator can request a targeted
 * retry without ever encoding application-specific logic.
 */
export type AeoBuildStage =
  | 'PROMPT_UNDERSTANDING'
  | 'PROJECT_CONTEXT'
  | 'PLANNING'
  | 'WORKSPACE_MATERIALIZATION'
  | 'MODULE_GENERATION'
  | 'DEPENDENCY_INSTALL'
  | 'BUILD_COMPILE'
  | 'PREVIEW_STARTUP'
  | 'LIVE_PREVIEW_PROOF'
  | 'VALIDATION'
  | 'MANIFEST';

export interface AeoFailureClassMetadata {
  readOnly: true;
  failureClass: AeoFailureClass;
  defaultSeverity: AeoFailureSeverity;
  /** Generic description of which existing system family usually produces evidence for this class. */
  likelyOwnerSystem: string;
  defaultAffectedStages: AeoBuildStage[];
  /** Whether an automatic repair may ever be attempted for this class (subject to the planner's own safety rules). */
  repairMayBeAttempted: boolean;
  /** Whether, when no safe repair exists, this class should be routed into missing-capability planning. */
  missingCapabilityPlanningMayBeNeeded: boolean;
}

/**
 * One deterministic metadata row per failure class. This is the taxonomy's contract: given only a
 * failure class, callers can always read a default severity/owner/stage list without needing to
 * re-derive it from evidence. The diagnosis adapter may override severity/stages using real
 * evidence, but always starts from this table.
 */
export const AEO_FAILURE_CLASS_METADATA: Readonly<Record<AeoFailureClass, AeoFailureClassMetadata>> = {
  PROMPT_UNDERSTANDING_FAILURE: {
    readOnly: true,
    failureClass: 'PROMPT_UNDERSTANDING_FAILURE',
    defaultSeverity: 'HIGH',
    likelyOwnerSystem: 'intent-understanding-engine / prompt-faithful-generation',
    defaultAffectedStages: ['PROMPT_UNDERSTANDING'],
    repairMayBeAttempted: false,
    missingCapabilityPlanningMayBeNeeded: true,
  },
  PROJECT_CONTEXT_FAILURE: {
    readOnly: true,
    failureClass: 'PROJECT_CONTEXT_FAILURE',
    defaultSeverity: 'HIGH',
    likelyOwnerSystem: 'project-context-isolation-v4',
    defaultAffectedStages: ['PROJECT_CONTEXT'],
    repairMayBeAttempted: true,
    missingCapabilityPlanningMayBeNeeded: false,
  },
  PRODUCT_IDENTITY_DRIFT: {
    readOnly: true,
    failureClass: 'PRODUCT_IDENTITY_DRIFT',
    defaultSeverity: 'CRITICAL',
    likelyOwnerSystem: 'product-faithfulness-v2 (generation-faithfulness-repair)',
    defaultAffectedStages: ['MODULE_GENERATION', 'WORKSPACE_MATERIALIZATION'],
    repairMayBeAttempted: true,
    missingCapabilityPlanningMayBeNeeded: true,
  },
  CONTRACT_INCONSISTENCY: {
    readOnly: true,
    failureClass: 'CONTRACT_INCONSISTENCY',
    defaultSeverity: 'CRITICAL',
    likelyOwnerSystem: 'product-faithfulness-v2 (feature-contract-consistency)',
    defaultAffectedStages: ['MODULE_GENERATION', 'PLANNING'],
    repairMayBeAttempted: true,
    missingCapabilityPlanningMayBeNeeded: true,
  },
  UNAUTHORIZED_FALLBACK_MODULES: {
    readOnly: true,
    failureClass: 'UNAUTHORIZED_FALLBACK_MODULES',
    defaultSeverity: 'CRITICAL',
    likelyOwnerSystem: 'universal-prompt-to-app-materialization (module selection/fallback)',
    defaultAffectedStages: ['MODULE_GENERATION', 'WORKSPACE_MATERIALIZATION'],
    repairMayBeAttempted: false,
    missingCapabilityPlanningMayBeNeeded: true,
  },
  MODULE_GENERATION_FAILURE: {
    readOnly: true,
    failureClass: 'MODULE_GENERATION_FAILURE',
    defaultSeverity: 'HIGH',
    likelyOwnerSystem: 'code-generation-engine / engineering-intelligence-runtime',
    defaultAffectedStages: ['MODULE_GENERATION'],
    repairMayBeAttempted: true,
    missingCapabilityPlanningMayBeNeeded: true,
  },
  MATERIALIZATION_FAILURE: {
    readOnly: true,
    failureClass: 'MATERIALIZATION_FAILURE',
    defaultSeverity: 'HIGH',
    likelyOwnerSystem: 'workspace-materialization-stabilizer-v1 / universal-prompt-to-app-materialization',
    defaultAffectedStages: ['WORKSPACE_MATERIALIZATION'],
    repairMayBeAttempted: true,
    missingCapabilityPlanningMayBeNeeded: false,
  },
  MANIFEST_STALENESS: {
    readOnly: true,
    failureClass: 'MANIFEST_STALENESS',
    defaultSeverity: 'MEDIUM',
    likelyOwnerSystem: 'universal-prompt-to-app-materialization (generated-app-manifest)',
    defaultAffectedStages: ['MANIFEST'],
    repairMayBeAttempted: true,
    missingCapabilityPlanningMayBeNeeded: false,
  },
  ROUTE_NAVIGATION_DRIFT: {
    readOnly: true,
    failureClass: 'ROUTE_NAVIGATION_DRIFT',
    defaultSeverity: 'MEDIUM',
    likelyOwnerSystem: 'build-intent-routing / runtime-truth-authority',
    defaultAffectedStages: ['MODULE_GENERATION', 'MANIFEST'],
    repairMayBeAttempted: true,
    missingCapabilityPlanningMayBeNeeded: false,
  },
  PREVIEW_RUNTIME_FAILURE: {
    readOnly: true,
    failureClass: 'PREVIEW_RUNTIME_FAILURE',
    defaultSeverity: 'HIGH',
    likelyOwnerSystem: 'build-execution-stabilizer-v1 / autonomous-debugging-engine',
    defaultAffectedStages: ['PREVIEW_STARTUP'],
    repairMayBeAttempted: true,
    missingCapabilityPlanningMayBeNeeded: false,
  },
  LIVE_PREVIEW_PROOF_FAILURE: {
    readOnly: true,
    failureClass: 'LIVE_PREVIEW_PROOF_FAILURE',
    defaultSeverity: 'HIGH',
    likelyOwnerSystem: 'live-preview-gate / live-preview-interaction-proof-v1',
    defaultAffectedStages: ['LIVE_PREVIEW_PROOF'],
    repairMayBeAttempted: true,
    missingCapabilityPlanningMayBeNeeded: false,
  },
  COMPILER_FAILURE: {
    readOnly: true,
    failureClass: 'COMPILER_FAILURE',
    defaultSeverity: 'HIGH',
    likelyOwnerSystem: 'autonomous-engineering-executive (aee-build-autofix-loop) / build-reality-autofix-engine-v1',
    defaultAffectedStages: ['BUILD_COMPILE'],
    repairMayBeAttempted: true,
    missingCapabilityPlanningMayBeNeeded: false,
  },
  DEPENDENCY_INSTALL_FAILURE: {
    readOnly: true,
    failureClass: 'DEPENDENCY_INSTALL_FAILURE',
    defaultSeverity: 'MEDIUM',
    likelyOwnerSystem: 'autonomous-recovery-authority',
    defaultAffectedStages: ['DEPENDENCY_INSTALL'],
    repairMayBeAttempted: true,
    missingCapabilityPlanningMayBeNeeded: false,
  },
  VALIDATION_FAILURE: {
    readOnly: true,
    failureClass: 'VALIDATION_FAILURE',
    defaultSeverity: 'MEDIUM',
    likelyOwnerSystem: 'validation-runtime-governance-v1 / validation-budget',
    defaultAffectedStages: ['VALIDATION'],
    repairMayBeAttempted: false,
    missingCapabilityPlanningMayBeNeeded: false,
  },
  STALE_EVIDENCE_FAILURE: {
    readOnly: true,
    failureClass: 'STALE_EVIDENCE_FAILURE',
    defaultSeverity: 'MEDIUM',
    likelyOwnerSystem: 'fresh-build-artifact-isolation-v4',
    defaultAffectedStages: ['WORKSPACE_MATERIALIZATION', 'VALIDATION'],
    repairMayBeAttempted: true,
    missingCapabilityPlanningMayBeNeeded: false,
  },
  REPAIR_FAILED: {
    readOnly: true,
    failureClass: 'REPAIR_FAILED',
    defaultSeverity: 'HIGH',
    likelyOwnerSystem: 'the repair capability that was already attempted',
    defaultAffectedStages: [],
    repairMayBeAttempted: false,
    missingCapabilityPlanningMayBeNeeded: true,
  },
  MISSING_REPAIR_CAPABILITY: {
    readOnly: true,
    failureClass: 'MISSING_REPAIR_CAPABILITY',
    defaultSeverity: 'HIGH',
    likelyOwnerSystem: 'missing-capability-evolution-engine / capability-planning-engine',
    defaultAffectedStages: [],
    repairMayBeAttempted: false,
    missingCapabilityPlanningMayBeNeeded: true,
  },
  GENERATION_PIPELINE_NON_COMPLIANCE: {
    readOnly: true,
    failureClass: 'GENERATION_PIPELINE_NON_COMPLIANCE',
    defaultSeverity: 'CRITICAL',
    likelyOwnerSystem: 'generation-pipeline-compliance-authority-v1',
    defaultAffectedStages: ['MODULE_GENERATION', 'WORKSPACE_MATERIALIZATION'],
    repairMayBeAttempted: false,
    missingCapabilityPlanningMayBeNeeded: true,
  },
  LEGACY_GENERATOR_DETECTED: {
    readOnly: true,
    failureClass: 'LEGACY_GENERATOR_DETECTED',
    defaultSeverity: 'HIGH',
    likelyOwnerSystem: 'generation-pipeline-compliance-authority-v1',
    defaultAffectedStages: ['MODULE_GENERATION'],
    repairMayBeAttempted: false,
    missingCapabilityPlanningMayBeNeeded: true,
  },
  TEMPLATE_GENERATOR_DETECTED: {
    readOnly: true,
    failureClass: 'TEMPLATE_GENERATOR_DETECTED',
    defaultSeverity: 'HIGH',
    likelyOwnerSystem: 'generation-pipeline-compliance-authority-v1',
    defaultAffectedStages: ['MODULE_GENERATION', 'WORKSPACE_MATERIALIZATION'],
    repairMayBeAttempted: false,
    missingCapabilityPlanningMayBeNeeded: true,
  },
  BLUEPRINT_BYPASS: {
    readOnly: true,
    failureClass: 'BLUEPRINT_BYPASS',
    defaultSeverity: 'CRITICAL',
    likelyOwnerSystem: 'generation-pipeline-compliance-authority-v1',
    defaultAffectedStages: ['WORKSPACE_MATERIALIZATION'],
    repairMayBeAttempted: false,
    missingCapabilityPlanningMayBeNeeded: true,
  },
  CONTRACT_TRACEABILITY_FAILURE: {
    readOnly: true,
    failureClass: 'CONTRACT_TRACEABILITY_FAILURE',
    defaultSeverity: 'CRITICAL',
    likelyOwnerSystem: 'generation-pipeline-compliance-authority-v1',
    defaultAffectedStages: ['MODULE_GENERATION', 'WORKSPACE_MATERIALIZATION'],
    repairMayBeAttempted: false,
    missingCapabilityPlanningMayBeNeeded: true,
  },
  GENERATOR_INPUT_BYPASS: {
    readOnly: true,
    failureClass: 'GENERATOR_INPUT_BYPASS',
    defaultSeverity: 'CRITICAL',
    likelyOwnerSystem: 'generation-pipeline-compliance-authority-v1',
    defaultAffectedStages: ['MODULE_GENERATION', 'WORKSPACE_MATERIALIZATION'],
    repairMayBeAttempted: false,
    missingCapabilityPlanningMayBeNeeded: true,
  },
  PIPELINE_COMPLIANCE_FAILURE: {
    readOnly: true,
    failureClass: 'PIPELINE_COMPLIANCE_FAILURE',
    defaultSeverity: 'HIGH',
    likelyOwnerSystem: 'generation-pipeline-compliance-authority-v1',
    defaultAffectedStages: ['MODULE_GENERATION', 'WORKSPACE_MATERIALIZATION'],
    repairMayBeAttempted: false,
    missingCapabilityPlanningMayBeNeeded: true,
  },
  UNKNOWN_FAILURE: {
    readOnly: true,
    failureClass: 'UNKNOWN_FAILURE',
    defaultSeverity: 'HIGH',
    likelyOwnerSystem: 'none identified',
    defaultAffectedStages: [],
    repairMayBeAttempted: false,
    missingCapabilityPlanningMayBeNeeded: true,
  },
};
