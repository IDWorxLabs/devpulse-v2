/**
 * Universal Relationship Intelligence Engine V1 — related-record UI.
 */

import type { UniversalRelationshipDescriptor } from './universal-relationship-types.js';
import { escRelationshipString } from './universal-relationship-types.js';

export function generateRelationshipPanelJsx(
  descriptors: readonly UniversalRelationshipDescriptor[],
  moduleId: string,
): string {
  const relevant = descriptors.filter(
    (d) =>
      (d.sourceModuleId === moduleId || d.targetModuleId === moduleId) &&
      d.supportClassification !== 'NOT_EXECUTABLE_INFORMATIONAL',
  );
  if (relevant.length === 0) return '';

  const lists = relevant
    .map((d) => {
      const inverse = d.targetModuleId === moduleId;
      return `
        <section className="universal-relationship-related-list" data-relationship-id="${d.relationshipId}" data-inverse="${inverse}">
          <header>
            <h4>${escRelationshipString(d.label)}</h4>
            <span data-related-count="true">{relationship.relatedCounts['${d.relationshipId}'] ?? 0}</span>
          </header>
          <ul data-related-query="true">
            {(relationship.relatedLists['${d.relationshipId}'] ?? []).map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  data-interaction-control="true"
                  data-relationship-navigate="true"
                  data-target-route="${inverse ? d.sourceRoute : d.targetRoute}"
                  onClick={() => relationship.navigateToRelated('${d.relationshipId}', item.id, ${inverse})}
                >
                  {item.label}
                </button>
                <button
                  type="button"
                  data-interaction-control="true"
                  data-relationship-unlink="true"
                  onClick={() => relationship.dispatchRelationshipEvent('relationship:unlink', {
                    relationshipId: '${d.relationshipId}',
                    sourceId: ${inverse ? 'item.id' : 'relationship.activeRecordId'},
                    targetId: ${inverse ? 'relationship.activeRecordId' : 'item.id'},
                  })}
                >
                  Unlink
                </button>
              </li>
            ))}
          </ul>
          {(relationship.relatedLists['${d.relationshipId}'] ?? []).length === 0 ? (
            <p className="universal-relationship-empty" data-empty="true">No related records</p>
          ) : null}
        </section>`;
    })
    .join('\n');

  const controls = relevant
    .filter((d) => d.sourceModuleId === moduleId)
    .map(
      (d) => `<button
          type="button"
          data-interaction-control="true"
          data-relationship-link="true"
          data-universal-relationship-engine="v1"
          onClick={() => relationship.dispatchRelationshipEvent('relationship:link', {
            relationshipId: '${d.relationshipId}',
            sourceId: relationship.activeRecordId,
            targetId: relationshipSelections['${d.relationshipId}'] ?? '',
          })}
        >
          Link ${escRelationshipString(d.targetEntityId)}
        </button>`,
    )
    .join('\n        ');

  const blocked = relevant.find((d) => d.supportClassification === 'BLOCKED_BY_FUTURE_CAPABILITY');

  return `
      <div className="universal-relationship-container" data-universal-relationship-engine="v1">
        <header className="universal-relationship-header">
          <h3>Related records</h3>
        </header>
        ${blocked ? `<p className="universal-relationship-blocked" data-blocked="true">${escRelationshipString(blocked.blockedReason ?? 'Relationship blocked')}</p>` : ''}
        ${lists}
        <div className="universal-relationship-controls">
          ${controls}
        </div>
        {relationship.relationshipError ? <p className="universal-relationship-error" data-error="true">{relationship.relationshipError}</p> : null}
        {relationship.relationshipSuccess ? <p className="universal-relationship-success" data-success="true">{relationship.relationshipSuccess}</p> : null}
      </div>`;
}

export function generateRelationshipModuleCss(): string {
  return `.universal-relationship-container { border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem; margin: 0.75rem 0; }
.universal-relationship-header { margin-bottom: 0.5rem; }
.universal-relationship-controls { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.5rem; }
.universal-relationship-related-list { margin: 0.5rem 0; padding: 0.5rem; background: #f8fafc; border-radius: 6px; }
.universal-relationship-form-control { margin: 0.5rem 0; display: grid; gap: 0.25rem; }
.universal-relationship-error { color: #dc2626; }
.universal-relationship-success { color: #16a34a; }
.universal-relationship-blocked { color: #991b1b; background: #fef2f2; padding: 0.5rem; border-radius: 8px; }
.universal-relationship-empty { color: #64748b; font-style: italic; }
.universal-relationship-validation { color: #dc2626; font-size: 0.875rem; }
`;
}

export function detectStaticRelationshipShell(source: string): boolean {
  return (
    (/related records|relationship/i.test(source) &&
      !/dispatchRelationshipEvent|data-relationship-link|data-related-query/.test(source)) ||
    (/foreign.?key/i.test(source) && !/data-relationship-selector/.test(source))
  );
}
