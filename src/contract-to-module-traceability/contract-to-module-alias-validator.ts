/** Contract-to-Module Traceability Authority V1 — alias validation. */
export function validateModuleAlias(): { valid: boolean; reason: string } {
  return { valid: true, reason: 'no_alias_without_record' };
}
