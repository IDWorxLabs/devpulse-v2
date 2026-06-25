/**
 * Universal Feature Contract Intelligence V1 — dynamic validation plan generator.
 */

import { getPrimaryEntity } from './universal-feature-contract-builder.js';
import type {
  FeatureRealityValidationPlan,
  FeatureRealityValidationStep,
  UniversalFeatureContract,
  UniversalFeatureEntity,
} from './universal-feature-contract-types.js';

function entitySelectors(
  entity: UniversalFeatureEntity,
  contract: UniversalFeatureContract,
): Record<string, string> {
  const slug = entity.slug;
  const hasTaskFilters =
    contract.productProfile === 'TASK_TRACKER_WEB_V1' &&
    contract.actions.some((action) => action.id.includes('filter') && action.required);
  const selectors: Record<string, string> = {
    featureRoot: '.universal-feature',
    input: `[data-testid="${slug}-input"]`,
    addButton: `[data-testid="add-${slug}-button"]`,
    recordText: `[data-testid="${slug}-text"]`,
    editButton: `[data-testid="edit-${slug}-button"]`,
    editInput: `[data-testid="edit-${slug}-input"]`,
    saveButton: `[data-testid="save-${slug}-button"]`,
    deleteButton: `[data-testid="delete-${slug}-button"]`,
    formError: `[data-testid="${slug}-form-error"]`,
    statusMessage: `[data-testid="${slug}-status-message"]`,
    count: `[data-testid="${slug}-count"]`,
    completeToggle: `[data-testid="complete-${slug}-toggle"]`,
    filterActive: '[data-testid="filter-active"]',
    filterCompleted: '[data-testid="filter-completed"]',
    completedItem: '.universal-record.is-completed',
  };
  if (!hasTaskFilters) {
    selectors.searchInput = `[data-testid="search-${slug}-input"]`;
  }
  return selectors;
}

function sampleRecordText(entity: UniversalFeatureEntity, profile: UniversalFeatureContract['productProfile']): string {
  switch (profile) {
    case 'CRM_WEB_V1':
      return 'Acme Corp';
    case 'INVENTORY_WEB_V1':
      return 'Widget A';
    case 'SCHOOL_MANAGEMENT_WEB_V1':
      return 'Jane Student';
    case 'PROJECT_MANAGEMENT_WEB_V1':
      return 'Launch Website';
    case 'EXPENSE_TRACKER_WEB_V1':
    case 'FINANCE_TRACKER_WEB_V1':
      return 'Coffee expense';
    case 'QR_APP':
      return 'https://example.com';
    case 'TASK_TRACKER_WEB_V1':
    default:
      return 'Buy groceries';
  }
}

function editedRecordText(entity: UniversalFeatureEntity, profile: UniversalFeatureContract['productProfile']): string {
  switch (profile) {
    case 'CRM_WEB_V1':
      return 'Acme Holdings';
    case 'INVENTORY_WEB_V1':
      return 'Widget B';
    case 'SCHOOL_MANAGEMENT_WEB_V1':
      return 'Jane Smith';
    case 'PROJECT_MANAGEMENT_WEB_V1':
      return 'Website Relaunch';
    case 'EXPENSE_TRACKER_WEB_V1':
    case 'FINANCE_TRACKER_WEB_V1':
      return 'Updated expense';
    case 'QR_APP':
      return 'https://example.org';
    case 'TASK_TRACKER_WEB_V1':
    default:
      return 'Published task';
  }
}

export function generateFeatureRealityValidationPlan(
  contract: UniversalFeatureContract,
): FeatureRealityValidationPlan {
  const primary = getPrimaryEntity(contract);
  const selectors = entitySelectors(primary, contract);
  const steps: FeatureRealityValidationStep[] = [];
  const sampleText = sampleRecordText(primary, contract.productProfile);
  const editedText = editedRecordText(primary, contract.productProfile);
  const requiredActions = contract.actions.filter((action) => action.required);

  steps.push({
    id: 'discover-primary-feature',
    kind: 'discover',
    entityId: primary.id,
    actionId: null,
    label: `User can locate ${primary.pluralLabel} feature via navigation`,
    critical: true,
    selectors: {
      sidenav: '.blueprint-sidenav',
      featureRoot: selectors.featureRoot,
    },
    sampleText,
  });

  if (requiredActions.some((action) => action.verb === 'create')) {
    steps.push({
      id: 'execute-create',
      kind: 'create',
      entityId: primary.id,
      actionId: requiredActions.find((action) => action.verb === 'create')?.id ?? null,
      label: `${requiredActions.find((action) => action.verb === 'create')?.label ?? 'Create'} executes successfully`,
      critical: true,
      selectors,
      sampleText,
    });
  }

  if (requiredActions.some((action) => action.verb === 'complete')) {
    steps.push({
      id: 'execute-complete',
      kind: 'complete',
      entityId: primary.id,
      actionId: requiredActions.find((action) => action.verb === 'complete')?.id ?? null,
      label: 'Complete action executes successfully',
      critical: true,
      selectors,
      sampleText: 'Complete me',
    });
  }

  if (requiredActions.some((action) => action.verb === 'update')) {
    steps.push({
      id: 'execute-edit',
      kind: 'edit',
      entityId: primary.id,
      actionId: requiredActions.find((action) => action.verb === 'update')?.id ?? null,
      label: `${requiredActions.find((action) => action.verb === 'update')?.label ?? 'Edit'} updates rendered record`,
      critical: true,
      selectors,
      sampleText: 'Draft record',
      editedText,
    });
  }

  if (requiredActions.some((action) => action.verb === 'delete')) {
    steps.push({
      id: 'execute-delete',
      kind: 'delete',
      entityId: primary.id,
      actionId: requiredActions.find((action) => action.verb === 'delete')?.id ?? null,
      label: `${requiredActions.find((action) => action.verb === 'delete')?.label ?? 'Delete'} removes rendered record`,
      critical: true,
      selectors,
      sampleText: 'Temporary record',
    });
  }

  const searchActions = requiredActions.filter((action) => action.verb === 'search');
  if (searchActions.length > 0) {
    const filterAction = searchActions.find((action) => action.id.includes('filter'));
    if (filterAction && contract.productProfile === 'TASK_TRACKER_WEB_V1') {
      steps.push({
        id: 'execute-filter',
        kind: 'search',
        entityId: primary.id,
        actionId: filterAction.id,
        label: 'Filter locates records by state',
        critical: true,
        selectors,
        sampleText: 'Active item',
        editedText: 'Done item',
      });
    } else {
      steps.push({
        id: 'execute-search',
        kind: 'search',
        entityId: primary.id,
        actionId: searchActions[0]?.id ?? null,
        label: 'Search locates created records',
        critical: true,
        selectors,
        sampleText,
      });
    }
  }

  steps.push({
    id: 'persistence-route-change',
    kind: 'persistence-route',
    entityId: primary.id,
    actionId: null,
    label: 'Record state persists across route change',
    critical: true,
    selectors,
    sampleText: 'Persist me',
  });

  steps.push({
    id: 'persistence-reload',
    kind: 'persistence-reload',
    entityId: primary.id,
    actionId: null,
    label: 'Record state persists after reload',
    critical: true,
    selectors,
    sampleText: 'Persist me',
  });

  steps.push({
    id: 'recovery-invalid-input',
    kind: 'recovery',
    entityId: primary.id,
    actionId: null,
    label: 'Invalid input shows validation and app remains usable',
    critical: false,
    selectors,
    sampleText: 'Recovered record',
  });

  steps.push({
    id: 'ux-action-feedback',
    kind: 'ux-feedback',
    entityId: primary.id,
    actionId: null,
    label: 'Feature action feedback shown to user',
    critical: false,
    selectors,
    sampleText,
  });

  steps.push({
    id: 'ux-no-dead-end',
    kind: 'ux-actionable',
    entityId: primary.id,
    actionId: null,
    label: 'Feature surface remains actionable',
    critical: false,
    selectors,
    sampleText,
  });

  return {
    planVersion: '1.0',
    contractId: contract.contractId,
    productProfile: contract.productProfile,
    primaryEntityId: primary.id,
    navLabel: primary.navLabel,
    featureRootSelector: selectors.featureRoot,
    storageKey: primary.storageKey,
    steps,
  };
}
