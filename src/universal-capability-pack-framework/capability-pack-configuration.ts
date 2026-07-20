/**
 * Universal Capability Pack Framework V1 — typed pack configuration with B6 validation hooks.
 */

import type { CapabilityPackDescriptor, PackConfigurationSchema } from './universal-capability-pack-types.js';

export interface PackConfigurationIssue {
  readonly code: 'missing_pack_configuration' | 'invalid_pack_configuration' | 'missing_secret_reference';
  readonly field: string;
  readonly detail: string;
}

export function validatePackConfiguration(
  pack: CapabilityPackDescriptor,
  configuration: Readonly<Record<string, unknown>>,
): PackConfigurationIssue[] {
  const issues: PackConfigurationIssue[] = [];
  for (const field of pack.configurationSchema.fields) {
    const value = configuration[field.name];
    if (field.required && (value === undefined || value === null || value === '')) {
      issues.push({ code: 'missing_pack_configuration', field: field.name, detail: `Required configuration '${field.name}' is missing` });
      continue;
    }
    if (value === undefined) continue;
    if (field.secretReference && typeof value === 'string' && !value.startsWith('secret:')) {
      issues.push({ code: 'missing_secret_reference', field: field.name, detail: `Secret field '${field.name}' must use secret: reference, not raw value` });
    }
    if (field.type === 'number' && typeof value !== 'number') {
      issues.push({ code: 'invalid_pack_configuration', field: field.name, detail: `Expected number for '${field.name}'` });
    }
    if (field.type === 'boolean' && typeof value !== 'boolean') {
      issues.push({ code: 'invalid_pack_configuration', field: field.name, detail: `Expected boolean for '${field.name}'` });
    }
    if (field.type === 'string' && typeof value !== 'string') {
      issues.push({ code: 'invalid_pack_configuration', field: field.name, detail: `Expected string for '${field.name}'` });
    }
    if (field.type === 'string[]' && !Array.isArray(value)) {
      issues.push({ code: 'invalid_pack_configuration', field: field.name, detail: `Expected string[] for '${field.name}'` });
    }
  }
  return issues;
}

export function mergePackConfiguration(
  pack: CapabilityPackDescriptor,
  overrides: Readonly<Record<string, unknown>> = {},
): Record<string, unknown> {
  return { ...pack.defaultConfiguration, ...overrides };
}

export function configurationSchemaFingerprint(schema: PackConfigurationSchema): string {
  return schema.fields.map((f) => `${f.name}:${f.type}:${f.required}`).join('|');
}
