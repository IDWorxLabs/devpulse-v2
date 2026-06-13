/**
 * Data Model Summarizer — entities, relationships, ownership (V1).
 */

import type {
  ArchitectureDataModelSummary,
  ArchitectureEvidenceBundle,
} from './architecture-brief-types.js';

let entityCounter = 0;

export function resetDataModelCounterForTests(): void {
  entityCounter = 0;
}

function inferRelationships(entities: readonly string[], workflows: readonly string[]): string[] {
  const relationships: string[] = [];
  if (entities.includes('user') && entities.includes('order')) {
    relationships.push('user owns orders');
  }
  if (entities.includes('user') && entities.includes('product')) {
    relationships.push('products belong to catalog accessible by users');
  }
  if (entities.includes('account') && entities.includes('user')) {
    relationships.push('users belong to accounts');
  }
  if (workflows.some((w) => /checkout|billing/i.test(w)) && entities.includes('order')) {
    relationships.push('orders linked to checkout workflow');
  }
  return relationships;
}

function inferOwnershipModels(roles: readonly string[], businessRules: readonly string[]): string[] {
  const models: string[] = [];
  if (roles.includes('admin')) models.push('Admin-managed resource ownership');
  if (roles.length >= 2) models.push('Role-based resource ownership');
  if (businessRules.some((r) => /approve|approval/i.test(r))) {
    models.push('Approval-gated ownership transitions');
  }
  if (models.length === 0 && roles.length === 1) {
    models.push('Single-role user ownership model');
  }
  return models;
}

function inferPermissions(roles: readonly string[], businessRules: readonly string[]): string[] {
  const permissions: string[] = [];
  for (const role of roles) {
    permissions.push(`${role}: authenticated access to assigned screens and workflows`);
  }
  if (businessRules.some((r) => /admin must approve/i.test(r))) {
    permissions.push('admin: approve checkout and billing actions');
  }
  if (roles.includes('user') && !roles.includes('admin')) {
    permissions.push('user: limited write access without admin privileges');
  }
  return permissions;
}

export function summarizeDataModel(bundle: ArchitectureEvidenceBundle): ArchitectureDataModelSummary {
  const entities = bundle.dataEntities.length > 0
    ? bundle.dataEntities
    : inferEntitiesFromWorkflows(bundle);

  const entityItems = entities.map((name) => {
    entityCounter += 1;
    return {
      readOnly: true as const,
      entityId: `entity-${entityCounter}`,
      name,
      evidence: [`ENTITY:${name}`, ...bundle.sources.slice(0, 2)],
    };
  });

  return {
    readOnly: true,
    entities: entityItems,
    relationships: inferRelationships(entities, bundle.workflows),
    ownershipModels: inferOwnershipModels(bundle.userRoles, bundle.businessRules),
    permissions: inferPermissions(bundle.userRoles, bundle.businessRules),
  };
}

function inferEntitiesFromWorkflows(bundle: ArchitectureEvidenceBundle): string[] {
  const inferred = new Set<string>(['user']);
  if (bundle.workflows.some((w) => /checkout|order|billing/i.test(w))) inferred.add('order');
  if (bundle.integrations.some((i) => /stripe|payment/i.test(i))) inferred.add('payment');
  return [...inferred];
}
