/** Runtime surface — current BuildContext + approved envelope only. */
import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import type { BuildContext } from '../build-context-integrity/build-context-types.js';
import { fingerprintBuildContextValue } from '../build-context-integrity/build-context-fingerprint.js';

export interface RuntimeSurface {
  readonly readOnly: true;
  readonly buildContextId: string;
  readonly approvedEnvelopeFingerprint: string;
  readonly runtimeFingerprint: string;
  readonly moduleIds: readonly string[];
  readonly fingerprint: string;
}

export function resolveRuntimeSurface(
  buildContext: BuildContext,
  envelope: ApprovedProductionBuildEnvelope,
): RuntimeSurface {
  const base = {
    buildContextId: buildContext.buildContextId,
    approvedEnvelopeFingerprint: envelope.buildFingerprint,
    runtimeFingerprint: buildContext.runtimeFingerprint,
    moduleIds: envelope.approvedModulePlan.moduleIds,
  };
  return { readOnly: true, ...base, fingerprint: fingerprintBuildContextValue(base) };
}
