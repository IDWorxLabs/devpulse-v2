/**
 * Universal Capability Pack Framework V1 — capability reporting.
 */

import type { CapabilityCompositionPlan, CapabilityPackMaterializationReport } from './universal-capability-pack-types.js';
import { UNIVERSAL_CAPABILITY_PACK_FRAMEWORK_VERSION } from './universal-capability-pack-types.js';
import type { PackBehaviorVerificationResult } from './capability-pack-behavior-verification.js';
import { getPack } from './capability-pack-registry.js';

export function buildCapabilityPackMaterializationReport(input: {
  plan: CapabilityCompositionPlan;
  verifications: readonly PackBehaviorVerificationResult[];
}): CapabilityPackMaterializationReport {
  const { plan, verifications } = input;
  const blocked = plan.blockedRequirements.length + plan.unresolvedRequirements.length;
  const verified = verifications.filter((v) => v.classification === 'BEHAVIORALLY_VERIFIED').length;
  const functionalReference = plan.selectedPacks.filter((p) => getPack(p.packId)?.supportStatus === 'FUNCTIONAL_REFERENCE').length;

  const executableRequired = plan.requirements.filter((r) => r.criticality !== 'INFORMATIONAL').length;
  const satisfiedRequired = plan.resolutions.filter((r) => r.outcome === 'SATISFIED').length;
  const verifiedSatisfied = plan.resolutions.filter(
    (r) =>
      r.outcome === 'SATISFIED' &&
      r.selectedPackId !== null &&
      verifications.some((v) => v.packId === r.selectedPackId && v.classification === 'BEHAVIORALLY_VERIFIED'),
  ).length;

  return {
    readOnly: true,
    engineVersion: UNIVERSAL_CAPABILITY_PACK_FRAMEWORK_VERSION,
    totalRequirements: plan.requirements.length,
    satisfiedRequirements: satisfiedRequired,
    blockedRequirements: blocked,
    selectedPacks: plan.selectedPacks.length,
    functionalReferencePacks: functionalReference,
    notImplementedPacks: plan.resolutions.filter((r) => r.candidates.some((c) => c.rejectionReason === 'pack_not_implemented')).length,
    behaviorallyVerifiedPacks: verified,
    capabilityCoveragePercent: executableRequired === 0 ? 100 : Math.min(100, Math.round((satisfiedRequired / executableRequired) * 100)),
    behavioralCoveragePercent: executableRequired === 0 ? 100 : Math.min(100, Math.round((verifiedSatisfied / executableRequired) * 100)),
    compositionPlan: plan,
    verifications: verifications.map((v) => ({ packId: v.packId, classification: v.classification, passed: v.passed })),
  };
}

export function computeCapabilityPackCoverageScore(report: CapabilityPackMaterializationReport): number {
  return report.behavioralCoveragePercent;
}
