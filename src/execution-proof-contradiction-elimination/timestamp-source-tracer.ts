/**
 * Phase 27.01 — Timestamp source tracer (V1).
 */

export function traceTimestampSource(input: {
  proofTimestamp: string | null;
  authoritativeProofTimestamp: string | null;
  authorityId: string;
  consumesRuntimeBridge: boolean;
}): { aligned: boolean; sourceChain: string; stale: boolean } {
  if (input.consumesRuntimeBridge) {
    return {
      aligned: true,
      sourceChain: `${input.authorityId} → timestamp:live-runtime-bridge`,
      stale: false,
    };
  }

  if (!input.proofTimestamp) {
    return {
      aligned: Boolean(input.authoritativeProofTimestamp),
      sourceChain: `${input.authorityId} → timestamp:SOURCE_NOT_DISCOVERABLE`,
      stale: false,
    };
  }

  const stale = Boolean(
    input.authoritativeProofTimestamp && input.proofTimestamp < input.authoritativeProofTimestamp,
  );
  const aligned = !stale && input.proofTimestamp === input.authoritativeProofTimestamp;

  return {
    aligned,
    stale,
    sourceChain: stale
      ? `${input.authorityId} → timestamp:stale(${input.proofTimestamp}<${input.authoritativeProofTimestamp})`
      : aligned
        ? `${input.authorityId} → timestamp:authoritative(${input.proofTimestamp})`
        : `${input.authorityId} → timestamp:cached(${input.proofTimestamp})`,
  };
}
