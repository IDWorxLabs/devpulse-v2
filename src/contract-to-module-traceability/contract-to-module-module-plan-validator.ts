/** Contract-to-Module Traceability Authority V1 — CBGA module plan completeness. */
import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';

export function validateCbgaModulePlanCompleteness(envelope: ApprovedProductionBuildEnvelope): string[] {
  const errors: string[] = [];
  if (envelope.approvedModulePlan.moduleEntries.length === 0) errors.push('CBGA_PLAN_OMITTED_FEATURE');
  for (const entry of envelope.approvedModulePlan.moduleEntries) {
    if (!entry.moduleId) errors.push('INVALID_MODULE_IDENTITY');
  }
  return errors;
}
