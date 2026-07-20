/**
 * Autonomous Engineering Intelligence V1 — canonical types.
 */

import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import type { ProductionReadinessReport } from '../universal-production-readiness/universal-production-readiness-types.js';
import type { UniversalCapabilityCompositionPlan } from '../universal-capability-composition-engine/universal-capability-composition-types.js';
import type { UniversalBehaviorVerificationReport } from '../universal-behavioral-verification/universal-behavior-types.js';
import type { CapabilityCoverageSnapshot } from '../universal-capability-coverage/universal-capability-coverage-types.js';

export const AUTONOMOUS_ENGINEERING_INTELLIGENCE_VERSION = '1.0.0' as const;
export const AUTONOMOUS_ENGINEERING_INTELLIGENCE_SOURCE = 'AUTONOMOUS_ENGINEERING_INTELLIGENCE_V1' as const;

export type RepairEligibility =
  | 'AUTONOMOUSLY_REPAIRABLE'
  | 'AUTONOMOUSLY_REPAIRABLE_WITH_GUARDS'
  | 'REQUIRES_EXISTING_GENERATOR_REEXECUTION'
  | 'REQUIRES_CONFIGURATION'
  | 'REQUIRES_NEW_CAPABILITY'
  | 'REQUIRES_NEW_CAPABILITY_PACK'
  | 'REQUIRES_PROVIDER_IMPLEMENTATION'
  | 'REQUIRES_HUMAN_ARCHITECTURAL_DECISION'
  | 'BLOCKED_BY_MISSING_EVIDENCE'
  | 'BLOCKED_BY_CONTRADICTION'
  | 'BLOCKED_BY_SECURITY_POLICY'
  | 'BLOCKED_BY_MUTATION_BOUNDARY'
  | 'UNSAFE_FOR_AUTONOMOUS_REPAIR'
  | 'INVALID_FINDING'
  | 'ALREADY_RESOLVED'
  | 'NOT_APPLICABLE';

export type RepairSafetyClassification =
  | 'SAFE_DETERMINISTIC'
  | 'SAFE_WITH_TARGETED_VALIDATION'
  | 'GUARDED_PRODUCTION_MUTATION'
  | 'HIGH_RISK_REQUIRES_HUMAN'
  | 'FORBIDDEN'
  | 'UNKNOWN';

export type RepairCategory =
  | 'MISSING_ARTIFACT'
  | 'MISSING_REGISTRATION'
  | 'MISSING_ROUTE'
  | 'MISSING_NAVIGATION_ENTRY'
  | 'MISSING_HANDLER'
  | 'MISSING_RUNTIME_SCOPE'
  | 'MISSING_RUNTIME_EVENT'
  | 'MISSING_WORKFLOW_TRANSITION'
  | 'MISSING_RELATIONSHIP_WIRING'
  | 'MISSING_RULE_WIRING'
  | 'MISSING_PERSISTENCE_ADAPTER'
  | 'MISSING_CONFIGURATION_BINDING'
  | 'MISSING_VERIFICATION_SCENARIO'
  | 'MISSING_TRACEABILITY_LINK'
  | 'MISSING_EVIDENCE_EMISSION'
  | 'MATERIALIZATION_MISMATCH'
  | 'UNDECLARED_CONTRIBUTION'
  | 'CONTRIBUTION_COLLISION'
  | 'STATIC_SHELL_REPLACEMENT'
  | 'FALSE_READINESS_CLAIM'
  | 'FALSE_COVERAGE_CLAIM'
  | 'PROVIDER_ASSIGNMENT_MISMATCH'
  | 'GENERATOR_REEXECUTION'
  | 'CUSTOM_EXTENSION_REQUIRED';

export type RootCauseCode =
  | 'GENERATOR_DID_NOT_EMIT'
  | 'GENERATOR_OUTPUT_DROPPED'
  | 'PIPELINE_INPUT_MISMATCH'
  | 'CONTRIBUTION_NOT_REGISTERED'
  | 'RUNTIME_NOT_CONNECTED'
  | 'HANDLER_NOT_CONNECTED'
  | 'RULE_NOT_CONNECTED'
  | 'WORKFLOW_TRANSITION_NOT_MATERIALIZED'
  | 'RELATIONSHIP_ADAPTER_MISSING'
  | 'VERIFICATION_PLAN_INCOMPLETE'
  | 'EVIDENCE_ADAPTER_MISSING'
  | 'COVERAGE_RECONCILIATION_INCOMPLETE'
  | 'STATIC_FALLBACK_REPLACED_RUNTIME'
  | 'IDENTIFIER_COLLISION'
  | 'PATH_COLLISION'
  | 'CONFIGURATION_MISSING'
  | 'DEPENDENCY_MISSING'
  | 'CAPABILITY_NOT_IMPLEMENTED'
  | 'PROVIDER_NOT_IMPLEMENTED'
  | 'CONSTITUTIONAL_INPUT_INVALID'
  | 'UNKNOWN_ROOT_CAUSE';

export type MutationType =
  | 'CREATE_GENERATED_FILE'
  | 'REGENERATE_GENERATED_FILE'
  | 'PATCH_GENERATED_SYMBOL'
  | 'REGISTER_EXISTING_CONTRIBUTION'
  | 'CONNECT_EXISTING_ADAPTER'
  | 'REMOVE_UNDECLARED_GENERATED_FILE'
  | 'RESOLVE_DETERMINISTIC_COLLISION'
  | 'ADD_VERIFICATION_ENTRY'
  | 'ADD_EVIDENCE_ADAPTER'
  | 'NORMALIZE_IDENTIFIER'
  | 'RESTORE_EXPECTED_GENERATED_CONTENT';

export type RepairOutcome =
  | 'REPAIR_SUCCEEDED'
  | 'REPAIR_PARTIALLY_SUCCEEDED'
  | 'REPAIR_BLOCKED'
  | 'REPAIR_FAILED'
  | 'REPAIR_ROLLED_BACK'
  | 'REPAIR_REQUIRES_NEW_CAPABILITY'
  | 'REPAIR_REQUIRES_CONFIGURATION'
  | 'REPAIR_REQUIRES_HUMAN_DECISION'
  | 'REPAIR_UNSAFE'
  | 'REPAIR_NOT_REQUIRED'
  | 'REPAIR_INVALIDATED_BY_INPUT_CHANGE';

export type RepairLoopState =
  | 'NOT_REQUESTED'
  | 'FINDINGS_RECEIVED'
  | 'ANALYZING'
  | 'PLAN_CREATED'
  | 'PLAN_VALIDATED'
  | 'REPAIRING'
  | 'VALIDATING'
  | 'RECONCILING'
  | 'REEVALUATING_READINESS'
  | 'SUCCEEDED'
  | 'PARTIALLY_SUCCEEDED'
  | 'BLOCKED'
  | 'FAILED'
  | 'ROLLED_BACK'
  | 'HUMAN_REQUIRED';

export interface AutonomousEngineeringFinding {
  readonly findingId: string;
  readonly diagnosticCode: string;
  readonly sourceAuthority: string;
  readonly sourceEvaluationId: string;
  readonly sourceFingerprint: string;
  readonly severity: string;
  readonly criticality: string;
  readonly readinessDimension: string;
  readonly requirementIds: readonly string[];
  readonly behaviorIds: readonly string[];
  readonly capabilityKeys: readonly string[];
  readonly providerIds: readonly string[];
  readonly packIds: readonly string[];
  readonly contributionIds: readonly string[];
  readonly artifactPaths: readonly string[];
  readonly routeIds: readonly string[];
  readonly runtimeScopeIds: readonly string[];
  readonly actionIds: readonly string[];
  readonly workflowIds: readonly string[];
  readonly relationshipIds: readonly string[];
  readonly ruleIds: readonly string[];
  readonly expectedState: string;
  readonly observedState: string;
  readonly missingEvidence: readonly string[];
  readonly contradictionEvidence: readonly string[];
  readonly provenance: readonly string[];
  readonly traceability: readonly string[];
  readonly fingerprint: string;
}

export interface RepairStrategyDescriptor {
  readonly strategyId: string;
  readonly strategyVersion: string;
  readonly supportedDiagnosticCodes: readonly string[];
  readonly supportedRepairCategories: readonly RepairCategory[];
  readonly requiredSourceAuthorities: readonly string[];
  readonly requiredExistingGenerators: readonly string[];
  readonly mutationAllowlist: readonly string[];
  readonly mutationDenylist: readonly string[];
  readonly supportedArtifactPatterns: readonly string[];
  readonly safetyClassification: RepairSafetyClassification;
  readonly productionSupportStatus: 'PRODUCTION_READY' | 'FUNCTIONAL_REFERENCE';
  readonly maximumAttempts: number;
  readonly provenance: readonly string[];
  readonly fingerprint: string;
}

export interface EligibilityDecision {
  readonly findingId: string;
  readonly eligibility: RepairEligibility;
  readonly repairCategory: RepairCategory;
  readonly rootCause: RootCauseCode;
  readonly safetyClassification: RepairSafetyClassification;
  readonly rejectionReason?: string;
}

export interface SourceMutationRecord {
  readonly mutationId: string;
  readonly strategyId: string;
  readonly targetPath: string;
  readonly targetAuthority: string;
  readonly mutationType: MutationType;
  readonly expectedBeforeFingerprint: string;
  readonly expectedAfterFingerprint: string;
  readonly contributionIds: readonly string[];
  readonly requirementIds: readonly string[];
  readonly behaviorIds: readonly string[];
  readonly reason: string;
  readonly rollbackData: string;
  readonly provenance: readonly string[];
}

export interface AutonomousEngineeringPlan {
  readonly readOnly: true;
  readonly planId: string;
  readonly envelopeFingerprint: string;
  readonly workspaceFingerprint: string;
  readonly readinessEvaluationFingerprint: string;
  readonly sourceFindingIds: readonly string[];
  readonly eligibilityDecisions: readonly EligibilityDecision[];
  readonly selectedStrategies: readonly { readonly findingId: string; readonly strategyId: string }[];
  readonly rejectedStrategies: readonly { readonly findingId: string; readonly strategyId: string; readonly reason: string }[];
  readonly executionOrder: readonly string[];
  readonly validationPlan: readonly string[];
  readonly maximumAttempts: number;
  readonly unresolvedFindings: readonly string[];
  readonly humanRequiredFindings: readonly string[];
  readonly provenance: readonly string[];
  readonly fingerprint: string;
}

export interface AutonomousEngineeringInput {
  readonly envelope: ApprovedProductionBuildEnvelope;
  readonly workspaceFiles: GeneratedWorkspaceFile[];
  readonly compositionPlan: UniversalCapabilityCompositionPlan | null;
  readonly behaviorReport: UniversalBehaviorVerificationReport | null;
  readonly coverageSnapshot: CapabilityCoverageSnapshot | null;
  readonly readinessReport: ProductionReadinessReport | null;
  readonly moduleIds: readonly string[];
  readonly contractId: string;
}

export interface AutonomousEngineeringExecutionResult {
  readonly outcome: RepairOutcome;
  readonly loopState: RepairLoopState;
  readonly appliedMutations: readonly SourceMutationRecord[];
  readonly rolledBackMutations: readonly SourceMutationRecord[];
  readonly resolvedFindingIds: readonly string[];
  readonly unresolvedFindingIds: readonly string[];
  readonly workspaceFiles: GeneratedWorkspaceFile[];
  readonly readinessBefore: string;
  readonly readinessAfter: string;
  readonly targetedValidators: readonly string[];
  readonly validatorResults: readonly { readonly validatorId: string; readonly passed: boolean; readonly detail: string }[];
}

export interface AutonomousEngineeringReport {
  readonly readOnly: true;
  readonly plan: AutonomousEngineeringPlan;
  readonly execution: AutonomousEngineeringExecutionResult | null;
  readonly findingsAnalyzed: number;
  readonly repairableCount: number;
  readonly humanRequiredCount: number;
  readonly traceabilityComplete: boolean;
  readonly diagnostics: readonly { readonly code: string; readonly detail: string }[];
}
