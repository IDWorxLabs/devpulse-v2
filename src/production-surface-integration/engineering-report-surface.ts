/** Engineering report surface — current BuildContext fingerprints only. */
import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import type { BuildContext } from '../build-context-integrity/build-context-types.js';
import { fingerprintBuildContextValue } from '../build-context-integrity/build-context-fingerprint.js';

export interface EngineeringReportSurface {
  readonly readOnly: true;
  readonly buildContextId: string;
  readonly buildContextFingerprint: string;
  readonly approvedEnvelopeFingerprint: string;
  readonly cbgaFingerprint: string;
  readonly traceabilityFingerprint: string;
  readonly engineeringFingerprint: string;
  readonly referencesPreviousBuild: false;
  readonly fingerprint: string;
}

export function resolveEngineeringReportSurface(
  buildContext: BuildContext,
  envelope: ApprovedProductionBuildEnvelope,
): EngineeringReportSurface {
  const base = {
    buildContextId: buildContext.buildContextId,
    buildContextFingerprint: buildContext.fingerprint,
    approvedEnvelopeFingerprint: envelope.buildFingerprint,
    cbgaFingerprint: buildContext.cbgaFingerprint,
    traceabilityFingerprint: buildContext.traceabilityFingerprint,
    engineeringFingerprint: buildContext.engineeringFingerprint,
    referencesPreviousBuild: false as const,
  };
  return { readOnly: true, ...base, fingerprint: fingerprintBuildContextValue(base) };
}

export function engineeringReportReferencesPreviousBuild(
  reportText: string,
  previousFingerprints: readonly string[],
): boolean {
  return previousFingerprints.some((fingerprint) => fingerprint.length > 0 && reportText.includes(fingerprint));
}
