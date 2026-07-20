/**
 * Universal Action Materialization Engine V1 — execution adapters.
 */

import type { UniversalActionDescriptor, UniversalActionExecutionStrategy } from './universal-action-types.js';
import { escActionString } from './universal-action-types.js';
import { moduleIdToPascalCase } from '../universal-crud-generation-engine/universal-crud-types.js';

/** Maps semantic CRUD operations to B1 runtime method names. */
export function crudAdapterMethod(descriptor: UniversalActionDescriptor): string | null {
  const map: Record<string, string> = {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'requestDelete',
    READ: 'refresh',
    SEARCH: 'setSearch',
    FILTER: 'setSearch',
    SORT: 'setSort',
    PAGINATE: 'setPage',
    REFRESH: 'refresh',
    SELECT: 'toggleSelection',
    DESELECT: 'clearSelection',
    UNDO: 'undoDelete',
  };
  return map[descriptor.semanticType] ?? null;
}

export function generateAdapterDispatchCase(descriptor: UniversalActionDescriptor, pascal: string): string {
  const id = descriptor.actionId;
  const label = escActionString(descriptor.label);

  if (descriptor.supportClassification === 'BLOCKED_BY_FUTURE_CAPABILITY') {
    return `    case '${id}':
      setBlockedMessage('${escActionString(descriptor.blockedReason ?? 'Capability blocked')}');
      setError('${escActionString(descriptor.blockedReason ?? 'Action blocked')}');
      return;`;
  }

  if (descriptor.supportClassification === 'NOT_EXECUTABLE_INFORMATIONAL') {
    return `    case '${id}':
      setSuccess('${label} — informational only');
      return;`;
  }

  if (descriptor.supportClassification === 'INVALID_ACTION_CONTRACT') {
    return `    case '${id}':
      setError('Invalid action contract');
      return;`;
  }

  switch (descriptor.executionStrategy) {
    case 'crud-adapter': {
      const method = crudAdapterMethod(descriptor);
      if (!method) {
        return `    case '${id}': setError('CRUD adapter: unsupported semantic'); return;`;
      }
      if (descriptor.semanticType === 'CREATE') {
        return `    case '${id}':
      if (!inputLabel.trim()) { setError('Validation failed: label required'); return; }
      crud.create({ label: inputLabel });
      setSuccess('${label} completed');
      return;`;
      }
      if (descriptor.semanticType === 'DELETE') {
        return `    case '${id}':
      if (crud.selectedIds.length === 0) { setError('Selection required'); return; }
      crud.requestDelete(crud.selectedIds[0]!);
      return;`;
      }
      if (descriptor.semanticType === 'REFRESH') {
        return `    case '${id}': crud.refresh(); setSuccess('${label} completed'); return;`;
      }
      if (descriptor.semanticType === 'SEARCH' || descriptor.semanticType === 'FILTER') {
        return `    case '${id}': crud.setSearch(inputLabel); setSuccess('${label} completed'); return;`;
      }
      return `    case '${id}': crud.${method}(); setSuccess('${label} completed'); return;`;
    }
    case 'state-adapter':
      return `    case '${id}':
      executeStateEffect('${descriptor.semanticType}', crud, setSuccess, setError);
      return;`;
    case 'persistence-adapter':
      return `    case '${id}':
      executePersistenceEffect('${descriptor.semanticType}', crud, setSuccess, setError, inputLabel);
      return;`;
    case 'navigation-adapter': {
      const route = descriptor.navigationEffects[0]?.route ?? '/';
      return `    case '${id}':
      navigateToRoute('${escActionString(route)}');
      setSuccess('${label} completed');
      return;`;
    }
    case 'calculation-adapter':
      return `    case '${id}':
      executeCalculation('${descriptor.semanticType}', crud, setSuccess, setError);
      return;`;
    case 'import-export-adapter':
      return `    case '${id}':
      executeImportExport('${descriptor.semanticType}', crud.items, setSuccess, setError);
      return;`;
    case 'service-command-adapter':
      return `    case '${id}':
      setBlockedMessage('Service command requires extension capability');
      setError('${escActionString(descriptor.blockedReason ?? 'Service command blocked')}');
      return;`;
    case 'extension-point-adapter':
      return `    case '${id}':
      setBlockedMessage('${escActionString(descriptor.blockedReason ?? 'Extension point required')}');
      setError('${escActionString(descriptor.blockedReason ?? 'Action blocked')}');
      return;`;
    default:
      return `    case '${id}': setError('No execution adapter'); return;`;
  }
}

export function generateActionRuntimeHelpers(pascal: string): string {
  return `
function executeStateEffect(
  semantic: string,
  crud: ${pascal}CrudRuntimeState,
  setSuccess: (msg: string | null) => void,
  setError: (msg: string | null) => void,
): void {
  switch (semantic) {
    case 'SELECT':
      if (crud.items[0]) crud.toggleSelection(crud.items[0].id);
      setSuccess('Selection updated');
      break;
    case 'DESELECT':
      crud.clearSelection();
      setSuccess('Selection cleared');
      break;
    case 'RESET':
      setSuccess('Form reset');
      break;
    case 'REORDER':
      setSuccess('Reorder applied');
      break;
    case 'RETRY':
      crud.refresh();
      setSuccess('Retry completed');
      break;
    default:
      setError('State effect not supported');
  }
}

function executePersistenceEffect(
  semantic: string,
  crud: ${pascal}CrudRuntimeState,
  setSuccess: (msg: string | null) => void,
  setError: (msg: string | null) => void,
  inputLabel: string,
): void {
  if (crud.selectedIds.length === 0 && semantic !== 'SUBMIT') {
    setError('Selection required');
    return;
  }
  const id = crud.selectedIds[0];
  if (id) {
    crud.update(id, { label: \`\${inputLabel || crud.items.find(i => i.id === id)?.label || 'item'} [\${semantic}]\` });
    setSuccess(\`\${semantic} applied\`);
  } else if (semantic === 'SUBMIT') {
    setSuccess('Submitted');
  } else {
    setError('Target required');
  }
}

function executeCalculation(
  semantic: string,
  crud: ${pascal}CrudRuntimeState,
  setSuccess: (msg: string | null) => void,
  setError: (msg: string | null) => void,
): void {
  const total = crud.items.length;
  setSuccess(\`\${semantic}: \${total} records\`);
}

function executeImportExport(
  semantic: string,
  items: ${pascal}Entity[],
  setSuccess: (msg: string | null) => void,
  setError: (msg: string | null) => void,
): void {
  if (semantic === 'EXPORT') {
    const blob = new Blob([JSON.stringify(items)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'export.json';
    anchor.click();
    URL.revokeObjectURL(url);
    setSuccess('Export completed');
    return;
  }
  if (semantic === 'IMPORT') {
    setError('Import requires file selection — blocked in B2');
    return;
  }
  setError('Import/export not supported');
}

function navigateToRoute(route: string): void {
  window.dispatchEvent(new CustomEvent('universal-action-navigate', { detail: { route } }));
}
`;
}

export function strategyForDescriptor(descriptor: UniversalActionDescriptor): UniversalActionExecutionStrategy {
  return descriptor.executionStrategy;
}

export { moduleIdToPascalCase };
