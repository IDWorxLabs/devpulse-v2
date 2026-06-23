/**
 * Phase 27.01 — Manifest source tracer (V1).
 */

export function traceManifestSource(input: {
  manifestId: string | null;
  authoritativeManifestId: string | null;
  authorityId: string;
}): { aligned: boolean; sourceChain: string; stale: boolean } {
  if (!input.manifestId) {
    return {
      aligned: true,
      sourceChain: `${input.authorityId} → manifest:runtime-bridge-derived`,
      stale: false,
    };
  }

  const stale = input.manifestId.includes('stale') || input.manifestId.includes('historical');
  const aligned =
    !stale &&
    (!input.authoritativeManifestId || input.manifestId === input.authoritativeManifestId);

  return {
    aligned,
    stale,
    sourceChain: stale
      ? `${input.authorityId} → manifest:historical(${input.manifestId})`
      : aligned
        ? `${input.authorityId} → manifest:authoritative(${input.manifestId})`
        : `${input.authorityId} → manifest:drift(${input.manifestId}≠${input.authoritativeManifestId})`,
  };
}
