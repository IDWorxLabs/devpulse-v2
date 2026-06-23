/**
 * Phase 26.91 — Authority manifest source auditor (V1).
 */

import type {
  AuthorityEvidenceRecord,
  AuthoritativeEvidenceSource,
} from './authority-evidence-source-realignment-types.js';

export function auditAuthorityManifestSources(input: {
  records: AuthorityEvidenceRecord[];
  authoritative: AuthoritativeEvidenceSource;
}): AuthorityEvidenceRecord[] {
  const { authoritative } = input;

  return input.records.map((record) => {
    const manifestStale = Boolean(
      record.manifestId &&
        authoritative.authoritativeManifestId &&
        record.manifestId !== authoritative.authoritativeManifestId,
    );

    let failureClass = record.failureClass;
    if (manifestStale && failureClass === 'NONE') {
      failureClass = 'STALE_MANIFEST';
    }

    return {
      ...record,
      manifestStale,
      evidenceStale: record.evidenceStale || manifestStale,
      failureClass,
    };
  });
}

export function resolveAuthoritativeManifestId(input: {
  buildManifestId?: string | null;
  connectedBuildManifestId?: string | null;
}): string | null {
  return input.buildManifestId ?? input.connectedBuildManifestId ?? null;
}

export function extractManifestIdFromDetail(detail: string): string | null {
  const match =
    detail.match(/manifest[:=\s]+([a-zA-Z0-9_-]+)/i) ??
    detail.match(/build-manifest-([a-zA-Z0-9_-]+)/i);
  return match?.[1] ?? null;
}
