/**
 * Universal Relationship Intelligence Engine V1 — relationship form controls.
 */

import type { UniversalRelationshipDescriptor } from './universal-relationship-types.js';
import { escRelationshipString } from './universal-relationship-types.js';

export function generateRelationshipFormControlsJsx(
  descriptors: readonly UniversalRelationshipDescriptor[],
  moduleId: string,
): string {
  const relevant = descriptors.filter(
    (d) => d.sourceModuleId === moduleId && d.supportClassification !== 'BLOCKED_BY_FUTURE_CAPABILITY',
  );
  if (relevant.length === 0) return '';

  return relevant
    .map((d) => {
      const isMulti = d.cardinality === 'MANY_TO_MANY';
      const required = !d.targetOptional;
      return `
        <div className="universal-relationship-form-control" data-relationship-id="${d.relationshipId}" data-cardinality="${d.cardinality}">
          <label htmlFor="${moduleId}-rel-${d.relationshipId}">
            ${escRelationshipString(d.label)}${required ? ' *' : ''}
          </label>
          <select
            id="${moduleId}-rel-${d.relationshipId}"
            data-interaction-control="true"
            data-relationship-selector="true"
            ${isMulti ? 'multiple' : ''}
            value={relationshipSelections['${d.relationshipId}'] ?? ''}
            onChange={(e) => relationship.setSelection('${d.relationshipId}', e.target.value)}
            aria-required={${required ? 'true' : 'false'}}
          >
            <option value="">Select related record</option>
            {relationship.relatedOptions['${d.relationshipId}']?.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
          {relationship.validationErrors['${d.relationshipId}'] ? (
            <p className="universal-relationship-validation" data-error="true">{relationship.validationErrors['${d.relationshipId}']}</p>
          ) : null}
        </div>`;
    })
    .join('\n');
}
