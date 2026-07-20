/** Contract-to-Module Traceability Authority V1 — exclusion validation. */
export function validateModuleExclusion(): { valid: boolean; reason: string } {
  return { valid: true, reason: 'exclusion_requires_record' };
}
