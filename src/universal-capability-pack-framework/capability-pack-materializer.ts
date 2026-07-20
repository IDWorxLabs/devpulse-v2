/**
 * Universal Capability Pack Framework V1 — pack materialization.
 */

import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import { materializePreferencesPack } from '../universal-capability-packs/universal-preferences-pack/index.js';
import { materializeAuditTrailPack } from '../universal-capability-packs/universal-audit-trail-pack/index.js';
import { materializeDataExportPackBasic } from '../universal-capability-packs/universal-data-export-pack-basic/index.js';
import { materializeSchedulingPack } from '../universal-capability-packs/universal-scheduling-pack/index.js';
import { materializeSynchronizationPack } from '../universal-capability-packs/universal-synchronization-pack/index.js';
import type { CapabilityCompositionPlan } from './universal-capability-pack-types.js';
import { detectContributionCollisions, type PackContribution } from './capability-pack-collision-detector.js';
import { getPack } from './capability-pack-registry.js';
import { enforceLifecycleOrder } from './capability-pack-lifecycle.js';

const MATERIALIZERS: Record<string, (config: Readonly<Record<string, unknown>>) => GeneratedWorkspaceFile[]> = {
  'universal-preferences-pack': materializePreferencesPack,
  'universal-audit-trail-pack': materializeAuditTrailPack,
  'universal-data-export-pack-basic': materializeDataExportPackBasic,
  'universal-scheduling-pack': materializeSchedulingPack,
  'universal-synchronization-pack': materializeSynchronizationPack,
};

export interface PackMaterializationResult {
  readonly files: GeneratedWorkspaceFile[];
  readonly contributions: readonly PackContribution[];
  readonly collisionIssues: ReturnType<typeof detectContributionCollisions>;
  readonly lifecycleValid: boolean;
  readonly blockedPackIds: readonly string[];
}

export function materializeSelectedPacks(plan: CapabilityCompositionPlan): PackMaterializationResult {
  const files: GeneratedWorkspaceFile[] = [];
  const contributions: PackContribution[] = [];
  const blockedPackIds: string[] = [];
  const lifecycleStages: ReturnType<typeof enforceLifecycleOrder> extends boolean ? never[] : string[] = [];

  for (const packSelection of plan.selectedPacks) {
    const pack = getPack(packSelection.packId);
    if (!pack) {
      blockedPackIds.push(packSelection.packId);
      continue;
    }
    if (pack.supportStatus === 'NOT_IMPLEMENTED') {
      blockedPackIds.push(packSelection.packId);
      continue;
    }
    const materializer = MATERIALIZERS[packSelection.packId];
    if (!materializer) {
      blockedPackIds.push(packSelection.packId);
      continue;
    }
    const packFiles = materializer(packSelection.configuration);
    for (const file of packFiles) {
      contributions.push({ packId: packSelection.packId, relativePath: file.relativePath });
    }
    for (const scope of pack.runtimeScopes) {
      contributions.push({ packId: packSelection.packId, runtimeScopeId: scope });
    }
    for (const action of pack.actions) {
      contributions.push({ packId: packSelection.packId, actionId: action });
    }
    files.push(...packFiles);
    if (packSelection.packId === 'universal-audit-trail-pack') {
      files.push(generateAuditIntegrationHooks());
    }
  }

  const collisionIssues = detectContributionCollisions(contributions);
  const lifecycleValid = enforceLifecycleOrder(['DISCOVERED', 'VALIDATED', 'RESOLVED', 'CONFIGURED', 'COMPOSED', 'MATERIALIZED']);

  files.push({
    relativePath: 'src/universal-capability-packs/composition-plan.json',
    content: `${JSON.stringify(plan, null, 2)}\n`,
  });

  files.push({
    relativePath: 'src/universal-capability-packs/runtime/registry.ts',
    content: generateCapabilityPackRegistrySource(plan),
  });

  return { files, contributions, collisionIssues, lifecycleValid, blockedPackIds };
}

function generateCapabilityPackRegistrySource(plan: CapabilityCompositionPlan): string {
  const packIds = plan.selectedPacks.map((p) => p.packId);
  return `/** Universal Capability Pack runtime registry — generated */
export const CAPABILITY_PACK_REGISTRY = ${JSON.stringify(packIds, null, 2)} as const;
export type RegisteredCapabilityPackId = (typeof CAPABILITY_PACK_REGISTRY)[number];
export const CAPABILITY_COMPOSITION_FINGERPRINT = '${plan.fingerprint}';
export const CAPABILITY_PACK_FRAMEWORK_MARKER = 'v1';

export function isCapabilityPackRegistered(packId: string): boolean {
  return (CAPABILITY_PACK_REGISTRY as readonly string[]).includes(packId);
}
`;
}

export function buildCapabilityPackSharedRuntimeFiles(): GeneratedWorkspaceFile[] {
  return [
    {
      relativePath: 'src/universal-capability-packs/runtime/types.ts',
      content: `/** Universal Capability Pack shared types */
export type CapabilityPackLifecycleStage =
  | 'DISCOVERED' | 'VALIDATED' | 'RESOLVED' | 'CONFIGURED' | 'COMPOSED'
  | 'MATERIALIZED' | 'REGISTERED' | 'INITIALIZED' | 'VERIFIED' | 'PRODUCTION_READY' | 'BLOCKED' | 'FAILED';

export type CapabilityPackSupportStatus =
  | 'PRODUCTION_READY' | 'FUNCTIONAL_REFERENCE' | 'NOT_IMPLEMENTED' | 'BLOCKED_BY_DEPENDENCY';

export interface CapabilityPackState {
  packId: string;
  stage: CapabilityPackLifecycleStage;
  ready: boolean;
  blockedReason?: string;
}
`,
    },
    {
      relativePath: 'src/universal-capability-packs/runtime/index.ts',
      content: `export * from './types';
export * from './registry';
`,
    },
  ];
}

/** Generates audit integration hooks for B1 CRUD services to call at execution boundaries. */
export function generateAuditIntegrationHooks(): GeneratedWorkspaceFile {
  return {
    relativePath: 'src/universal-capability-packs/audit-trail/audit-integration-hooks.ts',
    content: `/** Audit trail B1/B2/B3/B4 integration hooks — call at execution boundaries */
import { recordAuditEvent } from './audit-trail-runtime';

export function auditCrudCreate(targetType: string, targetId: string): void {
  recordAuditEvent({ eventType: 'crud/create', targetType, targetId, outcome: 'SUCCESS', provenance: ['B1', 'audit-trail-pack'] });
}

export function auditCrudUpdate(targetType: string, targetId: string): void {
  recordAuditEvent({ eventType: 'crud/update', targetType, targetId, outcome: 'SUCCESS', provenance: ['B1', 'audit-trail-pack'] });
}

export function auditCrudDelete(targetType: string, targetId: string): void {
  recordAuditEvent({ eventType: 'crud/delete', targetType, targetId, outcome: 'SUCCESS', provenance: ['B1', 'audit-trail-pack'] });
}

export function auditActionExecution(actionId: string, targetId: string, outcome: 'SUCCESS' | 'FAILURE' | 'BLOCKED'): void {
  recordAuditEvent({ eventType: 'action/' + actionId, targetType: 'action', targetId, outcome, provenance: ['B2', 'audit-trail-pack'] });
}

export function auditWorkflowTransition(workflowId: string, targetId: string, outcome: 'SUCCESS' | 'FAILURE' | 'BLOCKED'): void {
  recordAuditEvent({ eventType: 'workflow/transition', targetType: workflowId, targetId, outcome, provenance: ['B3', 'audit-trail-pack'] });
}

export function auditRelationshipMutation(relationshipId: string, targetId: string, outcome: 'SUCCESS' | 'FAILURE' | 'BLOCKED'): void {
  recordAuditEvent({ eventType: 'relationship/mutation', targetType: relationshipId, targetId, outcome, provenance: ['B4', 'audit-trail-pack'] });
}

export function auditRuleBlock(ruleId: string, targetId: string): void {
  recordAuditEvent({ eventType: 'rule/blocked', targetType: 'rule', targetId, outcome: 'BLOCKED', provenance: ['B6', 'audit-trail-pack'] });
}
`,
  };
}

/** Optional: augment CRUD service to invoke audit hooks (non-breaking if pattern matches). */
export function augmentServiceWithAuditTrail(serviceSource: string, moduleId: string, auditPackActive: boolean): string {
  if (!auditPackActive || serviceSource.includes('auditCrudCreate')) return serviceSource;
  let augmented = serviceSource;
  if (augmented.includes(`from './${moduleId}.repository'`)) {
    augmented = augmented.replace(
      `from './${moduleId}.repository'`,
      `from './${moduleId}.repository';\nimport { auditCrudCreate, auditCrudUpdate, auditCrudDelete } from '../../universal-capability-packs/audit-trail/audit-integration-hooks'`,
    );
  }
  const createReturn = augmented.match(/return create\w+Entity\(\{[\s\S]*?\}\);/);
  if (createReturn) {
    augmented = augmented.replace(createReturn[0], `auditCrudCreate('${moduleId}', newEntityId());\n  ${createReturn[0]}`);
  }
  return augmented;
}
