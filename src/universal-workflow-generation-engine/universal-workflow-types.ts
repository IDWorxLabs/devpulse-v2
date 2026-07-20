/**
 * Universal Workflow Generation Engine V1 — domain-agnostic types.
 */

import type { CbgaCanonicalContractEvidence } from '../contract-bound-generation-authority-v4/contract-bound-generation-types.js';
import type { ApprovedModulePlan } from '../contract-bound-generation-authority-v4/approved-module-plan.js';

export const UNIVERSAL_WORKFLOW_GENERATION_ENGINE_VERSION = '1.0.0' as const;
export const UNIVERSAL_WORKFLOW_GENERATION_ENGINE_SOURCE = 'UNIVERSAL_WORKFLOW_GENERATION_ENGINE_V1' as const;

export type UniversalWorkflowSupportClassification =
  | 'FULLY_SUPPORTED'
  | 'LINEAR_SUPPORTED'
  | 'BRANCHING_SUPPORTED'
  | 'FORM_WORKFLOW_SUPPORTED'
  | 'APPROVAL_SUPPORTED'
  | 'CRUD_BACKED'
  | 'ACTION_BACKED'
  | 'PERSISTENCE_BACKED'
  | 'NAVIGATION_BACKED'
  | 'PARTIALLY_SUPPORTED'
  | 'EXTENSION_POINT_REQUIRED'
  | 'BLOCKED_BY_FUTURE_CAPABILITY'
  | 'INVALID_WORKFLOW_CONTRACT'
  | 'NOT_EXECUTABLE_INFORMATIONAL';

export type UniversalWorkflowVerificationClassification =
  | 'BEHAVIORALLY_VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'STRUCTURALLY_PRESENT_ONLY'
  | 'BLOCKED_BY_CAPABILITY'
  | 'INVALID'
  | 'NOT_RUN'
  | 'FAILED';

export type UniversalWorkflowStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'WAITING'
  | 'BLOCKED'
  | 'FAILED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'PAUSED';

export type UniversalWorkflowEventType =
  | 'NEXT'
  | 'PREVIOUS'
  | 'SUBMIT'
  | 'APPROVE'
  | 'REJECT'
  | 'CANCEL'
  | 'RETRY'
  | 'COMPLETE'
  | 'REOPEN'
  | 'SKIP'
  | 'SAVE_DRAFT';

export interface RawApprovedWorkflow {
  readonly label: string;
  readonly sourceEnvelopePath: string;
  readonly moduleId: string;
  readonly contractId: string;
  readonly featureType?: string;
}

export interface UniversalWorkflowGuard {
  readonly guardId: string;
  readonly kind: string;
  readonly message: string;
}

export interface UniversalWorkflowTransition {
  readonly transitionId: string;
  readonly fromStateId: string;
  readonly eventType: UniversalWorkflowEventType;
  readonly toStateId: string;
  readonly guardIds: readonly string[];
  readonly actionSemantic: string;
  readonly reversible: boolean;
  readonly retryable: boolean;
}

export interface UniversalWorkflowStep {
  readonly stepId: string;
  readonly label: string;
  readonly stateId: string;
  readonly progressWeight: number;
  readonly optional: boolean;
  readonly allowedEvents: readonly UniversalWorkflowEventType[];
}

export interface UniversalWorkflowState {
  readonly stateId: string;
  readonly label: string;
  readonly terminal: boolean;
  readonly failure: boolean;
}

export interface UniversalWorkflowDescriptor {
  readonly workflowId: string;
  readonly label: string;
  readonly description: string;
  readonly moduleId: string;
  readonly sourceEnvelopePaths: readonly string[];
  readonly entryStateId: string;
  readonly initialStepId: string;
  readonly states: readonly UniversalWorkflowState[];
  readonly steps: readonly UniversalWorkflowStep[];
  readonly transitions: readonly UniversalWorkflowTransition[];
  readonly guards: readonly UniversalWorkflowGuard[];
  readonly terminalStateIds: readonly string[];
  readonly failureStateIds: readonly string[];
  readonly supportClassification: UniversalWorkflowSupportClassification;
  readonly blockedReason?: string;
  readonly provenance: {
    readonly buildId: string;
    readonly promptHash: string;
  };
}

export interface UniversalWorkflowMaterializationInput {
  readonly moduleId: string;
  readonly moduleDisplayName: string;
  readonly moduleRoute: string;
  readonly appTitle: string;
  readonly contractId: string;
  readonly crudBacked: boolean;
  readonly actionBacked: boolean;
  readonly approvedRoutes: readonly string[];
  readonly canonicalProductContract: CbgaCanonicalContractEvidence;
  readonly approvedModulePlan: ApprovedModulePlan;
  readonly buildId: string;
  readonly promptHash: string;
}

export interface UniversalWorkflowBehaviorVerificationResult {
  readonly readOnly: true;
  readonly workflowId: string;
  readonly classification: UniversalWorkflowVerificationClassification;
  readonly passed: boolean;
  readonly checks: readonly { readonly id: string; readonly passed: boolean; readonly detail: string }[];
}

export interface UniversalWorkflowMaterializationReport {
  readonly readOnly: true;
  readonly engineVersion: typeof UNIVERSAL_WORKFLOW_GENERATION_ENGINE_VERSION;
  readonly moduleId: string;
  readonly totalApprovedWorkflows: number;
  readonly fullyMaterializedWorkflows: number;
  readonly partiallyMaterializedWorkflows: number;
  readonly blockedWorkflows: number;
  readonly invalidWorkflows: number;
  readonly behaviorallyVerifiedWorkflows: number;
  readonly behavioralCoveragePercent: number;
  readonly verifiedTransitions: number;
  readonly totalValidTransitions: number;
  readonly descriptors: readonly UniversalWorkflowDescriptor[];
  readonly verifications: readonly UniversalWorkflowBehaviorVerificationResult[];
}

export function stableWorkflowId(parts: readonly string[]): string {
  const raw = parts.join('|').toLowerCase().replace(/[^a-z0-9|_-]+/g, '-');
  let hash = 0;
  for (let i = 0; i < raw.length; i++) hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  return `workflow-${hash.toString(16).padStart(8, '0')}`;
}

export function escWorkflowString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/`/g, '\\`');
}
