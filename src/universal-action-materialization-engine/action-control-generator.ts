/**
 * Universal Action Materialization Engine V1 — control generation.
 */

import type { UniversalActionDescriptor } from './universal-action-types.js';
import { escActionString } from './universal-action-types.js';

export function generateActionControlJsx(descriptor: UniversalActionDescriptor): string {
  const id = descriptor.actionId;
  const label = escActionString(descriptor.label);
  const blocked = descriptor.supportClassification === 'BLOCKED_BY_FUTURE_CAPABILITY';
  const invalid = descriptor.supportClassification === 'INVALID_ACTION_CONTRACT';
  const informational = descriptor.supportClassification === 'NOT_EXECUTABLE_INFORMATIONAL';
  const disabled = blocked || invalid;
  const className = resolveButtonClass(descriptor.controlKind);
  const ariaLabel = escActionString(`${descriptor.label}${blocked ? ' (blocked)' : ''}`);

  if (descriptor.controlKind === 'navigation-link') {
    return `<button
          type="button"
          data-interaction-control="true"
          data-universal-action-engine="v1"
          data-action="${id}"
          data-action-semantic="${descriptor.semanticType}"
          data-action-classification="${descriptor.supportClassification}"
          aria-label="${ariaLabel}"
          className="${className}"
          disabled={actions.pending || ${disabled ? 'true' : 'false'}}
          onClick={() => actions.executeAction('${id}')}
        >
          ${label}
        </button>`;
  }

  if (informational) {
    return `<span
          data-universal-action-engine="v1"
          data-action="${id}"
          data-action-classification="${descriptor.supportClassification}"
          className="universal-action-informational"
        >
          ${label}
        </span>`;
  }

  return `<button
          type="button"
          data-interaction-control="true"
          data-universal-action-engine="v1"
          data-action="${id}"
          data-action-semantic="${descriptor.semanticType}"
          data-action-classification="${descriptor.supportClassification}"
          aria-label="${ariaLabel}"
          className="${className}"
          disabled={actions.pending || ${disabled ? 'true' : 'false'}}
          onClick={() => actions.executeAction('${id}')}
        >
          ${label}
        </button>`;
}

export function generateActionToolbarJsx(descriptors: readonly UniversalActionDescriptor[]): string {
  if (descriptors.length === 0) return '';
  const controls = descriptors.map(generateActionControlJsx).join('\n        ');
  return `
      <div className="universal-action-toolbar" data-universal-action-toolbar="true">
        ${controls}
      </div>`;
}

function resolveButtonClass(kind: UniversalActionDescriptor['controlKind']): string {
  switch (kind) {
    case 'destructive-button':
      return 'universal-action-btn universal-action-btn-danger';
    case 'primary-button':
    case 'form-submit':
      return 'universal-action-btn universal-action-btn-primary';
    case 'bulk-action':
      return 'universal-action-btn universal-action-btn-bulk';
    default:
      return 'universal-action-btn';
  }
}

export function generateActionModuleCss(): string {
  return `.universal-action-toolbar { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0.75rem 0; }
.universal-action-btn { border: 1px solid #cbd5e1; background: #fff; border-radius: 8px; padding: 0.35rem 0.75rem; cursor: pointer; }
.universal-action-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.universal-action-btn-primary { background: #2563eb; color: #fff; border-color: transparent; }
.universal-action-btn-danger { background: #dc2626; color: #fff; border-color: transparent; }
.universal-action-btn-bulk { background: #7c3aed; color: #fff; border-color: transparent; }
.universal-action-informational { color: #64748b; font-size: 0.875rem; }
.universal-action-blocked { background: #fef2f2; border: 1px solid #fecaca; padding: 0.5rem 0.75rem; border-radius: 8px; color: #991b1b; }
.universal-action-confirm { background: #fffbeb; border: 1px solid #fde68a; padding: 0.75rem; border-radius: 8px; margin: 0.5rem 0; }
`;
}
