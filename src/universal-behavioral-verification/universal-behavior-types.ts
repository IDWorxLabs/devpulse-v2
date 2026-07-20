/**
 * Universal Behavioral Verification Engine V1 — canonical behavior types.
 *
 * Domain-neutral behavioral descriptors. Product names never influence verification.
 */

import { createHash } from 'node:crypto';

export const UNIVERSAL_BEHAVIORAL_VERIFICATION_VERSION = '1.0.0' as const;
export const UNIVERSAL_BEHAVIORAL_VERIFICATION_SOURCE = 'UNIVERSAL_BEHAVIORAL_VERIFICATION_ENGINE_V1' as const;

export type BehaviorCategory =
  | 'CRUD'
  | 'ACTION'
  | 'WORKFLOW'
  | 'RELATIONSHIP'
  | 'RUNTIME_STATE'
  | 'BUSINESS_RULE'
  | 'NAVIGATION'
  | 'VALIDATION'
  | 'PERSISTENCE'
  | 'FILTERING'
  | 'SORTING'
  | 'SEARCH'
  | 'PAGINATION'
  | 'SELECTION'
  | 'EXPORT'
  | 'IMPORT'
  | 'PREFERENCES'
  | 'AUDIT'
  | 'NOTIFICATION'
  | 'AUTHENTICATION'
  | 'AUTHORIZATION'
  | 'FILE_OPERATION'
  | 'SCHEDULING'
  | 'ANALYTICS'
  | 'REPORTING'
  | 'ERROR_HANDLING'
  | 'RECOVERY'
  | 'CUSTOM';

export type BehaviorVerificationStrategy =
  | 'runtime_execution'
  | 'state_verification'
  | 'persistence_verification'
  | 'navigation_verification'
  | 'rule_verification'
  | 'workflow_verification'
  | 'runtime_event_verification'
  | 'behavioral_replay'
  | 'deterministic_simulation';

export type BehaviorVerificationClassification =
  | 'VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'BLOCKED'
  | 'FAILED'
  | 'INVALID_BEHAVIOR'
  | 'UNSUPPORTED'
  | 'NOT_REQUIRED'
  | 'NOT_EXECUTED';

export type BehaviorCriticality = 'REQUIRED' | 'OPTIONAL' | 'INFORMATIONAL';

export interface UniversalBehaviorDescriptor {
  readonly readOnly: true;
  readonly behaviorId: string;
  readonly behaviorCategory: BehaviorCategory;
  readonly normalizedKey: string;
  readonly description: string;
  readonly sourceEnvelopePath: string;
  readonly moduleIds: readonly string[];
  readonly entityIds: readonly string[];
  readonly actionIds: readonly string[];
  readonly workflowIds: readonly string[];
  readonly relationshipIds: readonly string[];
  readonly runtimeRequirements: readonly string[];
  readonly expectedInputs: readonly string[];
  readonly expectedOutputs: readonly string[];
  readonly expectedStateChanges: readonly string[];
  readonly expectedPersistenceChanges: readonly string[];
  readonly expectedNavigation: readonly string[];
  readonly expectedEvents: readonly string[];
  readonly expectedBusinessRules: readonly string[];
  readonly verificationStrategy: BehaviorVerificationStrategy;
  readonly verificationEvidence: readonly string[];
  readonly criticality: BehaviorCriticality;
  readonly provenance: readonly string[];
  readonly fingerprint: string;
  readonly supportClassification: 'EXECUTABLE' | 'BLOCKED' | 'NOT_REQUIRED' | 'INVALID';
}

export interface RawApprovedBehavior {
  readonly label: string;
  readonly behaviorCategory: BehaviorCategory;
  readonly sourceEnvelopePath: string;
  readonly moduleId?: string;
  readonly entityId?: string;
  readonly actionId?: string;
  readonly workflowId?: string;
  readonly relationshipId?: string;
  readonly capabilityKey?: string;
  readonly ruleId?: string;
  readonly routePath?: string;
  readonly criticality?: BehaviorCriticality;
  readonly supportClassification?: UniversalBehaviorDescriptor['supportClassification'];
}

export interface BehaviorVerificationEvidence {
  readonly behaviorId: string;
  readonly runtimeEvidence: Record<string, unknown>;
  readonly timestamp: string;
  readonly verificationMethod: BehaviorVerificationStrategy;
  readonly result: BehaviorVerificationClassification;
  readonly observedOutputs: readonly string[];
  readonly expectedOutputs: readonly string[];
  readonly differences: readonly string[];
  readonly provenance: readonly string[];
  readonly fingerprint: string;
}

export interface BehaviorVerificationResultEntry {
  readonly behaviorId: string;
  readonly classification: BehaviorVerificationClassification;
  readonly passed: boolean;
  readonly evidence: BehaviorVerificationEvidence;
  readonly checks: readonly { readonly id: string; readonly passed: boolean; readonly detail: string }[];
  readonly diagnosisCodes: readonly string[];
}

export interface UniversalBehaviorVerificationReport {
  readonly reportId: string;
  readonly generatedAt: string;
  readonly totalBehaviors: number;
  readonly verifiedCount: number;
  readonly partiallyVerifiedCount: number;
  readonly blockedCount: number;
  readonly failedCount: number;
  readonly invalidCount: number;
  readonly unsupportedCount: number;
  readonly notRequiredCount: number;
  readonly notExecutedCount: number;
  readonly coveragePercent: number;
  readonly silentSkipCount: number;
  readonly staticShellCount: number;
  readonly results: readonly BehaviorVerificationResultEntry[];
  readonly traceabilityChains: readonly BehaviorTraceabilityChain[];
}

export interface BehaviorTraceabilityChain {
  readonly behaviorId: string;
  readonly approvedBehaviorPath: string;
  readonly descriptorFingerprint: string;
  readonly runtimeArtifactPaths: readonly string[];
  readonly executionEvidenceId: string;
  readonly engineeringReportPath: string;
}

export interface BehaviorVerificationPlan {
  readonly planId: string;
  readonly behaviorIds: readonly string[];
  readonly strategies: Readonly<Record<string, BehaviorVerificationStrategy>>;
  readonly runtimeRequired: boolean;
  readonly generatedAt: string;
}

export interface BehaviorVerificationMaterializationInput {
  readonly envelope: import('../contract-bound-generation-authority-v4/approved-production-build-envelope.js').ApprovedProductionBuildEnvelope;
  readonly appTitle: string;
  readonly moduleIds: readonly string[];
  readonly contractId: string;
  readonly crudBacked: boolean;
  readonly actionBacked: boolean;
  readonly workflowBacked: boolean;
  readonly relationshipBacked: boolean;
  readonly runtimeBacked: boolean;
  readonly ruleBacked: boolean;
  readonly capabilityPackBacked: boolean;
  readonly rawPrompt?: string;
}

export interface BehaviorExecutionContext {
  readonly envelope: import('../contract-bound-generation-authority-v4/approved-production-build-envelope.js').ApprovedProductionBuildEnvelope;
  readonly workspaceFiles: readonly import('../code-generation-engine/code-generation-engine-types.js').GeneratedWorkspaceFile[];
  readonly materializationInput: BehaviorVerificationMaterializationInput;
}

export function stableBehaviorId(
  category: BehaviorCategory,
  normalizedKey: string,
  anchor: string,
): string {
  const digest = createHash('sha256')
    .update(`${category}|${normalizedKey}|${anchor}`)
    .digest('hex')
    .slice(0, 16);
  return `behavior.${category.toLowerCase()}.${normalizedKey.replace(/\./g, '-')}.${digest}`;
}

export function fingerprintBehavior(descriptor: UniversalBehaviorDescriptor): string {
  const payload = [
    descriptor.behaviorCategory,
    descriptor.normalizedKey,
    descriptor.sourceEnvelopePath,
    descriptor.moduleIds.join(','),
    descriptor.verificationStrategy,
    descriptor.supportClassification,
    // Rule discriminator: BUSINESS_RULE behaviors all normalize to the same key ('rule.evaluate'),
    // so without the specific rule identity the fingerprint cannot tell two genuinely-distinct rules
    // on the same module/source apart (e.g. a FIELD_VALIDATION and a POLICY rule derived from the
    // same concept sentence). Including it keeps distinct rules distinct while still collapsing true
    // duplicates. Empty for non-rule behaviors, so their fingerprints are unaffected relative to
    // one another.
    descriptor.expectedBusinessRules.join(','),
  ].join('|');
  return createHash('sha256').update(payload).digest('hex').slice(0, 24);
}
