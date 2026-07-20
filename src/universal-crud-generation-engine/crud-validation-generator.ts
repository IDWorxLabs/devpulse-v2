/**
 * Universal CRUD Generation Engine V1 — validation code generation.
 */

import type { UniversalCrudEntityGenerationInput } from './universal-crud-types.js';
import { escTsString, moduleIdToPascalCase } from './universal-crud-types.js';

export function generateCrudTypesSource(input: UniversalCrudEntityGenerationInput): string {
  const { descriptor, appTitle } = input;
  const pascal = moduleIdToPascalCase(descriptor.entityId);

  return `/** Universal CRUD entity types — ${escTsString(descriptor.displayName)} (${escTsString(appTitle)}) */
import type { CrudEntityBase } from '../../universal-crud-runtime/types';

export interface ${pascal}Entity extends CrudEntityBase {}

export interface ${pascal}FormInput {
  label: string;
}
`;
}

export function generateCrudValidationSource(input: UniversalCrudEntityGenerationInput): string {
  const { descriptor } = input;
  const pascal = moduleIdToPascalCase(descriptor.entityId);
  const constName = `${descriptor.entityKey.toUpperCase()}_CRUD_VALIDATION`;

  return `/** Universal CRUD validation — ${escTsString(descriptor.displayName)} */
import type { ${pascal}FormInput } from './${descriptor.entityId}.types';

export const ${constName} = {
  entityId: '${escTsString(descriptor.entityId)}',
  contractId: '${escTsString(descriptor.contractId)}',
  displayName: '${escTsString(descriptor.displayName)}',
  interactionMode: 'interactive' as const,
  rules: [
    { field: 'label', rule: 'required', message: '${escTsString(descriptor.displayName)} label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: 'Label must be at least 2 characters' },
    { field: 'label', rule: 'maxLength', value: 200, message: 'Label must be at most 200 characters' },
    { field: 'label', rule: 'pattern', message: 'Label contains invalid characters' },
  ],
} as const;

export interface ${pascal}ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validate${pascal}FormInput(input: ${pascal}FormInput): ${pascal}ValidationResult {
  const errors: string[] = [];
  const label = input.label?.trim() ?? '';
  if (label.length === 0) {
    errors.push(${constName}.rules[0].message);
  }
  if (label.length > 0 && label.length < 2) {
    errors.push(${constName}.rules[1].message);
  }
  if (label.length > 200) {
    errors.push(${constName}.rules[2].message);
  }
  if (label.length > 0 && !/^[\\w\\s\\-.,]+$/.test(label)) {
    errors.push(${constName}.rules[3].message);
  }
  return { valid: errors.length === 0, errors };
}

/** Backward-compatible export for feature contract reality checks */
export const ${descriptor.entityId.replace(/-/g, '_').toUpperCase()}_VALIDATION = ${constName};
export type ${pascal}ValidationRule = (typeof ${constName}.rules)[number];
`;
}
