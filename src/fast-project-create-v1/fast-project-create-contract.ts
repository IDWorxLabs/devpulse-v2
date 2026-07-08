/**
 * Fast Project Create V1 — shared request/response contract for UI and server.
 */

export const FAST_PROJECT_CREATE_CONTRACT_V1_PASS_TOKEN = 'FAST_PROJECT_CREATE_CONTRACT_V1_PASS';

/** Canonical request field order — first non-empty string wins. */
export const FAST_PROJECT_CREATE_REQUEST_NAME_FIELDS = ['projectName', 'name', 'requestedName'] as const;

export type FastProjectCreateRequestNameField = (typeof FAST_PROJECT_CREATE_REQUEST_NAME_FIELDS)[number];

export interface FastProjectCreateParsedRequest {
  name: string;
  summary?: string;
  confirmFreshCopy: boolean;
  forceFreshProject: boolean;
}

/**
 * Resolves the requested project name from any supported request field.
 * Priority: projectName → name → requestedName.
 */
export function resolveFastProjectCreateRequestedName(body: Record<string, unknown>): string {
  for (const field of FAST_PROJECT_CREATE_REQUEST_NAME_FIELDS) {
    const raw = body[field];
    if (typeof raw === 'string' && raw.trim()) {
      return raw.trim();
    }
  }
  return '';
}

export function parseFastProjectCreateRequestBody(
  body: Record<string, unknown>,
): FastProjectCreateParsedRequest {
  const name = resolveFastProjectCreateRequestedName(body);
  const summaryRaw = body.summary;
  return {
    name,
    summary: typeof summaryRaw === 'string' && summaryRaw.trim() ? summaryRaw.trim() : undefined,
    confirmFreshCopy: body.confirmFreshCopy === true,
    forceFreshProject: body.forceFreshProject === true,
  };
}
