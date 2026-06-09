/**
 * DevPulse V2 Phase 16.8 — Verification Registry types.
 * Central registry metadata only — no verification execution or orchestration.
 */

export const VERIFICATION_REGISTRY_PASS_TOKEN = 'VERIFICATION_REGISTRY_V1_PASS';
export const VERIFICATION_REGISTRY_OWNER_MODULE = 'devpulse_v2_verification_registry';

export type VerificationTargetCategory =
  | 'WORLD2_TARGET'
  | 'PREVIEW_TARGET'
  | 'SELF_VISION_TARGET'
  | 'UI_INSPECTION_TARGET'
  | 'INTERACTION_TARGET'
  | 'VISUAL_VERIFICATION_TARGET'
  | 'RUNTIME_TARGET'
  | 'COMMAND_CENTER_TARGET'
  | 'PROJECT_VAULT_TARGET'
  | 'OPERATOR_FEED_TARGET'
  | 'TRUST_TARGET';

export type VerificationRegistryState = 'REGISTERED' | 'READY' | 'BLOCKED';

export type OwnerStatus = 'REGISTERED' | 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export const INITIAL_VERIFICATION_TARGET_CATEGORIES: readonly VerificationTargetCategory[] = [
  'WORLD2_TARGET',
  'PREVIEW_TARGET',
  'SELF_VISION_TARGET',
  'UI_INSPECTION_TARGET',
  'INTERACTION_TARGET',
  'VISUAL_VERIFICATION_TARGET',
  'RUNTIME_TARGET',
  'COMMAND_CENTER_TARGET',
  'PROJECT_VAULT_TARGET',
  'OPERATOR_FEED_TARGET',
  'TRUST_TARGET',
] as const;

export const FORBIDDEN_VERIFICATION_REGISTRY_DUPLICATES = [
  'verification_orchestrator',
  'verification_evidence_engine',
  'verification_reporting_engine',
  'auto_fix_engine',
  'uvl_monolith',
  'runtime_brain',
] as const;

export const VERIFICATION_REGISTRY_QUESTION_SIGNALS = [
  'what can be verified',
  'what owns this verification target',
  'what dependencies exist',
  'what evidence is required',
  'what verification requirements exist',
  'verification registry',
  'verification targets',
  'verification dependencies',
  'verification requirements',
  'verification owners',
  'verification capabilities',
  'why is verification registry blocked',
] as const;

export interface VerificationTarget {
  verificationTargetId: string;
  verificationTargetName: string;
  verificationCategory: VerificationTargetCategory;
  ownerModule: string;
  phase: number;
  dependencies: string[];
  requirements: string[];
  supportedEvidence: string[];
  createdAt: number;
  registryOnly: true;
}

export interface VerificationOwnerRecord {
  ownerModule: string;
  ownerDomain: string;
  ownerPhase: number;
  ownerCapability: string;
  ownerStatus: OwnerStatus;
  registryOnly: true;
}

export interface VerificationDependencyRecord {
  dependencyId: string;
  targetId: string;
  upstreamDependencies: string[];
  downstreamDependencies: string[];
  verificationBlockers: string[];
  verificationPrerequisites: string[];
  registryOnly: true;
}

export interface VerificationRequirementRecord {
  requirementId: string;
  targetId: string;
  requiredEvidence: string[];
  requiredDependencies: string[];
  requiredStates: string[];
  requiredOwnership: string[];
  requiredVerificationCapabilities: string[];
  registryOnly: true;
}

export interface VerificationCapabilityRecord {
  capabilityId: string;
  targetId: string;
  supportedModes: string[];
  futureExpansion: string[];
  registryOnly: true;
}

export interface VerificationRegistryReport {
  reportId: string;
  registryState: VerificationRegistryState;
  targetCount: number;
  dependencyCount: number;
  requirementCount: number;
  capabilityCount: number;
  verificationTargets: VerificationTarget[];
  verificationDependencies: VerificationDependencyRecord[];
  verificationRequirements: VerificationRequirementRecord[];
  warnings: string[];
  blockedReasons: string[];
  createdAt: number;
  registryOnly: true;
}

export interface VerificationRegistryDiagnostics {
  verificationRegistryActive: boolean;
  verificationTargetCount: number;
  verificationDependencyCount: number;
  verificationRequirementCount: number;
  lastQuery: string | null;
  lastState: VerificationRegistryState | null;
}

export interface PrepareVerificationRegistryInput {
  query?: string;
  projectId?: string;
  workspaceId?: string;
  projectExists?: boolean;
  workspaceExists?: boolean;
  world1Protected?: boolean;
  ownershipValid?: boolean;
  suppressRuntimeBootstrap?: boolean;
}

export interface PrepareVerificationRegistryResult {
  registryReport: VerificationRegistryReport;
  diagnostics: VerificationRegistryDiagnostics;
  verificationTargets: VerificationTarget[];
  verificationDependencies: VerificationDependencyRecord[];
  verificationRequirements: VerificationRequirementRecord[];
  responseText: string;
}

export function isVerificationRegistryQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();
  return VERIFICATION_REGISTRY_QUESTION_SIGNALS.some((s) => lower.includes(s));
}

export function isVerificationRegistryAdvisoryQuestion(question: string): boolean {
  return isVerificationRegistryQuestion(question);
}

export function isDuplicateVerificationRegistryQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return FORBIDDEN_VERIFICATION_REGISTRY_DUPLICATES.some((d) => lower.includes(d));
}
